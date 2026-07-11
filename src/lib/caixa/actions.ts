"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import type { PagamentoMetodo } from "@/types/database";

type CaixaClient = Awaited<ReturnType<typeof createClient>>;

type RegistrarPagamentoResult = {
  ok: boolean;
  total?: number;
  total_pago?: number;
  cliente_id?: string | null;
  visitas?: number | null;
} | null;

export async function registrarPagamento(
  comandaId: string,
  metodo: PagamentoMetodo,
  incluirServico: boolean,
  motivo?: string,
) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) return { error: "Erro ao iniciar turno." };

  const supabase = await createClient();
  const taxaPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;

  // Pagamento TRANSACIONAL (P0-1): marca comanda paga + registra pagamento +
  // incrementa turno + agregados do cliente numa transação só. Falha parcial
  // reverte tudo — nunca fica comanda paga sem lançamento. Mantém a guarda
  // anti-pagamento-duplo (a 2ª chamada simultânea recebe ok:false).
  const res = await supabase
    .rpc("registrar_pagamento", {
      p_comanda_id:      comandaId,
      p_bar_id:          current.bar.id,
      p_turno_id:        turno.id,
      p_metodo:          metodo,
      p_incluir_servico: incluirServico,
      p_taxa_pct:        taxaPct,
      p_user_id:         current.userId,
      p_member_id:       current.atribuicaoMemberId,
      p_referencia:      motivo ?? null,
    })
    .single();

  if (res.error) {
    console.error("registrarPagamento: falha no RPC transacional", res.error);
    return { error: "Não foi possível registrar o pagamento. Tente novamente." };
  }

  const rpc = res.data as RegistrarPagamentoResult;
  if (!rpc?.ok) return { error: "Comanda não encontrada ou já foi paga." };

  // Drink favorito — best-effort, NÃO-crítico (fora da transação financeira).
  // Se falhar, nenhum valor é afetado.
  if (rpc.cliente_id && (rpc.visitas ?? 0) >= 5) {
    await detectarDrinkFavorito(supabase, current.bar.id, rpc.cliente_id);
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clientes");
}

/**
 * Paga todas as comandas de uma mesa. Cada comanda é paga por uma transação
 * atômica independente (registrar_pagamento). Erros parciais são tolerados
 * (ex.: comanda já paga por race) sem afetar as demais.
 */
export async function registrarPagamentosMesa(
  comandaIds: string[],
  metodo: PagamentoMetodo,
  incluirServico: boolean,
  motivo?: string,
) {
  if (!comandaIds.length) return;

  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) return { error: "Erro ao iniciar turno." };

  const supabase = await createClient();
  const taxaPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;

  for (const comandaId of comandaIds) {
    const res = await supabase
      .rpc("registrar_pagamento", {
        p_comanda_id:      comandaId,
        p_bar_id:          current.bar.id,
        p_turno_id:        turno.id,
        p_metodo:          metodo,
        p_incluir_servico: incluirServico,
        p_taxa_pct:        taxaPct,
        p_user_id:         current.userId,
        p_member_id:       current.atribuicaoMemberId,
        p_referencia:      motivo ?? null,
      })
      .single();

    if (res.error) {
      console.error("registrarPagamentosMesa: falha no RPC", comandaId, res.error);
      continue; // não interrompe as demais comandas da mesa
    }

    const rpc = res.data as RegistrarPagamentoResult;
    if (!rpc?.ok) continue; // já paga ou não encontrada — tolera

    if (rpc.cliente_id && (rpc.visitas ?? 0) >= 5) {
      await detectarDrinkFavorito(supabase, current.bar.id, rpc.cliente_id);
    }
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clientes");
}

/**
 * Detecta o drink favorito do cliente (best-effort, não-financeiro):
 * se o produto mais pedido aparece em ≥5 comandas pagas E em ≥50% das visitas,
 * grava como drink_favorito. Só sobrescreve quando o threshold é atingido.
 */
async function detectarDrinkFavorito(
  supabase: CaixaClient,
  barId: string,
  clienteId: string,
) {
  const { data: cmdIds } = await supabase
    .from("comandas")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("bar_id", barId)
    .eq("status", "paga");

  const ids = (cmdIds ?? []).map((c) => c.id);
  if (ids.length < 5) return;

  type ItemRow = { produto_id: string | null; comanda_id: string | null; produtos: { nome: string } | null };
  const { data: items } = await supabase
    .from("comanda_items")
    .select("produto_id, comanda_id, produtos(nome)")
    .in("comanda_id", ids)
    .neq("status", "cancelado") as { data: ItemRow[] | null };

  // Conta em quantas comandas distintas cada produto apareceu.
  const porComanda = new Map<string, Set<string>>();
  for (const item of items ?? []) {
    const nome = item.produtos?.nome;
    if (!nome || !item.comanda_id) continue;
    if (!porComanda.has(nome)) porComanda.set(nome, new Set());
    porComanda.get(nome)!.add(item.comanda_id);
  }

  let topNome = "";
  let topCount = 0;
  for (const [nome, set] of porComanda) {
    if (set.size > topCount) { topCount = set.size; topNome = nome; }
  }

  if (topNome && topCount >= 5 && topCount / ids.length >= 0.5) {
    await supabase.from("clientes").update({ drink_favorito: topNome }).eq("id", clienteId);
  }
}
