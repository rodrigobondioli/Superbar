"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import type { PagamentoMetodo } from "@/types/database";

export async function registrarPagamento(
  comandaId: string,
  metodo: PagamentoMetodo,
  incluirServico: boolean,
  motivo?: string,
) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) return { error: "Nenhum turno aberto." };

  const supabase = await createClient();

  // Busca a comanda
  const { data: comanda } = await supabase.from("comandas")
    .select("id, total, status")
    .eq("id", comandaId)
    .eq("bar_id", current.bar.id)
    .maybeSingle() as { data: { id: string; total: number; status: string } | null };

  if (!comanda) return { error: "Comanda não encontrada." };
  if (comanda.status !== "aguardando_pagamento") return { error: "Comanda não está aguardando pagamento." };

  // Taxa de serviço (opcional — cortesia nunca aplica)
  const aplicarServico = incluirServico && metodo !== "cortesia";
  const servicoValor   = aplicarServico
    ? Math.round(comanda.total * 0.10 * 100) / 100
    : null;
  const totalPago = comanda.total + (servicoValor ?? 0);

  // Insere pagamento
  await supabase.from("pagamentos").insert({
    comanda_id: comandaId,
    bar_id: current.bar.id,
    turno_id: turno.id,
    valor: comanda.total,
    taxa_servico_pct:   aplicarServico ? 10 : null,
    taxa_servico_valor: servicoValor,
    metodo,
    status: "confirmado",
    processado_por: current.userId,
    processado_em: new Date().toISOString(),
    referencia: motivo ?? null,
  });

  // Marca comanda como paga
  await supabase.from("comandas")
    .update({ status: "paga" })
    .eq("id", comandaId);

  // Atualiza totais do turno (inclui taxa de serviço no faturado)
  await supabase.rpc("incrementar_total_turno", {
    p_turno_id: turno.id,
    p_valor: totalPago,
  });

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
}
