import { createAdminClient } from "@/lib/supabase/admin";
import type { Destaque } from "@/types/database";

/** Banners de destaque do bar. Página do cliente é pública → admin client
 *  (bypassa RLS; é só conteúdo de vitrine, sem dado sensível). */
export async function getDestaques(barId: string): Promise<Destaque[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("destaques")
    .select("*")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  return data ?? [];
}
