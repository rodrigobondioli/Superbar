import { LineChart } from "@/components/ui/line-chart";
import { TrendBadge } from "@/components/ui/trend-badge";
import { PeriodoSeletor } from "@/components/dashboard/periodo-seletor";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { resolvePeriodo, type PeriodoSearchParams } from "@/lib/dashboard/periodo";
import {
  getFaturamentoPorDia,
  getComparacaoPeriodo,
  getRankingProdutos,
} from "@/lib/dashboard/relatorios";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  padding: "24px",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--fg-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<PeriodoSearchParams>;
}) {
  const params = await searchParams;
  const periodo = resolvePeriodo(params);

  const current = await getCurrentBar();
  if (!current) return null;

  const [pontos, comparacao, ranking] = await Promise.all([
    getFaturamentoPorDia(current.bar.id, periodo),
    getComparacaoPeriodo(current.bar.id, periodo),
    getRankingProdutos(current.bar.id, periodo),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Page header */}
      <div className="pt-6 pb-0 lg:px-10 lg:pt-8">
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.01em", margin: 0 }}>
          Relatórios
        </h1>
        <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginTop: "4px", marginBottom: 0 }}>
          Análise de desempenho por período
        </p>
      </div>

      {/* Period selector */}
      <div className="py-4 lg:px-10 flex justify-end">
        <PeriodoSeletor current={params} />
      </div>

      {/* Content area */}
      <div className="pb-6 lg:px-10 lg:pb-10 flex flex-col gap-4">

        {/* Summary card */}
        <div style={card}>
          <p style={sectionLabel}>
            Faturamento no período · {dataCurta.format(periodo.inicio)} – {dataCurta.format(periodo.fim)}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
            <p style={{ fontSize: "30px", fontWeight: 600, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {currency.format(comparacao.atual)}
            </p>
            <TrendBadge percent={comparacao.percentual} />
          </div>
        </div>

        {/* Chart card */}
        <div style={card}>
          <p style={sectionLabel}>Evolução diária</p>
          <div style={{ marginTop: "16px" }}>
            <LineChart data={pontos} height={200} />
          </div>
        </div>

        {/* Ranking card */}
        <div style={card}>
          <p style={sectionLabel}>Produtos mais vendidos</p>
          {(() => {
            const totalFaturamento = ranking.reduce((acc, p) => acc + p.faturamento, 0);
            return (
              <ul style={{ marginTop: "16px", display: "flex", flexDirection: "column", listStyle: "none", padding: 0 }}>
                {ranking.map((produto, i) => {
                  const pct = totalFaturamento > 0 ? (produto.faturamento / totalFaturamento) * 100 : 0;
                  return (
                    <li
                      key={produto.produtoNome}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 8px",
                        background: i % 2 === 1 ? "color-mix(in srgb, var(--fg) 2%, transparent)" : undefined,
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "var(--fg)" }}>{produto.produtoNome}</span>
                      <div className="flex items-center gap-3 sm:gap-5">
                        <span className="hidden sm:inline" style={{ fontSize: "13px", color: "var(--fg-subtle)" }}>
                          {produto.quantidadeVendida} un.
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--fg)", minWidth: "80px", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                          {currency.format(produto.faturamento)}
                        </span>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--fg-subtle)",
                          minWidth: "32px",
                          textAlign: "right",
                        }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </li>
                  );
                })}
                {ranking.length === 0 && (
                  <li style={{ fontSize: "13px", color: "var(--fg-muted)", padding: "12px 8px" }}>
                    Sem vendas neste período.
                  </li>
                )}
              </ul>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
