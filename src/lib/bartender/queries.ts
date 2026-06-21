import { createClient } from "@/lib/supabase/server";
import type { Categoria, Comanda, Mesa, ProdutoComVariantes } from "@/types/database";

export interface CategoriaComProdutos {
  categoria: Categoria;
  produtos: ProdutoComVariantes[];
}

const SEM_CATEGORIA: Categoria = {
  id: "sem-categoria",
  bar_id: "",
  nome: "Outros",
  ordem: Number.MAX_SAFE_INTEGER,
  ativo: true,
  created_at: "",
};

export async function getCardapio(barId: string): Promise<CategoriaComProdutos[]> {
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
      .eq("ativo", true)
      .order("nome", { ascending: true })
      .returns<ProdutoComVariantes[]>(),
  ]);

  const categoriasPorId = new Map<string, CategoriaComProdutos>();
  for (const categoria of categorias ?? []) {
    categoriasPorId.set(categoria.id, { categoria, produtos: [] });
  }

  let temSemCategoria = false;
  for (const produto of produtos ?? []) {
    // ordena variantes ativas por ordem
    produto.produto_variantes = (produto.produto_variantes ?? [])
      .filter(v => v.ativo)
      .sort((a, b) => a.ordem - b.ordem);

    const chave = produto.categoria_id ?? "sem-categoria";
    if (!categoriasPorId.has(chave)) {
      if (produto.categoria_id) continue;
      temSemCategoria = true;
      categoriasPorId.set(chave, { categoria: SEM_CATEGORIA, produtos: [] });
    }
    categoriasPorId.get(chave)!.produtos.push(produto);
  }

  const resultado = [...categoriasPorId.values()].filter((grupo) => grupo.produtos.length > 0);
  if (temSemCategoria) resultado.sort((a, b) => a.categoria.ordem - b.categoria.ordem);
  return resultado;
}

export interface MesaComStatus {
  mesa: Mesa;
  comandas: Comanda[]; // vazio = livre; múltiplas = cada pessoa tem a sua
}

/** Mesas ativas do bar, com TODAS as comandas abertas por mesa. */
export async function getMesasComStatus(barId: string, turnoId: string): Promise<MesaComStatus[]> {
  const supabase = await createClient();

  const [{ data: mesas }, { data: comandas }] = await Promise.all([
    supabase
      .from("mesas")
      .select("*")
      .eq("bar_id", barId)
      .eq("ativo", true)
      .order("numero", { ascending: true })
      .returns<Mesa[]>(),
    supabase
      .from("comandas")
      .select("*")
      .eq("bar_id", barId)
      .eq("turno_id", turnoId)
      .in("status", ["aberta", "aguardando_pagamento"])
      .order("aberta_em", { ascending: true })
      .returns<Comanda[]>(),
  ]);

  // Agrupa TODAS as comandas por mesa (múltiplas por mesa são válidas)
  const comandasPorMesa = new Map<string, Comanda[]>();
  for (const c of comandas ?? []) {
    if (c.mesa_id) {
      const lista = comandasPorMesa.get(c.mesa_id) ?? [];
      lista.push(c);
      comandasPorMesa.set(c.mesa_id, lista);
    }
  }

  return (mesas ?? []).map(mesa => ({
    mesa,
    comandas: comandasPorMesa.get(mesa.id) ?? [],
  }));
}

/** Comanda de balcão aberta (sem mesa_id). */
export async function getComandaBalcao(barId: string, turnoId: string): Promise<Comanda | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("*")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .in("status", ["aberta", "aguardando_pagamento"])
    .is("mesa_id", null)
    .order("aberta_em", { ascending: false })
    .limit(1)
    .maybeSingle<Comanda>();
  return data ?? null;
}

export async function getComandaById(comandaId: string): Promise<Comanda | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("*")
    .eq("id", comandaId)
    .maybeSingle<Comanda>();
  return data ?? null;
}

export interface ItemComanda {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export async function getItensComanda(comandaId: string): Promise<ItemComanda[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comanda_items")
    .select("id, produto_id, preco_unitario, preco_total, variante_nome, produtos(nome)")
    .eq("comanda_id", comandaId)
    .eq("status", "ativo")
    .order("adicionado_em", { ascending: true })
    .returns<{
      id: string;
      produto_id: string;
      preco_unitario: number;
      preco_total: number;
      variante_nome: string | null;
      produtos: { nome: string } | null;
    }[]>();

  return (data ?? []).map((item) => {
    const nomeBase = item.produtos?.nome ?? "Produto";
    return {
      id: item.id,
      produtoId: item.produto_id,
      produtoNome: item.variante_nome ? `${nomeBase} — ${item.variante_nome}` : nomeBase,
      quantidade: 1,
      precoUnitario: item.preco_unitario,
      precoTotal: item.preco_total,
    };
  });
}

export interface ItemAgrupado {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  ultimoItemId: string;
}

export function agruparItens(itens: ItemComanda[]): ItemAgrupado[] {
  const porProduto = new Map<string, ItemAgrupado>();
  for (const item of itens) {
    const atual = porProduto.get(item.produtoId) ?? ({
      produtoId: item.produtoId,
      produtoNome: item.produtoNome,
      quantidade: 0,
      precoUnitario: item.precoUnitario,
      precoTotal: 0,
      ultimoItemId: item.id,
    } satisfies ItemAgrupado);
    atual.quantidade += 1;
    atual.precoTotal += item.precoTotal;
    atual.ultimoItemId = item.id;
    porProduto.set(item.produtoId, atual);
  }
  return [...porProduto.values()];
}
