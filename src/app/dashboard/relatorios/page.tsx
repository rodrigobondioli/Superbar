import { LineChart } from "@/components/ui/line-chart";
import { PeriodoSeletor } from "@/components/dashboard/periodo-seletor";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { resolvePeriodo, type PeriodoSearchParams } from "@/lib/dashboard/periodo";
import {
  getFaturamentoPorDia,
  getComparacaoPeriodo,
  getKpisFinanceirosPeriodo,
  getProdutosVendidosPeriodo,
} from "@/lib/dashboard/relatorios";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

const kpiCard: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const kpiLabel: React.CSSProperties = { fontSize: 15, fontWeight: 400, color: "var(--fg-muted)" };
const kpiMetric: React.CSSProperties = { fontSize: 32, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1.1 };
const kpiSub: React.CSSProperties = { fontSize: 13, color: "var(--fg-muted)" };
const cardBig: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 32px 24px" };
const cardTitle: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "var(--fg-muted)" };

function DeltaVs({ percent: p }: { percent: number }) {
  const up = p >= 0;
  const cor = up ? "var(--ok)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
      <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden><path d={up ? "M5.5 0 L11 9 L0 9 Z" : "M5.5 9 L11 0 L0 0 Z"} fill={cor} /></svg>
      <span style={{ color: cor }}>{Math.abs(p).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. semana anterior</span>
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<PeriodoSearchParams>;
}) {
  const params = await searchParams;
  const periodo = resolvePeriodo(params);

  const current = await getCurrentBar();
  if (!current) return null;

  const [pontos, comparacao, kpis, produtos] = await Promise.all([
    getFaturamentoPorDia(current.bar.id, periodo),
    getComparacaoPeriodo(current.bar.id, periodo),
    getKpisFinanceirosPeriodo(current.bar.id, periodo),
    getProdutosVendidosPeriodo(current.bar.id, periodo),
  ]);

  const topProdutos = [...produtos].sort((a, b) => b.faturamento - a.faturamento).slice(0, 6);
  const maxFat = topProdutos[0]?.faturamento || 1;

  return (
    <div className="py-6 lg:px-10 lg:py-8 flex flex-col gap-4 lg:gap-6">

      {/* Header: título + subtítulo + período */}
      <div className="max-lg:pb-4" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Relatórios</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Análise de desempenho por período</p>
        </div>
        <PeriodoSeletor current={params} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div className="max-lg:!p-5" style={kpiCard}>
          <span style={kpiLabel}>Receita</span>
          <span style={kpiMetric}>{currency.format(comparacao.atual)}</span>
          {comparacao.percentual !== null ? <DeltaVs percent={comparacao.percentual} /> : <span style={kpiSub}>sem base de comparação</span>}
        </div>
        <div className="max-lg:!p-5" style={kpiCard}>
          <span style={kpiLabel}>CMV</span>
          <span style={kpiMetric}>{kpis.cmv !== null ? `${percent.format(kpis.cmv)}%` : "—"}</span>
          <span style={kpiSub}>custo sobre receita</span>
        </div>
        <div className="max-lg:!p-5" style={kpiCard}>
          <span style={kpiLabel}>Margem bruta</span>
          <span style={{ ...kpiMetric, color: kpis.margemBruta !== null && kpis.margemBruta < 50 ? "var(--warn)" : "var(--fg)" }}>{kpis.margemBruta !== null ? `${percent.format(kpis.margemBruta)}%` : "—"}</span>
          <span style={kpiSub}>receita menos custo</span>
        </div>
        <div className="max-lg:!p-5" style={kpiCard}>
          <span style={kpiLabel}>Ticket médio</span>
          <span style={kpiMetric}>{kpis.ticketMedio !== null ? currency.format(kpis.ticketMedio) : "—"}</span>
          <span style={kpiSub}>por comanda paga</span>
        </div>
      </div>

      {/* Receita por dia */}
      <div className="max-lg:!p-5" style={cardBig}>
        <span style={cardTitle}>Receita por dia</span>
        <div style={{ marginTop: 24 }}>
          <LineChart data={pontos} height={220} />
        </div>
      </div>

      {/* Top produtos */}
      <div className="max-lg:!p-5" style={cardBig}>
        <span style={cardTitle}>Produtos mais vendidos</span>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {topProdutos.map((p, i) => {
            const margem = p.custo !== null && p.preco > 0 ? Math.round((1 - p.custo / p.preco) * 100) : null;
            const pct = Math.max(6, Math.round((p.faturamento / maxFat) * 100));
            return (
              <div key={p.produtoId} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 15, color: "var(--fg-muted)", width: 20, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.produtoNome}</span>
                  <span className="hidden sm:inline" style={{ fontSize: 13, color: "var(--fg-muted)", flexShrink: 0, minWidth: 56, textAlign: "right" }}>{p.quantidadeVendida} un</span>
                  {margem !== null && <span className="hidden sm:inline" style={{ fontSize: 13, color: "var(--fg-muted)", flexShrink: 0, minWidth: 96, textAlign: "right" }}>Margem {margem}%</span>}
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 96, textAlign: "right" }}>{currency.format(p.faturamento)}</span>
                </div>
                <div style={{ height: 3, borderRadius: 999, background: "var(--border-strong)", overflow: "hidden" }}>
                  <div style={{ height: 3, borderRadius: 999, background: "linear-gradient(90deg, var(--warn) 0%, var(--accent) 100%)", width: `${pct}%`, transformOrigin: "left", animation: "barGrow 0.85s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${i * 70}ms` }} />
                </div>
              </div>
            );
          })}
          {topProdutos.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>Sem vendas neste período.</p>
          )}
        </div>
      </div>

    </div>
  );
}
