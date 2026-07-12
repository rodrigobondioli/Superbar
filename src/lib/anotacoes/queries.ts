import { createAdminClient } from "@/lib/supabase/admin";
import type { Anotacao, AnotacaoTipo } from "@/types/database";

/** Anotação já com o nome do bar de origem resolvido (para ticket/sugestão). */
export interface AnotacaoComBar extends Anotacao {
  bar_nome: string | null;
}

/** Lista anotações de um tipo (mais recentes primeiro). Só via admin (service-role). */
export async function listarAnotacoes(tipo: AnotacaoTipo): Promise<AnotacaoComBar[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("anotacoes")
    .select("*, bars(nome)")
    .eq("tipo", tipo)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as (Anotacao & { bars: { nome: string } | null })[]).map((a) => ({
    ...a,
    bar_nome: a.bars?.nome ?? null,
  }));
}

/** Contagem de itens em aberto por tipo — para os badges das abas/sidebar. */
export async function contarAnotacoesAbertas(): Promise<{ ticket: number; sugestao: number; total: number }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("anotacoes")
    .select("tipo")
    .eq("status", "aberto")
    .in("tipo", ["ticket", "sugestao"]);
  const rows = (data as { tipo: AnotacaoTipo }[] | null) ?? [];
  const ticket = rows.filter((r) => r.tipo === "ticket").length;
  const sugestao = rows.filter((r) => r.tipo === "sugestao").length;
  return { ticket, sugestao, total: ticket + sugestao };
}
