import { SettingsButton } from "@/components/dashboard/settings-button";
import { TrendText } from "@/components/ui/trend-text";
import { BarChart } from "@/components/ui/bar-chart";
import { CategoriaBadge } from "@/components/dashboard/categoria-badge";
import { AlertasBell } from "@/components/dashboard/alertas-bell";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";
import { LiveBar } from "@/components/dashboard/live-bar";
import { cn } from "@/lib/utils";
import {
  getCurrentBar,
  getTurnoAtual,
  getKpisTurno,
  getAlertasEstoque,
  getKpisComparacao,
  getProdutosVendidosTurno,
  getMetaMes,
  getLiveStats,
} from "@/lib/dashboard/queries";
import { categorizarProdutos, calcularCmv } from "@/lib/dashboard/menu-engineering";
import { getFaturamentoPorDia, getComparacaoPeriodo } from "@/lib/dashboard/relatorios";
import { resolvePeriodo } from "@/lib/dashboard/periodo";
import { gerarInsight, type InsightItem } from "@/lib/dashboard/insights";

const TOP_DRINKS_LIMIT = 5;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const dataExtenso = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

function saudacao(horaDoDia: number) {
  if (horaDoDia < 12) return "Bom dia";
  if (horaDoDia < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalizarPrimeiraLetra(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const overline: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--fg-subtle)",
};

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  padding: "24px",
};

const kpiCell: React.CSSProperties = {
  background: "var(--bg-elevated)",
  padding: "16px 20px",
  minWidth: 0,
};

export default async function DashboardPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    return (
      <div style={{ padding: "32px" }}>
        <div style={{ ...card, maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--fg-muted)" }}>Nenhum turno aberto neste momento.</p>
        </div>
      </div>
    );
  }

  const [kpis, alertas, produtosVendidos, metaMes, liveStats] = await Promise.all([
    getKpisTurno(turno),
    getAlertasEstoque(current.bar.id),
    getProdutosVendidosTurno(current.bar.id, turno.id),
    getMetaMes(current.bar.id),
    getLiveStats(current.bar.id, turno.id),
  ]);

  const comparacao = await getKpisComparacao(
    current.bar.id,
    turno,
    kpis,
    alertas.length,
    produtosVendidos
  );

  const produtosCategorizados = categorizarProdutos(produtosVendidos);
  const produtosTop5 = [...produtosCategorizados]
    .sort((a, b) => (b.margemPercentual ?? -Infinity) - (a.margemPercentual ?? -Infinity))
    .slice(0, TOP_DRINKS_LIMIT);
  const cmvAtual = calcularCmv(produtosVendidos);

  const periodoSemana = resolvePeriodo({ preset: "7d" });
  const [pontosReceita, receitaSemana] = await Promise.all([
    getFaturamentoPorDia(current.bar.id, periodoSemana, "diaSemana"),
    getComparacaoPeriodo(current.bar.id, periodoSemana),
  ]);

  const agora = new Date();
  const primeiroNome = current.userNome.split(" ")[0];
  const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));

  const produtosComCusto = produtosVendidos.filter(p => p.custo != null).length;
  const cmvParcial = cmvAtual !== null && produtosComCusto < produtosVendidos.length;

  const insights: InsightItem[] = gerarInsight({
    produtosCategorizado: produtosCategorizados,
    cmvTrend: comparacao.cmv,
    ticketMedioTrend: comparacao.ticketMedio,
    cmvParcial,
  });

  // Meta do mês — calculada uma vez, usada no KPI strip
  const metaConfigurada = current.bar.configuracoes?.meta_mensal;
  const meta = metaConfigurada ?? metaMes.meta;
  const metaAtual = metaMes.faturamentoAtual;
  const metaProgresso = meta > 0 ? Math.min(Math.round((metaAtual / meta) * 100), 100) : 0;
  const metaFalta = Math.max(meta - metaAtual, 0);
  const metaAtingida = metaAtual >= meta && meta > 0;

  return (
    <div className="flex flex-col" style={{ overflowX: "hidden", width: "100%" }}>

      {/* Hero */}
      <div
        className="relative px-5 pt-8 pb-6 lg:px-12 lg:pt-14 lg:pb-10 lg:border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        <div className="hidden lg:flex" style={{ position: "absolute", top: "16px", right: "24px", alignItems: "center", gap: "10px" }}>
          <AlertasBell alertas={alertas} />
          <SettingsButton
            bar={current.bar}
            barId={current.bar.id}
            userId={current.userId}
            userNome={current.userNome}
            userEmail={current.userEmail}
            userAvatarUrl={current.userAvatarUrl}
          />
        </div>

        <h1
          className="lg:text-[24px] text-[18px]"
          style={{
            fontWeight: 700,
            color: "var(--fg)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            marginBottom: "6px",
            textAlign: "center",
          }}
        >
          {saudacao(agora.getHours())}, {primeiroNome}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginBottom: "24px", textAlign: "center" }}>
          {dataFormatada}{turno ? " · turno aberto" : " · nenhum turno aberto"}
        </p>

        <AiHeroInput barId={current.bar.id} />
      </div>

      {/* Faixa Ao Vivo — Faturamento · Comandas · Drinks */}
      <LiveBar
        turnoId={turno.id}
        barId={current.bar.id}
        faturamentoInicial={kpis.faturamento}
        pessoasInicial={kpis.comandasAbertas}
        drinksInicial={liveStats.drinks}
      />

      {/* KPI strip — CMV · Ticket médio · Meta do mês · Insights (sem duplicar live strip) */}
      <div className="px-5 py-4 lg:p-0">
        <div
          className="grid grid-cols-1 lg:grid-cols-4 overflow-hidden rounded-[4px] lg:rounded-none"
          style={{ gap: "1px", background: "var(--border)", border: "1px solid var(--border)" }}
        >

          {/* CMV do turno */}
          <div
            className="animate-fade-in-up flex items-center justify-between lg:block"
            style={{ ...kpiCell, animationDelay: "0ms" }}
          >
            <div className="flex flex-col lg:block">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <p style={{ ...overline, fontSize: "10px" }}>CMV</p>
                {cmvParcial && (
                  <span style={{
                    fontSize: "9px", fontWeight: 500,
                    padding: "2px 5px", borderRadius: "2px",
                    background: "color-mix(in srgb, var(--warn) 12%, transparent)",
                    color: "var(--warn)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}>estimado</span>
                )}
              </div>
              <p
                className="text-[22px] lg:text-[26px]"
                style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}
              >
                {cmvAtual !== null ? `${percent.format(cmvAtual)}%` : "—"}
              </p>
              <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>custo sobre receita</p>
            </div>
            <div className="lg:mt-1 flex-shrink-0 ml-4 lg:ml-0">
              <TrendText percent={comparacao.cmv} invert={true} />
            </div>
          </div>

          {/* Ticket médio */}
          <div
            className="animate-fade-in-up flex items-center justify-between lg:block"
            style={{ ...kpiCell, animationDelay: "60ms" }}
          >
            <div className="flex flex-col lg:block">
              <p style={{ ...overline, fontSize: "10px" }}>Ticket médio</p>
              <p
                className="text-[22px] lg:text-[26px]"
                style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}
              >
                {currency.format(kpis.ticketMedio)}
              </p>
            </div>
            <div className="lg:mt-1 flex-shrink-0 ml-4 lg:ml-0">
              <TrendText percent={comparacao.ticketMedio} invert={false} />
            </div>
          </div>

          {/* Meta do mês */}
          <div
            className="animate-fade-in-up flex items-start justify-between lg:block"
            style={{ ...kpiCell, animationDelay: "120ms" }}
          >
            <div className="flex-1 min-w-0">
              <p style={{ ...overline, fontSize: "10px" }}>Meta do mês</p>
              <p
                className="text-[22px] lg:text-[26px]"
                style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}
              >
                {currency.format(metaAtual)}
              </p>
              <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px", marginBottom: "10px" }}>
                de {currency.format(meta)} · {metaProgresso}%
                {!metaConfigurada && (
                  <span style={{ marginLeft: 4, fontStyle: "italic" }}>(auto)</span>
                )}
              </p>
              <div style={{ background: "var(--border-strong)", borderRadius: "2px", height: "3px", overflow: "hidden" }}>
                <div style={{
                  background: metaAtingida ? "var(--ok)" : "var(--accent)",
                  borderRadius: "2px",
                  height: "3px",
                  width: `${metaProgresso}%`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <p className="hidden lg:block" style={{ fontSize: "11px", color: metaAtingida ? "var(--ok)" : "var(--fg-subtle)", marginTop: "6px" }}>
                {metaAtingida ? "Meta atingida!" : `falta ${currency.format(metaFalta)}`}
              </p>
            </div>
            {/* Mobile: mostra % à direita */}
            <div className="flex-shrink-0 ml-4 lg:hidden" style={{ paddingTop: "22px" }}>
              <span style={{
                fontSize: "14px", fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: metaAtingida ? "var(--ok)" : "var(--fg-muted)",
              }}>
                {metaProgresso}%
              </span>
            </div>
          </div>

          {/* Insights */}
          <div
            className="animate-fade-in-up"
            style={{ ...kpiCell, animationDelay: "180ms" }}
          >
            <p style={{ ...overline, fontSize: "10px", marginBottom: "10px" }}>Insights</p>
            {insights.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--fg-muted)", lineHeight: 1.5 }}>
                Nenhum alerta no momento.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {insights.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        fontSize: "13px",
                        fontWeight: 700,
                        lineHeight: 1.45,
                        color: item.tipo === "oportunidade" ? "var(--ok)" : item.tipo === "aviso" ? "var(--warn)" : "var(--fg-subtle)",
                      }}
                    >
                      {item.tipo === "oportunidade" ? "↑" : item.tipo === "aviso" ? "·" : "–"}
                    </span>
                    <p style={{ fontSize: "12px", color: "var(--fg-muted)", lineHeight: 1.5, margin: 0 }}>
                      {item.texto}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-8" style={{ paddingTop: 24, paddingBottom: 32, display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <h2 style={{ fontSize: "15px", fontWeight: 500, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
            Visão do turno
          </h2>
          <p style={{ fontSize: "12px", color: "var(--fg-subtle)" }}>
            Tempo real · {dataFormatada}
          </p>
        </div>

        {/* Chart + Top Drinks */}
        <div className="grid lg:grid-cols-5" style={{ gap: "16px" }}>
          <div
            className="animate-fade-in-up lg:col-span-3"
            style={{ ...card, animationDelay: "300ms" }}
          >
            <p style={{ ...overline, marginBottom: "16px" }}>Receita — últimos 7 dias</p>
            <p className="text-[22px] lg:text-[28px]" style={{
              fontWeight: 600,
              color: "var(--fg)",
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {currency.format(receitaSemana.atual)}
            </p>
            <span className="hidden lg:inline-block">
              <TrendText percent={receitaSemana.percentual} comparativoLabel="vs semana passada" />
            </span>
            <div className="mt-3" style={{ maxHeight: "160px", overflow: "hidden" }}>
              <BarChart data={pontosReceita} height={160} />
            </div>
            <span className="lg:hidden block mt-2">
              <TrendText percent={receitaSemana.percentual} comparativoLabel="vs semana passada" />
            </span>
          </div>

          <div
            className="animate-fade-in-up lg:col-span-2"
            style={{ ...card, padding: 0, animationDelay: "360ms" }}
          >
            <div style={{ padding: "24px 24px 0" }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--fg)", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>
                Top drinks
              </p>
              <p style={{ ...overline, marginBottom: "16px" }}>por margem · turno atual</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={overline}>
                  <th className="font-medium" style={{ padding: "4px 16px" }}>#</th>
                  <th className="font-medium" style={{ padding: "4px 8px" }}>Drink</th>
                  <th className="hidden sm:table-cell font-medium" style={{ padding: "4px 8px" }}>Tag</th>
                  <th className="hidden sm:table-cell text-right font-medium" style={{ padding: "4px 8px" }}>Qtde</th>
                  <th className="hidden lg:table-cell text-right font-medium" style={{ padding: "4px 8px" }}>Margem</th>
                  <th className="text-right font-medium" style={{ padding: "4px 16px" }}>Receita</th>
                </tr>
              </thead>
              <tbody>
                {produtosTop5.map((produto, i) => (
                  <tr
                    key={produto.produtoId}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="hover:bg-white/[0.02]"
                  >
                    <td style={{ fontSize: "12px", color: "var(--fg-subtle)", padding: "10px 16px", fontFamily: "var(--font-mono)" }}>{i + 1}</td>
                    <td style={{ fontSize: "13px", color: "var(--fg)", padding: "10px 8px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{produto.produtoNome}</td>
                    <td className="hidden sm:table-cell" style={{ padding: "10px 8px" }}>
                      <CategoriaBadge categoria={produto.categoria} />
                    </td>
                    <td className="hidden sm:table-cell text-right" style={{ fontSize: "12px", color: "var(--fg-muted)", padding: "10px 8px", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                      {produto.quantidadeVendida}
                    </td>
                    <td
                      className={cn("hidden lg:table-cell text-right", produto.categoria === "problema" ? "text-error" : "")}
                      style={{
                        fontSize: "12px", padding: "10px 8px",
                        color: produto.categoria === "problema" ? undefined : "var(--fg-muted)",
                        fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {produto.margemPercentual !== null ? `${percent.format(produto.margemPercentual)}%` : "—"}
                    </td>
                    <td className="text-right" style={{ fontSize: "12px", color: "var(--fg)", padding: "10px 16px", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                      {currency.format(produto.faturamento)}
                    </td>
                  </tr>
                ))}
                {produtosTop5.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ fontSize: "13px", color: "var(--fg-muted)", padding: "16px 16px" }}>
                      Nenhuma venda neste turno ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="h-3" />
          </div>
        </div>

        {/* Aviso mobile */}
        <p
          className="lg:hidden"
          style={{
            fontSize: "12px",
            color: "var(--fg-subtle)",
            textAlign: "center",
            paddingTop: "8px",
            paddingBottom: "4px",
          }}
        >
          Acesse o desktop para gráficos e análises completas.
        </p>

      </div>
    </div>
  );
}
