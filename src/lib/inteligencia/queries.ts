import { createClient } from "@/lib/supabase/server";

export async function countInsightsPendentes(barId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("bar_id", barId)
    .eq("lido", false);

  return count ?? 0;
}

// ─── Stage de inteligência ─────────────────────────────────────────────────

export type InteligenciaStage =
  | { stage: 1; comandas: number; diasAtivo: number }
  | { stage: 2; insightsNaoLidos: number };

/**
 * Determina o estágio de inteligência do bar.
 * Threshold: 30 comandas históricas (volume de sinal, não tempo).
 */
export async function getInteligenciaStage(barId: string): Promise<InteligenciaStage> {
  const supabase = await createClient();

  const [{ count: totalComandas }, { count: insightsNaoLidos }, { data: bar }] = await Promise.all([
    supabase
      .from("comandas")
      .select("id", { count: "exact", head: true })
      .eq("bar_id", barId),
    supabase
      .from("insights")
      .select("id", { count: "exact", head: true })
      .eq("bar_id", barId)
      .eq("lido", false),
    supabase
      .from("bars")
      .select("created_at")
      .eq("id", barId)
      .single(),
  ]);

  const comandas = totalComandas ?? 0;
  const diasAtivo = bar?.created_at
    ? Math.floor((Date.now() - new Date(bar.created_at).getTime()) / 86_400_000)
    : 0;

  if (comandas < 30) {
    return { stage: 1, comandas, diasAtivo };
  }

  return { stage: 2, insightsNaoLidos: insightsNaoLidos ?? 0 };
}
