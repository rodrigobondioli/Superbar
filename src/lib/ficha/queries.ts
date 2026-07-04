import { createClient } from "@/lib/supabase/server";
import type { UnidadeInsumo } from "@/lib/ficha/sugestao-types";
import type { CustoStatus } from "@/types/database";

/** Drink (produto sem variante) que ainda não tem ficha/custo confirmado.
 *  Alvos do lote-guiado. Produtos com variante ficam de fora (ficha é por variante). */
export interface DrinkParaFicha {
  id: string;
  nome: string;
  preco: number;
}

export async function getDrinksParaFicha(barId: string): Promise<DrinkParaFicha[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos")
    .select("id, nome, preco, produto_variantes ( id, ativo )")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .neq("custo_status", "confirmada")
    .order("nome", { ascending: true })
    .returns<{ id: string; nome: string; preco: number; produto_variantes: { id: string; ativo: boolean }[] | null }[]>();

  return (data ?? [])
    .filter((p) => !(p.produto_variantes ?? []).some((v) => v.ativo))
    .map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco) }));
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
