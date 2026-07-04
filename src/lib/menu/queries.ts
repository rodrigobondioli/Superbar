import { createAdminClient } from "@/lib/supabase/admin";

/** IDs dos produtos mais pedidos do bar (últimos 90 dias), do mais pro menos.
 *  Página do cliente é pública → admin client (bypassa RLS; é só popularidade). */
export async function getTopPedidos(barId: string, limit = 5): Promise<string[]> {
  const supabase = createAdminClient();
  const desde = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("comanda_items")
    .select("produto_id, quantidade")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .gte("adicionado_em", desde)
    .returns<{ produto_id: string; quantidade: number }[]>();

  const total = new Map<string, number>();
  for (const it of data ?? []) {
    total.set(it.produto_id, (total.get(it.produto_id) ?? 0) + Number(it.quantidade ?? 1));
  }

  return [...total.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
