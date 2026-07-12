import {
  getTurnoAtual,
  getKpisTurno,
  getProdutosVendidosTurno,
  getKpisComparacao,
  getAlertasEstoque,
} from "@/lib/dashboard/queries";
import { categorizarProdutos, calcularCoberturaReceita } from "@/lib/dashboard/menu-engineering";
import { gerarInsight, type InsightItem } from "@/lib/dashboard/insights";

// Prioridade de exibição: dinheiro primeiro. Ação > oportunidade > info; dentro
// disso, maior impacto em R$ no topo. É a régua do Few (organizar por importância)
// e do Princípio 1 (o que decide dinheiro manda).
const PESO_TIPO: Record<InsightItem["tipo"], number> = { action: 0, opportunity: 1, info: 2 };

function prioridade(a: InsightItem, b: InsightItem): number {
  if (PESO_TIPO[a.tipo] !== PESO_TIPO[b.tipo]) return PESO_TIPO[a.tipo] - PESO_TIPO[b.tipo];
  return Math.abs(b.impactoReais ?? 0) - Math.abs(a.impactoReais ?? 0);
}

/**
 * Insights atuais do bar, calculados AO VIVO — o cérebro da Central de
 * Inteligência. A Central é a camada de DINHEIRO (margem, CMV, ticket, custo),
 * não de operação: pico/mix/tempos são estado do turno e vivem no Operação ao
 * Vivo. Nada é persistido nem exige ação do dono — o insight aparece quando a
 * condição é verdade e some quando deixa de ser. Zero gestão manual.
 */
export async function getInsightsAtuais(barId: string): Promise<InsightItem[]> {
  const turno = await getTurnoAtual(barId);
  if (!turno) return [];

  const [kpis, produtosVendidos, alertas] = await Promise.all([
    getKpisTurno(turno),
    getProdutosVendidosTurno(barId, turno.id),
    getAlertasEstoque(barId),
  ]);

  const comparacao = await getKpisComparacao(barId, turno, kpis, alertas.length, produtosVendidos);
  const produtosCategorizados = categorizarProdutos(produtosVendidos);
  const cobertura = calcularCoberturaReceita(produtosVendidos);

  const insights = gerarInsight({
    produtosCategorizado: produtosCategorizados,
    cmvTrend: comparacao.cmv,
    ticketMedioTrend: comparacao.ticketMedio,
    cmvParcial: cobertura.status !== "confiavel",
    ticketMedio: kpis.ticketMedio,
    faturamento: kpis.faturamento,
  });

  return [...insights].sort(prioridade);
}
