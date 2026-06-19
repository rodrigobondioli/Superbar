import type { TopDrink } from "@/lib/dashboard/queries";

export type CategoriaMenu = "star" | "cash_cow" | "slow" | "problema" | "sem_dados";

export interface ProdutoCategorizado extends TopDrink {
  margemPercentual: number | null;
  categoria: CategoriaMenu;
}

/**
 * Categorização tipo menu engineering, calculada no app a partir do que já
 * foi vendido no turno — nada disso é persistido, é só leitura.
 *
 * Volume e margem são comparados contra a MÉDIA do próprio turno (não um
 * limiar fixo), então a classificação se ajusta ao volume de cada bar/dia:
 *   - volume baixo (< média do turno)              → slow
 *   - volume alto + margem negativa (custo > preço) → problema
 *   - volume alto + margem ≥ média do turno         → star
 *   - volume alto + margem positiva abaixo da média → cash_cow
 *   - sem custo cadastrado                          → sem_dados
 */
export function categorizarProdutos(produtos: TopDrink[]): ProdutoCategorizado[] {
  const comMargem = produtos.map((produto) => ({
    ...produto,
    margemPercentual:
      produto.custo != null ? ((produto.preco - produto.custo) / produto.preco) * 100 : null,
  }));

  if (produtos.length === 0) return [];

  const mediaQuantidade =
    produtos.reduce((acc, p) => acc + p.quantidadeVendida, 0) / produtos.length;

  const comDados = comMargem.filter((p) => p.margemPercentual !== null);
  const mediaMargem =
    comDados.length > 0
      ? comDados.reduce((acc, p) => acc + (p.margemPercentual ?? 0), 0) / comDados.length
      : 0;

  return comMargem.map((produto): ProdutoCategorizado => {
    if (produto.margemPercentual === null) {
      return { ...produto, categoria: "sem_dados" };
    }

    const volumeAlto = produto.quantidadeVendida >= mediaQuantidade;
    if (!volumeAlto) return { ...produto, categoria: "slow" };
    if (produto.margemPercentual < 0) return { ...produto, categoria: "problema" };
    if (produto.margemPercentual >= mediaMargem) return { ...produto, categoria: "star" };
    return { ...produto, categoria: "cash_cow" };
  });
}

/**
 * CMV (Custo de Mercadoria Vendida) % = custo total dos itens vendidos /
 * faturamento desses mesmos itens. Só entram produtos com `custo`
 * cadastrado — incluir um item sem custo no faturamento mas não no custo
 * sub-estimaria o CMV artificialmente.
 */
export function calcularCmv(produtos: TopDrink[]): number | null {
  const comCusto = produtos.filter((p) => p.custo != null);
  if (comCusto.length === 0) return null;

  const custoTotal = comCusto.reduce((acc, p) => acc + (p.custo as number) * p.quantidadeVendida, 0);
  const faturamentoTotal = comCusto.reduce((acc, p) => acc + p.faturamento, 0);

  return faturamentoTotal > 0 ? Math.round((custoTotal / faturamentoTotal) * 10000) / 100 : null;
}
