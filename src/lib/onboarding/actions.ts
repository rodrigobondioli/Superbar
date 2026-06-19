"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingResult = { error: string } | null;

function toSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function criarBar(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Nome do bar é obrigatório." };

  const nomeUsuario = String(formData.get("nome_usuario") ?? "").trim();

  const admin = createAdminClient();

  // Garante que o profile existe (pode não existir se o trigger falhou)
  if (nomeUsuario) {
    await admin
      .from("profiles")
      .upsert({ id: auth.user.id, nome: nomeUsuario, email: auth.user.email ?? "" })
      .eq("id", auth.user.id);
  }

  // Tenta inserir com slug limpo; em caso de conflito, adiciona sufixo único
  const slugBase = toSlug(nome);
  const slug = slugBase || `bar-${Date.now()}`;

  const { data: bar, error: barError } = await admin
    .from("bars")
    .insert({ nome, slug, configuracoes: {}, ativo: true })
    .select("id")
    .single<{ id: string }>();

  let barId: string;

  if (barError || !bar) {
    // Slug duplicado ou outro erro — tenta com sufixo
    const { data: bar2, error: err2 } = await admin
      .from("bars")
      .insert({ nome, slug: `${slug}-${Date.now()}`, configuracoes: {}, ativo: true })
      .select("id")
      .single<{ id: string }>();

    if (err2 || !bar2) return { error: "Erro ao criar o bar. Tente novamente." };
    barId = bar2.id;
  } else {
    barId = bar.id;
  }

  // Vincula o usuário como dono
  const { error: memberError } = await admin
    .from("bar_members")
    .insert({
      bar_id: barId,
      user_id: auth.user.id,
      role: "dono",
      ativo: true,
      nome: nomeUsuario || null,
    });

  if (memberError) return { error: "Erro ao vincular usuário ao bar." };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
