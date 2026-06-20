"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function removerMembro(membroId: string) {
  const current = await assertDono();
  const supabase = await createClient();
  await supabase.from("bar_members")
    .delete()
    .eq("id", membroId)
    .eq("bar_id", current.bar.id);
  revalidatePath("/dashboard/equipe");
}

export type ConvidarState = {
  error?: string;
  ok?: boolean;
  tipo?: "convite" | "direto";
} | null;

export async function convidarMembro(
  _prev: ConvidarState,
  formData: FormData,
): Promise<ConvidarState> {
  const nome      = (formData.get("nome")      as string ?? "").trim();
  const sobrenome = (formData.get("sobrenome") as string ?? "").trim();
  const email     = (formData.get("email")     as string ?? "").trim();
  const role      = formData.get("role") as BarRole;

  if (!nome && !email) return { error: "Informe pelo menos o nome do membro." };
  if (!role) return { error: "Selecione uma função." };

  const nomeCompleto = [nome, sobrenome].filter(Boolean).join(" ") || null;

  try {
    const current = await getCurrentBar();
    if (!current) return { error: "Não autenticado." };
    if (current.role !== "dono" && current.role !== "gerente")
      return { error: "Sem permissão." };

    const supabase = await createClient();

    // Sem e-mail — cria direto como membro sem conta (sem convite)
    if (!email) {
      await supabase.from("bar_members")
        .insert({ bar_id: current.bar.id, role, nome: nomeCompleto, ativo: true });
      revalidatePath("/dashboard/equipe");
      return { ok: true, tipo: "direto" };
    }

    // Com e-mail — verifica se já tem conta (profiles = usuários que fizeram cadastro próprio)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle() as { data: { id: string } | null };

    if (profile) {
      // Usuário existente — vincula diretamente, sem email de convite
      const { data: existing } = await supabase.from("bar_members")
        .select("id, ativo")
        .eq("bar_id", current.bar.id)
        .eq("user_id", profile.id)
        .maybeSingle() as { data: { id: string; ativo: boolean } | null };

      if (existing) {
        if (existing.ativo) return { error: "Esse usuário já faz parte da equipe." };
        await supabase.from("bar_members")
          .update({ ativo: true, role, ...(nomeCompleto ? { nome: nomeCompleto } : {}) })
          .eq("id", existing.id);
      } else {
        await supabase.from("bar_members").insert({
          bar_id: current.bar.id,
          user_id: profile.id,
          role,
          ativo: true,
          ...(nomeCompleto ? { nome: nomeCompleto } : {}),
        });
      }

      revalidatePath("/dashboard/equipe");
      return { ok: true, tipo: "direto" };
    }

    // Novo usuário — cria linha pendente (user_id=null, ativo=false) e envia email de convite
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) return { error: "NEXT_PUBLIC_APP_URL não configurado no servidor." };

    const { data: pendingRow, error: insertError } = await supabase.from("bar_members")
      .insert({
        bar_id: current.bar.id,
        role,
        nome: nomeCompleto ?? email.split("@")[0],
        ativo: false,
      })
      .select("id")
      .single() as { data: { id: string } | null; error: unknown };

    if (insertError || !pendingRow?.id) return { error: "Erro ao criar registro pendente." };

    const adminClient = createAdminClient();
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { bar_id: current.bar.id, role, bar_member_id: pendingRow.id },
      redirectTo: `${appUrl}/aceitar-convite`,
    });

    if (inviteError) {
      // Rollback: remove linha pendente se o email falhou
      await supabase.from("bar_members").delete().eq("id", pendingRow.id);
      return { error: "Erro ao enviar convite: " + inviteError.message };
    }

    revalidatePath("/dashboard/equipe");
    return { ok: true, tipo: "convite" };
  } catch {
    return { error: "Erro inesperado. Tente novamente." };
  }
}
