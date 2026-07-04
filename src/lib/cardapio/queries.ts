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

    const chave = p.categoria_id ?? "__sem__";
    if (!map.has(chave) && p.categoria_id) continue;
    if (!map.has(chave)) map.set(chave, {
      categoria: { id: "__sem__", bar_id: barId, nome: "Sem categoria", ordem: 999, ativo: true, imagem_url: null, created_at: "" },
      produtos: [],
    });
    map.get(chave)!.produtos.push(p);
  }

  return [...map.values()];
}
