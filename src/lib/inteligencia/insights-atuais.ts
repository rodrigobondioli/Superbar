import {
  getTurnoAtual,
  getKpisTurno,
  getProdutosVendidosTurno,
  getKpisComparacao,
  getAlertasEstoque,
} from "@/lib/dashboard/queries";
import {
  getHorarioPico,
  calcularPico,
  getRankingMesas,
  getMixPagamento,
  getTempoMedioPreparo,
  gerarInsightsOperacionais,
} from "@/lib/dashboard/operacao";
import { categorizarProdutos, calcularCoberturaReceita } from "@/lib/dashboard/menu-engineering";
import { gerarInsight, type InsightItem } from "@/lib/dashboard/insights";

/**
 * Insights atuais do bar, calculados AO VIVO (turno + tendência) — o cérebro da
 * Central de Inteligência. Nada é persistido nem exige ação do dono: a Central
 * reflete a realidade de agora — o insight aparece quando a condição é verdade
 * e some sozinho quando deixa de ser. Zero gestão manual (Princípio 1 + 11).
 *
 * Reúne os mesmos sinais que o home já calcula (gerarInsight +
 * gerarInsightsOperacionais) num único lugar reutilizável.
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

  const insightsMargem = gerarInsight({
    produtosCategorizado: produtosCategorizados,
    cmvTrend: comparacao.cmv,
    ticketMedioTrend: comparacao.ticketMedio,
    cmvParcial: cobertura.status !== "confiavel",
    ticketMedio: kpis.ticketMedio,
    faturamento: kpis.faturamento,
  });

  const [pontosHora, mesas, mix, tempos] = await Promise.all([
    getHorarioPico(barId, turno.id),
    getRankingMesas(barId, turno.id),
    getMixPagamento(barId, turno.id),
    getTempoMedioPreparo(barId, turno.id),
  ]);

  const insightsOperacionais = gerarInsightsOperacionais({
    pico: calcularPico(pontosHora),
    mesas,
    mix,
    tempos,
    faturamentoTurno: kpis.faturamento,
  });

  return [...insightsOperacionais, ...insightsMargem];
}
