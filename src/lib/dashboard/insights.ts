import type { ProdutoCategorizado } from "@/lib/dashboard/menu-engineering";

export interface InsightItem {
  texto: string;
  tipo: "oportunidade" | "aviso" | "info";
}

interface GerarInsightParams {
  produtosCategorizado: ProdutoCategorizado[];
  cmvTrend: number | null;
  ticketMedioTrend: number | null;
  cmvParcial: boolean;
}

export function gerarInsight({
  produtosCategorizado,
  cmvTrend,
  ticketMedioTrend,
  cmvParcial,
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
        texto: `${maiorMargem.produtoNome} tem a maior margem do turno, mas não está entre os 3 mais vendidos — vale incentivar.`,
        tipo: "oportunidade",
      });
    }
  }

  // CMV subiu vs turno anterior
  if (cmvTrend !== null && cmvTrend >= 5) {
    insights.push({
      texto: `CMV subiu ${cmvTrend.toFixed(1)}% vs turno anterior — revise o custo dos produtos mais vendidos.`,
      tipo: "aviso",
    });
  }

  // Ticket médio caiu vs turno anterior
  if (ticketMedioTrend !== null && ticketMedioTrend <= -5) {
    insights.push({
      texto: `Ticket médio caiu ${Math.abs(ticketMedioTrend).toFixed(1)}% em relação ao turno anterior.`,
      tipo: "aviso",
    });
  }

  // Drinks com margem negativa (categoria "problema")
  const problemas = produtosCategorizado.filter((p) => p.categoria === "problema");
  if (problemas.length === 1) {
    insights.push({
      texto: `${problemas[0].produtoNome} está sendo vendido com margem negativa — verifique o preço ou custo.`,
      tipo: "aviso",
    });
  } else if (problemas.length > 1) {
    insights.push({
      texto: `${problemas.length} produtos com margem negativa: ${problemas.map((p) => p.produtoNome).join(", ")}.`,
      tipo: "aviso",
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
