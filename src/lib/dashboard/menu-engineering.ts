import type { TopDrink } from "@/lib/dashboard/queries";
import { margemPercentual } from "@/lib/custo";

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
    margemPercentual: margemPercentual(produto.preco, produto.custo),
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

// ─── Cobertura de custo ─────────────────────────────────────────────────────

export type CmvStatus = "indisponivel" | "estimado" | "confiavel";

export interface CoberturaReceita {
  /** 0–100: % da receita do período com custo cadastrado */
  cobertura: number;
  status: CmvStatus;
}

/**
 * Cobertura ponderada por receita — não conta produtos, pesa pela receita.
 * Só custo CONFIRMADO conta: um custo sugerido pela IA é estimativa, não pode
 * inflar a confiança do CMV (Princípio 9 — não prometer o que não existe).
 * Regra:   < 50% → indisponivel | 50–79% → estimado | 80%+ → confiavel
 */
export function calcularCoberturaReceita(produtos: TopDrink[]): CoberturaReceita {
  const faturamentoTotal = produtos.reduce((acc, p) => acc + p.faturamento, 0);
  if (faturamentoTotal === 0) return { cobertura: 0, status: "indisponivel" };

  const faturamentoComCusto = produtos
    .filter((p) => p.custo != null && p.custoStatus === "confirmada")
    .reduce((acc, p) => acc + p.faturamento, 0);

  const cobertura = Math.round((faturamentoComCusto / faturamentoTotal) * 100);
  const status: CmvStatus =
    cobertura >= 80 ? "confiavel" : cobertura >= 50 ? "estimado" : "indisponivel";

  return { cobertura, status };
}

// ─── CMV ────────────────────────────────────────────────────────────────────

/**
 * CMV (Custo de Mercadoria Vendida) % = custo total dos itens vendidos /
 * faturamento desses mesmos itens. Só entram produtos com custo CONFIRMADO —
 * custo estimado (IA) ou ausente ficaria de fora para não fabricar um CMV
 * que parece real sem ser (prefere silêncio a número incorreto).
 */
export function calcularCmv(produtos: TopDrink[]): number | null {
  const comCusto = produtos.filter((p) => p.custo != null && p.custoStatus === "confirmada");
  if (comCusto.length === 0) return null;

  const custoTotal = comCusto.reduce((acc, p) => acc + (p.custo as number) * p.quantidadeVendida, 0);
  const faturamentoTotal = comCusto.reduce((acc, p) => acc + p.faturamento, 0);

  return faturamentoTotal > 0 ? Math.round((custoTotal / faturamentoTotal) * 10000) / 100 : null;
}
