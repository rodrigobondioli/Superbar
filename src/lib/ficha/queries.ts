import { createClient } from "@/lib/supabase/server";
import type { UnidadeInsumo } from "@/lib/ficha/sugestao-types";
import type { CustoStatus } from "@/types/database";

/** Drink (produto sem variante) que ainda não tem ficha/custo confirmado.
 *  Alvos do lote-guiado. Produtos com variante ficam de fora (ficha é por variante).
 *  quantidadeVendida: total já vendido — usado para PRIORIZAR (mais vendido sem
 *  ficha é onde a margem cega mais dói; o dono resolve esse primeiro). */
export interface DrinkParaFicha {
  id: string;
  nome: string;
  preco: number;
  quantidadeVendida: number;
}

export async function getDrinksParaFicha(barId: string): Promise<DrinkParaFicha[]> {
  const supabase = await createClient();
  const [{ data }, { data: receitas }, { data: vendas }] = await Promise.all([
    supabase
      .from("produtos")
      .select("id, nome, preco, custo_status, produto_variantes ( id, ativo )")
      .eq("bar_id", barId)
      .eq("ativo", true)
      .order("nome", { ascending: true })
      .returns<{ id: string; nome: string; preco: number; custo_status: CustoStatus; produto_variantes: { id: string; ativo: boolean }[] | null }[]>(),
    supabase
      .from("receitas")
      .select("produto_id")
      .eq("bar_id", barId)
      .is("variante_id", null)
      .returns<{ produto_id: string }[]>(),
    supabase
      .from("comanda_items")
      .select("produto_id, quantidade")
      .eq("bar_id", barId)
      .is("cancelado_em", null)
      .returns<{ produto_id: string; quantidade: number }[]>(),
  ]);

  // "Tem ficha de verdade" = existe receita E o custo está confirmado.
  const comFichaOk = new Set((receitas ?? []).map((r) => r.produto_id));

  // Volume vendido por produto (para priorizar).
  const vendidoPorProduto = new Map<string, number>();
  for (const v of vendas ?? []) {
    vendidoPorProduto.set(v.produto_id, (vendidoPorProduto.get(v.produto_id) ?? 0) + Number(v.quantidade));
  }

  return (data ?? [])
    .filter((p) => !(p.produto_variantes ?? []).some((v) => v.ativo)) // só sem variante
    .filter((p) => !(comFichaOk.has(p.id) && p.custo_status === "confirmada")) // pendente = sem ficha real confirmada
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      preco: Number(p.preco),
      quantidadeVendida: vendidoPorProduto.get(p.id) ?? 0,
    }))
    // Mais vendido primeiro; empate resolve por nome (ordem estável do fetch).
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);
}

/** Uma linha da ficha, do jeito que o editor precisa. */
export interface FichaLinha {
  ingredienteId: string | null; // insumo existente no estoque, ou null se novo
  nome: string; // papel/nome do insumo
  quantidade: number;
  unidade: UnidadeInsumo;
  custoUnitario: number | null; // custo por unidade base (ingredientes.custo_atual)
}

export interface FichaAtual {
  linhas: FichaLinha[];
  custoStatus: CustoStatus;
}

/**
 * Carrega a ficha de um produto (variante_id null) ou de uma variante.
 * Não compõe comuns+variante — cada ficha é o próprio conjunto de linhas.
 */
export async function getFicha(
  barId: string,
  produtoId: string,
  varianteId: string | null,
): Promise<FichaAtual> {
  const supabase = await createClient();

  let q = supabase
    .from("receitas")
    .select("quantidade, ingrediente_id, ingredientes ( nome, unidade, custo_atual )")
    .eq("bar_id", barId)
    .eq("produto_id", produtoId);
  q = varianteId ? q.eq("variante_id", varianteId) : q.is("variante_id", null);

  const { data } = await q.returns<
    {
      quantidade: number;
      ingrediente_id: string;
      ingredientes: { nome: string; unidade: UnidadeInsumo; custo_atual: number } | null;
    }[]
  >();

  const linhas: FichaLinha[] = (data ?? [])
    .filter((r) => r.ingredientes)
    .map((r) => ({
      ingredienteId: r.ingrediente_id,
      nome: r.ingredientes!.nome,
      quantidade: Number(r.quantidade),
      unidade: r.ingredientes!.unidade,
      custoUnitario: Number(r.ingredientes!.custo_atual),
    }));

  // status do custo: variante manda quando for uma variante
  const tabela = varianteId ? "produto_variantes" : "produtos";
  const id = varianteId ?? produtoId;
  const { data: alvo } = await supabase
    .from(tabela)
    .select("custo_status")
    .eq("id", id)
    .maybeSingle<{ custo_status: CustoStatus }>();

  return { linhas, custoStatus: alvo?.custo_status ?? "sem" };
}
