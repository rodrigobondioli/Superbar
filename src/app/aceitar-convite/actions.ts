"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProcessarConviteResult = { role: string } | { error: string };

/**
 * Chamado pela página /aceitar-convite após o usuário definir a senha.
 * Usa o admin client para bypassar RLS e atualizar/criar a linha em bar_members.
 */
export async function processarConvite(): Promise<ProcessarConviteResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Sessão inválida. Clique no link do email novamente." };
  }

  const meta = user.user_metadata as {
    bar_id?: string;
    role?: string;
    bar_member_id?: string;
  };

  if (!meta.bar_id || !meta.role) {
    return { error: "Dados do convite incompletos. Solicite um novo convite ao dono do bar." };
  }

  const admin = createAdminClient();

  if (meta.bar_member_id) {
    // Atualiza a linha pendente criada em convidarMembro
    const { error } = await admin.from("bar_members")
      .update({ user_id: user.id, ativo: true })
      .eq("id", meta.bar_member_id);
    if (error) return { error: "Erro ao ativar acesso: " + error.message };
  } else {
    // Caminho sem linha pendente — verifica se já é membro e insere se não for
    const { data: existing } = await admin.from("bar_members")
      .select("id")
      .eq("bar_id", meta.bar_id)
      .eq("user_id", user.id)
      .maybeSingle() as { data: { id: string } | null };

    if (!existing) {
      const { error } = await admin.from("bar_members").insert({
        bar_id: meta.bar_id,
        user_id: user.id,
        role: meta.role,
        ativo: true,
      });
      if (error) return { error: "Erro ao configurar acesso: " + error.message };
    }
  }

  return { role: meta.role };
}
