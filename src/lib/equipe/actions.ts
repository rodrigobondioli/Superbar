"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import type { BarRole } from "@/types/database";

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
  await supabase.from("bar_members")
    .update({ role: novoRole })
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function desativarMembro(membroId: string) {
  const current = await assertDono();
  const supabase = await createClient();
  await supabase.from("bar_members")
    .update({ ativo: false })
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function reativarMembro(membroId: string) {
  const current = await assertDono();
  const supabase = await createClient();
  await supabase.from("bar_members")
    .update({ ativo: true })
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export async function removerMembro(membroId: string): Promise<{ ok: true } | { error: string }> {
  try {
    const current = await assertDono();
    const supabase = await createClient();
    const { error } = await supabase.from("bar_members")
      .delete()
      .eq("id", membroId)
      .eq("bar_id", current.bar.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Erro ao remover membro." };
  }
}

export async function renomearMembro(
  membroId: string,
  novoNome: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const current = await assertDono();
    const supabase = await createClient();
    const { error } = await supabase
      .from("bar_members")
      .update({ nome: novoNome.trim() })
      .eq("id", membroId)
      .eq("bar_id", current.bar.id);
    if (error) throw error;
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Erro ao renomear membro." };
  }
}

export async function atualizarFotoMembro(
  membroId: string,
  fotoUrl: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const current = await assertDono();
    const supabase = await createClient();
    const { error } = await supabase
      .from("bar_members")
      .update({ foto_url: fotoUrl })
      .eq("id", membroId)
      .eq("bar_id", current.bar.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar foto." };
  }
}

export type AdicionarState = {
  error?: string;
  ok?: boolean;
} | null;

/**
 * Adiciona membro diretamente à equipe — sem convite, sem email, sem Supabase Auth.
 * Operadores (bartender, garçom, caixa) não têm conta: user_id = NULL.
 * Dono/gerente que precisam de login se cadastram pelo fluxo normal de auth.
 */
export async function adicionarMembro(
  _prev: AdicionarState,
  formData: FormData,
): Promise<AdicionarState> {
  const nome      = (formData.get("nome")      as string ?? "").trim();
  const sobrenome = (formData.get("sobrenome") as string ?? "").trim();
  const role      = formData.get("role") as BarRole;

  const nomeCompleto = [nome, sobrenome].filter(Boolean).join(" ");
  if (!nomeCompleto) return { error: "Informe o nome do membro." };
  if (!role)         return { error: "Selecione uma função." };

  try {
    const current = await getCurrentBar();
    if (!current) return { error: "Não autenticado." };
    if (current.role !== "dono" && current.role !== "gerente")
      return { error: "Sem permissão." };

    const supabase = await createClient();
    const { error } = await supabase.from("bar_members").insert({
      bar_id: current.bar.id,
      role,
      nome:   nomeCompleto,
      ativo:  true,
    });

    if (error) return { error: error.message };
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch {
    return { error: "Erro inesperado. Tente novamente." };
  }
}
