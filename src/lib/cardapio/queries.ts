import { createClient } from "@/lib/supabase/server";
import type { Categoria, ProdutoComVariantes } from "@/types/database";

export interface CategoriaComProdutosAdmin {
  categoria: Categoria;
  produtos: ProdutoComVariantes[]; // inclui inativos para gestão
}

export async function getCardapioAdmin(barId: string): Promise<CategoriaComProdutosAdmin[]> {
  const supabase = await createClient();

  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("*")
      .eq("bar_id", barId)
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .returns<Categoria[]>(),
    supabase
      .from("produtos")
      .select("*, produto_variantes(*)")
      .eq("bar_id", barId)
      .order("nome", { ascending: true })
      .returns<ProdutoComVariantes[]>(),
  ]);

  const map = new Map<string, CategoriaComProdutosAdmin>();
  for (const c of categorias ?? []) {
    map.set(c.id, { categoria: c, produtos: [] });
  }

  for (const p of produtos ?? []) {
    // ordena variantes por ordem
    p.produto_variantes = (p.produto_variantes ?? [])
      .filter(v => v.ativo)
      .sort((a, b) => a.ordem - b.ordem);

    // Categoria inativa/apagada → o produto vira órfão. No ADMIN ele NÃO pode
    // sumir (some do produto que ainda vende): cai em "Sem categoria" pra ser
    // visto, editado e reatribuído.
    let chave = p.categoria_id ?? "__sem__";
    if (!map.has(chave)) chave = "__sem__";
    if (!map.has(chave)) map.set(chave, {
      categoria: { id: "__sem__", bar_id: barId, nome: "Sem categoria", ordem: 999, ativo: true, imagem_url: null, created_at: "" },
      produtos: [],
    });
    map.get(chave)!.produtos.push(p);
  }

  return [...map.values()];
}

/** IDs (produto sem-variante OU variante) que TÊM ficha de ingredientes cadastrada.
 *  Usado pra colorir o botão "Ficha": verde só quando há receita de verdade,
 *  não só um custo direto solto. */
export async function getIdsComFicha(barId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("receitas")
    .select("produto_id, variante_id")
    .eq("bar_id", barId)
    .returns<{ produto_id: string; variante_id: string | null }[]>();
  const set = new Set<string>();
  for (const r of data ?? []) set.add(r.variante_id ?? r.produto_id);
  return set;
}
