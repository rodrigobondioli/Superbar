"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { traduzirErro } from "@/lib/utils";

/** Quem conta estoque: quem lida com a prateleira. Garçom/caixa ficam de fora. */
const ROLES_CONTAGEM = ["dono", "gerente", "bar_manager", "bartender"];

export type EstoqueResult = { ok: true } | { error: string } | null;

// Entrada/saída/ajuste manual de um INSUMO (ingredientes/ingrediente_movimentos).
// Antes escrevia na tabela legada `estoque`; agora opera no mesmo sistema da NF-e
// e da contagem. Admin client + guard de role (padrão das actions de insumo).
export async function registrarMovimento(
  ingredienteId: string,
  formData: FormData
): Promise<EstoqueResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  if (!ROLES_CONTAGEM.includes(current.role)) return { error: "Sem permissão para mexer no estoque." };

  const quantidadeStr = String(formData.get("quantidade") ?? "").replace(",", ".");
  const tipo = String(formData.get("tipo") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  const custoStr = String(formData.get("custo_unitario") ?? "").replace(",", ".");
  const custoUnitario = custoStr ? parseFloat(custoStr) : null;

  const quantidade = parseFloat(quantidadeStr);
  if (isNaN(quantidade) || quantidade <= 0) return { error: "Quantidade inválida." };
  if (!["compra", "ajuste", "perda", "devolucao"].includes(tipo)) return { error: "Tipo inválido." };

  const admin = createAdminClient();

  const { data: ing } = await admin
    .from("ingredientes")
    .select("estoque_atual, custo_atual")
    .eq("id", ingredienteId)
    .eq("bar_id", current.bar.id)
    .maybeSingle<{ estoque_atual: number; custo_atual: number }>();

  if (!ing) return { error: "Insumo não encontrado." };

  const anterior = Number(ing.estoque_atual);
  // Compra e devolução somam; perda subtrai (piso 0); ajuste define o total absoluto.
  const posterior =
    tipo === "ajuste" ? quantidade :
    tipo === "perda"  ? Math.max(anterior - quantidade, 0) :
    anterior + quantidade; // compra, devolucao
  const delta = posterior - anterior;

  const temCusto = tipo === "compra" && custoUnitario !== null && !isNaN(custoUnitario);
  const patch: Record<string, unknown> = { estoque_atual: posterior, atualizado_em: new Date().toISOString() };
  if (temCusto) patch.custo_atual = custoUnitario; // compra com custo atualiza o custo do insumo (CMV)

  const { error: updateError } = await admin.from("ingredientes")
    .update(patch)
    .eq("id", ingredienteId)
    .eq("bar_id", current.bar.id);

  if (updateError) return { error: traduzirErro(updateError.message) };

  // Movimento (log imutável). ingrediente_movimentos.tipo só aceita entrada|venda|
  // ajuste (CHECK). Entrada = compra/devolução (qtd positiva); perda vira ajuste
  // negativo (não é venda — sem receita). Ajuste = delta assinado.
  const movTipo = (tipo === "compra" || tipo === "devolucao") ? "entrada" : "ajuste";
  const movQtd = movTipo === "entrada" ? quantidade : delta;
  const { error: movError } = await admin.from("ingrediente_movimentos").insert({
    bar_id: current.bar.id,
    ingrediente_id: ingredienteId,
    tipo: movTipo,
    quantidade: movQtd,
    custo_unitario: temCusto ? custoUnitario : ing.custo_atual,
    criado_por: current.userId,
    motivo: motivo ?? (tipo === "perda" ? "Perda / quebra" : null),
    criado_em: new Date().toISOString(),
  });
  if (movError) console.error("registrarMovimento: falha ao gravar movimento", movError);

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
    .in("id", ids);

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
  ingredienteId: string,
  formData: FormData
): Promise<EstoqueResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  if (!ROLES_CONTAGEM.includes(current.role)) return { error: "Sem permissão para mexer no estoque." };

  const minimoStr = String(formData.get("quantidade_minima") ?? "").replace(",", ".");
  const minimo = parseFloat(minimoStr);
  if (isNaN(minimo) || minimo < 0) return { error: "Valor inválido." };

  const admin = createAdminClient();
  const { error } = await admin.from("ingredientes")
    .update({ estoque_minimo: minimo })
    .eq("id", ingredienteId)
    .eq("bar_id", current.bar.id);

  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard");
  return { ok: true };
}
