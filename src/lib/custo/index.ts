/**
 * Regra ÚNICA de custo do SUPERBAR (Fase 0 — Princípio 10).
 *
 * Uma fonte da verdade para "quanto custa produzir um item". Todo cálculo de
 * custo/margem/CMV passa por aqui — nada de reimplementar a regra em cada tela.
 *
 * Precedência (do mais preciso ao mais simples):
 *   1. Ficha de ingredientes (receitas) — soma Σ quantidade × custo do insumo.
 *   2. Custo direto da variante pedida (produto_variantes.custo).
 *   3. Custo direto do produto (produtos.custo).
 *
 * A ficha, quando existe, é a verdade; o custo direto é o cache/fallback.
 * Item fechado = ficha de 1 linha. Comida/petisco = custo direto. Drink = ficha.
 */

export type CustoStatus = "sem" | "sugerida" | "confirmada";

/** Uma linha de ficha já resolvida com o custo unitário do insumo. */
export interface LinhaFichaCusto {
  quantidade: number;
  /** custo por unidade base do insumo (ingredientes.custo_atual) */
  custoUnitario: number;
}

/**
 * Custo calculado a partir da ficha de ingredientes.
 * Retorna null quando não há ficha (nenhuma linha) — sinal para cair no fallback.
 */
export function custoDaFicha(linhas: LinhaFichaCusto[] | null | undefined): number | null {
  if (!linhas || linhas.length === 0) return null;
  const total = linhas.reduce((acc, l) => acc + l.quantidade * l.custoUnitario, 0);
  return Math.round(total * 10000) / 10000;
}

/**
 * Custo efetivo de um item vendido, aplicando a precedência completa.
 * @param custoFicha   resultado de custoDaFicha() (ou null se sem ficha)
 * @param custoVariante produto_variantes.custo da variante pedida (ou null)
 * @param custoProduto  produtos.custo (ou null)
 */
export function custoEfetivo(
  custoFicha: number | null | undefined,
  custoVariante: number | null | undefined,
  custoProduto: number | null | undefined,
): number | null {
  if (custoFicha != null) return custoFicha;
  if (custoVariante != null) return custoVariante;
  if (custoProduto != null) return custoProduto;
  return null;
}

/** Margem em R$ (preço − custo). null se não há custo. */
export function margem(preco: number, custo: number | null | undefined): number | null {
  if (custo == null) return null;
  return Math.round((preco - custo) * 100) / 100;
}

/** Margem em % sobre o preço de venda. null se não há custo ou preço ≤ 0. */
export function margemPercentual(preco: number, custo: number | null | undefined): number | null {
  if (custo == null || preco <= 0) return null;
  return ((preco - custo) / preco) * 100;
}

/**
 * Status de confiança efetivo de um item: a variante manda quando existe
 * (tem custo/ficha próprios); senão, o do produto.
 */
export function custoStatusEfetivo(
  statusVariante: CustoStatus | null | undefined,
  statusProduto: CustoStatus | null | undefined,
): CustoStatus {
  return statusVariante ?? statusProduto ?? "sem";
}
