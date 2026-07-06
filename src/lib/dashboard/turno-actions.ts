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
  // Usa admin client em tudo: RLS pode bloquear o SELECT mesmo com turno existente,
  // fazendo o INSERT falhar por conflito. Admin garante visibilidade total.
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("turnos")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await admin
    .from("turnos")
    .insert({ bar_id: barId, abertura_por: userId, status: "aberto", aberto_em: new Date().toISOString() })
    .select("*")
    .single();

  if (!error) return data;

  // Corrida: outro dispositivo criou o turno entre o SELECT e o INSERT. O índice
  // único parcial (turnos_um_aberto_por_bar) rejeita o segundo INSERT — em vez de
  // falhar, relemos e devolvemos o turno vencedor. Um turno aberto por bar, sempre.
  const { data: turnoConcorrente } = await admin
    .from("turnos")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .maybeSingle();

  if (turnoConcorrente) return turnoConcorrente;

  console.error("[getOuCriarTurno] falha ao criar turno:", error.message, { barId, userId });
  return null;
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
