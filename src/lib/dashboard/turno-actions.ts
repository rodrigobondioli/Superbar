"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";

/**
 * Retorna o turno aberto ou cria um automaticamente.
 * Usa admin client no INSERT para garantir que RLS nunca bloqueie
 * a criação automática — o bar_id garante o isolamento por tenant.
 */
export async function getOuCriarTurno(
  barId: string,
  userId: string,
) {
  const turno = await getTurnoAtual(barId);
  if (turno) return turno;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("turnos")
    .insert({ bar_id: barId, abertura_por: userId, status: "aberto" })
    .select("*")
    .single();

  if (error) {
    console.error("[getOuCriarTurno] falha ao criar turno:", error.message, { barId, userId });
    return null;
  }

  return data;
}

export async function abrirTurno() {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turnoExistente = await getTurnoAtual(current.bar.id);
  if (turnoExistente) return { error: "Já existe um turno aberto." };

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").insert({
    bar_id: current.bar.id,
    abertura_por: current.userId,
    status: "aberto",
  });

  if (error) return { error: "Erro ao abrir turno." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/turnos");
  revalidatePath("/caixa");
}

export async function fecharTurno(turnoId: string) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const supabase = await createClient();

  // Verifica se há comandas ainda abertas
  const { count } = await supabase.from("comandas")
    .select("id", { count: "exact", head: true })
    .eq("turno_id", turnoId)
    .in("status", ["aberta", "aguardando_pagamento"]);

  if (count && count > 0) {
    return { error: `Há ${count} comanda${count > 1 ? "s" : ""} ainda aberta${count > 1 ? "s" : ""}. Feche todas antes de encerrar o turno.` };
  }

  await supabase.from("turnos")
    .update({
      status: "fechado",
      fechado_em: new Date().toISOString(),
      fechamento_por: current.userId,
    })
    .eq("id", turnoId)
    .eq("status", "aberto");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/turnos");
  revalidatePath("/caixa");
}
