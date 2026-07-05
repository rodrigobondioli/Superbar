"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function abrirComandaCliente(
  mesaId: string,
  barId: string,
  nomeCliente: string,
  telefoneCliente?: string,
): Promise<{ comandaId: string } | { error: string }> {
  const supabase = createAdminClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!turno) {
    return { error: "Bar fechado no momento. Sem turno ativo." };
  }

  const telefone = telefoneCliente?.replace(/\D/g, "") || null;

  const { data: comanda, error } = await supabase
    .from("comandas")
    .insert({
      bar_id: barId,
      turno_id: turno.id,
      mesa_id: mesaId,
      nome_cliente: nomeCliente.trim(),
      telefone_cliente: telefone,
      status: "aberta",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !comanda) {
    console.error("abrirComandaCliente: falha no insert de comanda", error);
    return { error: "Não foi possível abrir a comanda. Tente novamente." };
  }

  return { comandaId: comanda.id };
}

export async function buscarComandaPorTelefone(
  telefone: string,
  mesaId: string,
  barId: string,
): Promise<{ comandaId: string; nomeCliente: string } | { error: string }> {
  const supabase = createAdminClient();

  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 10) return { error: "Telefone inválido." };

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!turno) return { error: "Bar fechado no momento." };

  const { data: comanda } = await supabase
    .from("comandas")
    .select("id, nome_cliente")
    .eq("bar_id", barId)
    .eq("turno_id", turno.id)
    .eq("mesa_id", mesaId)
    .eq("telefone_cliente", digits)
    .eq("status", "aberta")
    .order("aberta_em", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; nome_cliente: string | null }>();

  if (!comanda) return { error: "Nenhuma comanda encontrada para este número nesta mesa." };

  return { comandaId: comanda.id, nomeCliente: comanda.nome_cliente ?? "Cliente" };
}

export async function chamarAtendimento(
  mesaId: string,
  barId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!turno) return { error: "Bar fechado." };

  await supabase.from("chamadas").insert({
    bar_id: barId,
    mesa_id: mesaId,
    turno_id: turno.id,
    status: "pendente",
  });

  return { ok: true };
}
