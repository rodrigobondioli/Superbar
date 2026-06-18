"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import type { BarRole } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function semTipo<T>(q: T): any { return q; }

async function assertDono() {
  const current = await getCurrentBar();
  if (!current) throw new Error("Não autenticado");
  if (current.role !== "dono" && current.role !== "gerente")
    throw new Error("Sem permissão");
  return current;
}

export async function alterarRole(membroId: string, novoRole: BarRole) {
  const current = await assertDono();
  const supabase = await createClient();
  await semTipo(supabase.from("bar_members"))
    .update({ role: novoRole })
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function desativarMembro(membroId: string) {
  const current = await assertDono();
  const supabase = await createClient();
  await semTipo(supabase.from("bar_members"))
    .update({ ativo: false })
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function reativarMembro(membroId: string) {
  const current = await assertDono();
  const supabase = await createClient();
  await semTipo(supabase.from("bar_members"))
    .update({ ativo: true })
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function removerMembro(membroId: string) {
  const current = await assertDono();
  const supabase = await createClient();
  await semTipo(supabase.from("bar_members"))
    .delete()
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function convidarMembro(formData: FormData) {
  const email = formData.get("email") as string;
  const role  = formData.get("role") as BarRole;
  if (!email || !role) throw new Error("Email e role obrigatórios");

  const current = await assertDono();
  const supabase = await createClient();

  // Verifica se o usuário já existe no sistema
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle() as { data: { id: string } | null };

  if (!profile) {
    // Usuário não existe ainda — retorna instrução para o dono
    throw new Error("Usuário não encontrado. Peça para ele criar conta primeiro em app.superbar.com.br/login");
  }

  // Verifica se já é membro
  const { data: existing } = await semTipo(supabase.from("bar_members"))
    .select("id, ativo")
    .eq("bar_id", current.bar.id)
    .eq("user_id", profile.id)
    .maybeSingle() as { data: { id: string; ativo: boolean } | null };

  if (existing) {
    if (existing.ativo) throw new Error("Esse usuário já faz parte da equipe");
    // Reativa
    await semTipo(supabase.from("bar_members"))
      .update({ ativo: true, role })
      .eq("id", existing.id);
  } else {
    await semTipo(supabase.from("bar_members"))
      .insert({ bar_id: current.bar.id, user_id: profile.id, role });
  }

  revalidatePath("/dashboard/equipe");
}
