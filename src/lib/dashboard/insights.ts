import type { ProdutoCategorizado } from "@/lib/dashboard/menu-engineering";

export interface InsightItem {
  texto: string;
  tipo: "action" | "opportunity" | "info";
  contexto?: string;      // explica o baseline de comparação ("Comparado ao último turno.")
  sugestao?: string;
  impactoReais?: number;  // negativo = perda, positivo = ganho (estimativa)
}

interface GerarInsightParams {
  produtosCategorizado: ProdutoCategorizado[];
  cmvTrend: number | null;
  ticketMedioTrend: number | null;
  cmvParcial: boolean;
  // Para calcular impacto em R$
  ticketMedio: number;
  faturamento: number;
}

export function gerarInsight({
  produtosCategorizado,
  cmvTrend,
  ticketMedioTrend,
  cmvParcial,
  ticketMedio,
  faturamento,
}: GerarInsightParams): InsightItem[] {
  const insights: InsightItem[] = [];

  // Margem × volume: produto com maior margem não está no top 3 de quantidade
  const comMargemPositiva = produtosCategorizado.filter(
    (p) => p.margemPercentual !== null && p.margemPercentual > 0
  );
  if (comMargemPositiva.length > 1) {
    const [maiorMargem] = [...comMargemPositiva].sort(
      (a, b) => (b.margemPercentual ?? 0) - (a.margemPercentual ?? 0)
    );
    const top3Ids = [...produtosCategorizado]
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
      .slice(0, 3)
      .map((p) => p.produtoId);
    if (!top3Ids.includes(maiorMargem.produtoId)) {
      insights.push({
        texto: `${maiorMargem.produtoNome} tem a maior margem do turno, mas não está entre os 3 mais vendidos.`,
        tipo: "opportunity",
        sugestao: "Considere treinar o time para sugerir esse produto ativamente.",
      });
    }
  }

  // CMV subiu vs turno anterior.
  // GUARDA DE SANIDADE (negocio.md — "anomalia sem validação é ruído"): uma
  // variação turno-a-turno acima de ~50% é quase sempre artefato de baseline
  // pequeno (turno anterior quase vazio), não sinal real. Não alertamos com lixo.
  const CMV_TREND_MAX = 50;
  if (cmvTrend !== null && cmvTrend >= 5 && cmvTrend <= CMV_TREND_MAX) {
    // Custo extra estimado = faturamento × (delta CMV / 100).
    // Só exibe o R$ se plausível: não dá pra "arriscar" mais que o faturado.
    const bruto = faturamento > 0 ? -Math.round(faturamento * (cmvTrend / 100)) : undefined;
    const impacto = bruto !== undefined && Math.abs(bruto) <= faturamento ? bruto : undefined;
    insights.push({
      texto: `CMV subiu ${cmvTrend.toFixed(1)}%`,
      contexto: "Comparado ao último turno.",
      tipo: "action",
      sugestao: "Revise o custo dos produtos mais vendidos neste turno.",
      impactoReais: impacto,
    });
  }

  // Ticket médio caiu vs turno anterior. Mesma guarda: queda abaixo de -70% é
  // artefato, não realidade.
  if (ticketMedioTrend !== null && ticketMedioTrend <= -5 && ticketMedioTrend >= -70) {
    // Receita não capturada: delta de ticket × total de comandas estimado
    let impacto: number | undefined;
    if (ticketMedio > 0 && faturamento > 0) {
      const fator = 1 + ticketMedioTrend / 100; // ex.: 0.773 quando caiu 22.7%
      if (fator > 0) {
        const ticketAnterior = ticketMedio / fator;
        const totalComandas = Math.round(faturamento / ticketMedio);
        const bruto = -Math.round((ticketAnterior - ticketMedio) * totalComandas);
        // Só exibe se plausível: não pode perder mais do que faturou.
        if (Math.abs(bruto) <= faturamento) impacto = bruto;
      }
    }
    insights.push({
      texto: `Ticket médio caiu ${Math.abs(ticketMedioTrend).toFixed(1)}%`,
      contexto: "Comparado ao último turno.",
      tipo: "action",
      sugestao: "Observe se houve aumento de vendas de itens de menor valor.",
      impactoReais: impacto,
    });
  }

  // Drinks com margem negativa (categoria "problema")
  const problemas = produtosCategorizado.filter((p) => p.categoria === "problema");
  if (problemas.length === 1) {
    insights.push({
      texto: `${problemas[0].produtoNome} está sendo vendido com margem negativa.`,
      tipo: "action",
      sugestao: "Revise o preço de venda ou o custo de produção desse item.",
    });
  } else if (problemas.length > 1) {
    insights.push({
      texto: `${problemas.length} produtos com margem negativa: ${problemas.map((p) => p.produtoNome).join(", ")}.`,
      tipo: "action",
      sugestao: "Revise preço ou custo de cada um antes do próximo turno.",
    });
  }

  // Sem custo cadastrado em todos os produtos vendidos
  if (cmvParcial) {
    insights.push({
      texto: "Alguns produtos não têm custo cadastrado. Cadastre a ficha técnica para ter o CMV preciso.",
      tipo: "info",
    });
  }

  return insights;
}
