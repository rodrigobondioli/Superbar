"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { traduzirErro } from "@/lib/utils";
import type { MovimentoTipo } from "@/types/database";

/** Quem conta estoque: quem lida com a prateleira. Garçom/caixa ficam de fora. */
const ROLES_CONTAGEM = ["dono", "gerente", "bar_manager", "bartender"];

export type EstoqueResult = { ok: true } | { error: string } | null;

export async function registrarMovimento(
  estoqueId: string,
  formData: FormData
): Promise<EstoqueResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const quantidadeStr = String(formData.get("quantidade") ?? "").replace(",", ".");
  const tipo = String(formData.get("tipo") ?? "") as MovimentoTipo;
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  const custoStr = String(formData.get("custo_unitario") ?? "").replace(",", ".");
  const custoUnitario = custoStr ? parseFloat(custoStr) : null;

  const quantidade = parseFloat(quantidadeStr);
  if (isNaN(quantidade) || quantidade <= 0) return { error: "Quantidade inválida." };
  if (!["compra", "ajuste", "perda", "devolucao"].includes(tipo)) return { error: "Tipo inválido." };

  const supabase = await createClient();

  // Lê estoque atual
  const { data: estoque } = await supabase
    .from("estoque")
    .select("quantidade_atual, bar_id")
    .eq("id", estoqueId)
    .eq("bar_id", current.bar.id)
    .maybeSingle<{ quantidade_atual: number; bar_id: string }>();

  if (!estoque) return { error: "Item de estoque não encontrado." };

  const anterior = Number(estoque.quantidade_atual);
  // Compra e devolução somam; perda subtrai; ajuste define o valor absoluto
  const posterior =
    tipo === "ajuste" ? quantidade :
    tipo === "perda"  ? Math.max(anterior - quantidade, 0) :
    anterior + quantidade; // compra, devolucao

  // Atualiza quantidade
  const { error: updateError } = await supabase.from("estoque")
    .update({ quantidade_atual: posterior })
    .eq("id", estoqueId);

  if (updateError) return { error: traduzirErro(updateError.message) };

  // Registra movimento (log imutável)
  await supabase.from("estoque_movimentos").insert({
    bar_id: current.bar.id,
    produto_id: null, // preenchido via join no estoque
    tipo,
    quantidade,
    quantidade_anterior: anterior,
    quantidade_posterior: posterior,
    referencia_tipo: "estoque",
    referencia_id: estoqueId,
    motivo,
    ...(custoUnitario !== null && !isNaN(custoUnitario) ? { custo_unitario: custoUnitario } : {}),
    criado_por: current.userId,
    criado_em: new Date().toISOString(),
  });

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Contagem de insumos (re-baseline do estoque) ────────────────────────────

export interface ContagemLinha {
  ingredienteId: string;
  contado: number;                    // já na unidade-base
  tamanhoEmbalagem?: number | null;   // persistir no insumo (se informado na tela)
  unidadeCompra?: string | null;
}

export interface ContagemResultado {
  nome: string;
  unidade: string;
  unidadeCompra: string | null;       // rótulo ("garrafa") pra exibir o diff na unidade natural
  tamanho: number | null;             // base por embalagem
  anterior: number;
  contado: number;
  diff: number;      // contado − anterior (negativo = sistema tinha a mais)
  impacto: number;   // diff × custo_atual (R$)
}

export type SalvarContagemResult =
  | { ok: true; itens: ContagemResultado[]; totalImpacto: number; ajustados: number }
  | { error: string };

/**
 * Salva uma contagem física: ajusta ingredientes.estoque_atual para o valor
 * contado e grava um movimento 'ajuste' (audit trail imutável). Só mexe nos
 * insumos efetivamente enviados — insumo não contado NÃO é zerado.
 */
export async function salvarContagem(linhas: ContagemLinha[]): Promise<SalvarContagemResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  if (!ROLES_CONTAGEM.includes(current.role)) return { error: "Sem permissão para contar estoque." };

  const validas = linhas.filter((l) => Number.isFinite(l.contado) && l.contado >= 0);
  if (validas.length === 0) return { error: "Nenhum insumo contado." };

  // Admin client (untyped) — mesmo padrão das actions de NF-e para as tabelas de
  // insumo. Segurança garantida pelo guard de role + escopo explícito por bar_id.
  const admin = createAdminClient();
  const ids = validas.map((l) => l.ingredienteId);

  const { data: insumos } = await admin
    .from("ingredientes")
    .select("id, nome, unidade, estoque_atual, custo_atual, tamanho_embalagem, unidade_compra")
    .eq("bar_id", current.bar.id)
    .in("id", ids)
    .returns<{ id: string; nome: string; unidade: string; estoque_atual: number; custo_atual: number; tamanho_embalagem: number | null; unidade_compra: string | null }[]>();

  const porId = new Map((insumos ?? []).map((i) => [i.id, i]));
  const agora = new Date().toISOString();

  const itens: ContagemResultado[] = [];
  for (const l of validas) {
    const ins = porId.get(l.ingredienteId);
    if (!ins) continue;

    const anterior = Number(ins.estoque_atual);
    const contado = Number(l.contado);
    const diff = contado - anterior;

    // Persiste o tamanho da embalagem informado na tela (pra lembrar da próxima vez).
    const patch: Record<string, unknown> = { estoque_atual: contado, atualizado_em: agora };
    const tamanhoInformado = l.tamanhoEmbalagem != null && l.tamanhoEmbalagem > 0;
    if (tamanhoInformado) {
      patch.tamanho_embalagem = l.tamanhoEmbalagem;
      patch.unidade_compra = l.unidadeCompra ?? "garrafa";
    }

    const { error: upErr } = await admin
      .from("ingredientes")
      .update(patch)
      .eq("id", ins.id)
      .eq("bar_id", current.bar.id);
    if (upErr) return { error: traduzirErro(upErr.message) };

    if (diff !== 0) {
      await admin.from("ingrediente_movimentos").insert({
        bar_id: current.bar.id,
        ingrediente_id: ins.id,
        tipo: "ajuste",
        quantidade: diff,
        custo_unitario: ins.custo_atual,
        criado_por: current.userId,
        motivo: "Contagem física",
        criado_em: agora,
      });
    }

    itens.push({
      nome: ins.nome,
      unidade: ins.unidade,
      unidadeCompra: tamanhoInformado ? (l.unidadeCompra ?? "garrafa") : ins.unidade_compra,
      tamanho: tamanhoInformado ? Number(l.tamanhoEmbalagem) : ins.tamanho_embalagem,
      anterior,
      contado,
      diff,
      impacto: diff * Number(ins.custo_atual),
    });
  }

  itens.sort((a, b) => Math.abs(b.impacto) - Math.abs(a.impacto));
  const totalImpacto = itens.reduce((s, r) => s + r.impacto, 0);
  const ajustados = itens.filter((r) => r.diff !== 0).length;

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard");
  return { ok: true, itens, totalImpacto, ajustados };
}

export async function atualizarMinimo(
  estoqueId: string,
  formData: FormData
): Promise<EstoqueResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const minimoStr = String(formData.get("quantidade_minima") ?? "").replace(",", ".");
  const minimo = parseFloat(minimoStr);
  if (isNaN(minimo) || minimo < 0) return { error: "Valor inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("estoque")
    .update({ quantidade_minima: minimo })
    .eq("id", estoqueId)
    .eq("bar_id", current.bar.id);

  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard");
  return { ok: true };
}
