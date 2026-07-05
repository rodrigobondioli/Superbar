import { createClient } from "@/lib/supabase/server";
import type { Destaque } from "@/types/database";

export async function getDestaques(barId: string): Promise<Destaque[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("destaques")
    .select("*")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .returns<Destaque[]>();
  return data ?? [];
}
