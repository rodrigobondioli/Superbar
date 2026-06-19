"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import type { PagamentoMetodo } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function semTipo<T>(q: T): any { return q; }

export async function registrarPagamento(
  comandaId: string,
  metodo: PagamentoMetodo,
) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) return { error: "Nenhum turno aberto." };

  const supabase = await createClient();

  // Busca a comanda
  const { data: comanda } = await semTipo(supabase.from("comandas"))
    .select("id, total, status")
    .eq("id", comandaId)
    .eq("bar_id", current.bar.id)
    .maybeSingle() as { data: { id: string; total: number; status: string } | null };

  if (!comanda) return { error: "Comanda não encontrada." };
  if (comanda.status !== "aguardando_pagamento") return { error: "Comanda não está aguardando pagamento." };

  // Insere pagamento
  await semTipo(supabase.from("pagamentos")).insert({
    comanda_id: comandaId,
    bar_id: current.bar.id,
    turno_id: turno.id,
    valor: comanda.total,
    metodo,
    status: "confirmado",
    processado_por: current.userId,
    processado_em: new Date().toISOString(),
  });

  // Marca comanda como paga
  await semTipo(supabase.from("comandas"))
    .update({ status: "paga" })
    .eq("id", comandaId);

  // Atualiza totais do turno
  await semTipo(supabase.from("turnos"))
    .update({
      total_vendas: turno.total_vendas + comanda.total,
      total_comandas: turno.total_comandas + 1,
    })
    .eq("id", turno.id);

  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
}
