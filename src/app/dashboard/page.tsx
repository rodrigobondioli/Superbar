import { SettingsButton } from "@/components/dashboard/settings-button";
import { TrendText } from "@/components/ui/trend-text";
import { BarChart } from "@/components/ui/bar-chart";
import { CategoriaBadge } from "@/components/dashboard/categoria-badge";
import { AlertasBell } from "@/components/dashboard/alertas-bell";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";
import { cn } from "@/lib/utils";
import {
  getCurrentBar,
  getTurnoAtual,
  getKpisTurno,
  getAlertasEstoque,
  getKpisComparacao,
  getProdutosVendidosTurno,
  getMetaMes,
} from "@/lib/dashboard/queries";
import { categorizarProdutos, calcularCmv } from "@/lib/dashboard/menu-engineering";
import { getFaturamentoPorDia, getComparacaoPeriodo, getProdutosVendidosPeriodo } from "@/lib/dashboard/relatorios";
import { resolvePeriodo, periodoMesAtual, periodoAnterior } from "@/lib/dashboard/periodo";
import { percentChange } from "@/lib/dashboard/percent-change";
import { gerarInsight } from "@/lib/dashboard/insights";

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

  const [kpis, alertas, produtosVendidos, metaMes] = await Promise.all([
    getKpisTurno(turno),
    getAlertasEstoque(current.bar.id),
    getProdutosVendidosTurno(current.bar.id, turno.id),
    getMetaMes(current.bar.id),
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
  const periodoMes = periodoMesAtual();
  const [pontosReceita, receitaSemana, produtosVendidosMes, produtosVendidosMesAnterior] = await Promise.all([
    getFaturamentoPorDia(current.bar.id, periodoSemana, "diaSemana"),
    getComparacaoPeriodo(current.bar.id, periodoSemana),
    getProdutosVendidosPeriodo(current.bar.id, periodoMes),
    getProdutosVendidosPeriodo(current.bar.id, periodoAnterior(periodoMes)),
  ]);
  const cmvMes = calcularCmv(produtosVendidosMes);
  const cmvMesAnterior = calcularCmv(produtosVendidosMesAnterior);
  const cmvMesTrend =
    cmvMes !== null && cmvMesAnterior !== null ? percentChange(cmvMes, cmvMesAnterior) : null;

  const insight = gerarInsight({
    produtosVendidos,
    faturamentoTurno: kpis.faturamento,
    cmvTrend: comparacao.cmv,
    alertasCount: alertas.length,
  });

  const agora = new Date();
  const primeiroNome = current.userNome.split(" ")[0];
  const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));

  // Cobertura de custo: se algum produto vendido tem custo mas nem todos têm,
  // o CMV é parcial — indicador sutil "estimado" avisa o dono.
  const produtosComCusto = produtosVendidos.filter(p => p.custo != null).length;
  const cmvParcial = cmvAtual !== null && produtosComCusto < produtosVendidos.length;

  const kpiCards = [
    { value: currency.format(kpis.faturamento), label: "Faturamento do turno", percent: comparacao.faturamento, invert: false, estimado: false },
    { value: cmvAtual !== null ? `${percent.format(cmvAtual)}%` : "—", label: "CMV", percent: comparacao.cmv, invert: true, estimado: cmvParcial },
    { value: String(kpis.comandasAbertas), label: "Tickets abertos", percent: comparacao.comandas, invert: false, estimado: false },
    { value: currency.format(kpis.ticketMedio), label: "Ticket médio", percent: comparacao.ticketMedio, invert: false, estimado: false },
  ];

  return (
    <div className="flex flex-col">

      {/* Hero — flat, plano, sem orbs */}
      <div style={{
        position: "relative",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "56px 48px 40px",
      }}>
        {/* Controls — top-right */}
        <div style={{ position: "absolute", top: "16px", right: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertasBell alertas={alertas} />
          <SettingsButton
            bar={current.bar}
            barId={current.bar.id}
            userId={current.userId}
            userNome={current.userNome}
            userEmail={current.userEmail}
            userAvatarUrl={current.userAvatarUrl}
          />
          {current.userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.userAvatarUrl}
              alt={primeiroNome}
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "var(--accent-fg)",
              flexShrink: 0,
            }}>
              {primeiroNome.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Greeting */}
        <h1 style={{
          fontSize: "32px", fontWeight: 700,
          color: "var(--fg)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
          marginBottom: "6px",
        }}>
          {saudacao(agora.getHours())}, {primeiroNome}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginBottom: "32px" }}>
          {dataFormatada}{turno ? " · turno aberto" : " · nenhum turno aberto"}
        </p>

        <AiHeroInput barId={current.bar.id} />
      </div>

      {/* KPI strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px",
        background: "var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        {kpiCards.map((kpi, i) => (
          <div
            key={kpi.label}
            className="animate-fade-in-up"
            style={{ background: "var(--bg-elevated)", padding: "20px 28px", animationDelay: `${i * 60}ms` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <p style={overline}>{kpi.label}</p>
              {kpi.estimado && (
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
            <p style={{
              fontSize: "28px", fontWeight: 600,
              color: "var(--fg)",
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "8px",
            }}>{kpi.value}</p>
            <TrendText percent={kpi.percent} invert={kpi.invert} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{
            fontSize: "15px", fontWeight: 500,
            color: "var(--fg)",
            fontFamily: "var(--font-mono)",
          }}>Visão do turno</h2>
          <p style={{ fontSize: "12px", color: "var(--fg-subtle)" }}>
            Dados em tempo real · {dataFormatada}
          </p>
        </div>

        {/* Chart + Top Drinks */}
        <div className="grid lg:grid-cols-5" style={{ gap: "16px" }}>
          <div
            className="animate-fade-in-up lg:col-span-3"
            style={{ ...card, animationDelay: "300ms" }}
          >
            <p style={{ ...overline, marginBottom: "16px" }}>Receita — últimos 7 dias</p>
            <div className="flex items-baseline gap-3">
              <p style={{
                fontSize: "28px", fontWeight: 600,
                color: "var(--fg)",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {currency.format(receitaSemana.atual)}
              </p>
              <TrendText percent={receitaSemana.percentual} comparativoLabel="vs semana passada" />
            </div>
            <div className="mt-3" style={{ maxHeight: "160px", overflow: "hidden" }}>
              <BarChart data={pontosReceita} height={160} />
            </div>
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
                  <th className="font-medium" style={{ padding: "4px 24px" }}>#</th>
                  <th className="font-medium" style={{ padding: "4px 8px" }}>Drink</th>
                  <th className="font-medium" style={{ padding: "4px 8px" }}>Tag</th>
                  <th className="text-right font-medium" style={{ padding: "4px 8px" }}>Qtde</th>
                  <th className="text-right font-medium" style={{ padding: "4px 8px" }}>Margem</th>
                  <th className="text-right font-medium" style={{ padding: "4px 24px" }}>Receita</th>
                </tr>
              </thead>
              <tbody>
                {produtosTop5.map((produto, i) => (
                  <tr
                    key={produto.produtoId}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="hover:bg-white/[0.02]"
                  >
                    <td style={{ fontSize: "12px", color: "var(--fg-subtle)", padding: "10px 24px", fontFamily: "var(--font-mono)" }}>{i + 1}</td>
                    <td style={{ fontSize: "13px", color: "var(--fg)", padding: "10px 8px" }}>{produto.produtoNome}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <CategoriaBadge categoria={produto.categoria} />
                    </td>
                    <td className="text-right" style={{ fontSize: "12px", color: "var(--fg-muted)", padding: "10px 8px", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                      {produto.quantidadeVendida} un.
                    </td>
                    <td
                      className={cn("text-right", produto.categoria === "problema" ? "text-error" : "")}
                      style={{
                        fontSize: "12px", padding: "10px 8px",
                        color: produto.categoria === "problema" ? undefined : "var(--fg-muted)",
                        fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {produto.margemPercentual !== null ? `${percent.format(produto.margemPercentual)}%` : "—"}
                    </td>
                    <td className="text-right" style={{ fontSize: "12px", color: "var(--fg)", padding: "10px 24px", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                      {currency.format(produto.faturamento)}
                    </td>
                  </tr>
                ))}
                {produtosTop5.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ fontSize: "13px", color: "var(--fg-muted)", padding: "16px 24px" }}>
                      Nenhuma venda neste turno ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="h-3" />
          </div>
        </div>

        {/* Bottom widgets */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

          {/* CMV */}
          <div style={card}>
            <p style={{ ...overline, marginBottom: "12px" }}>CMV do mês</p>
            <p style={{
              fontSize: "32px", fontWeight: 600,
              color: "var(--fg)",
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
              marginBottom: "6px",
            }}>
              {cmvMes !== null ? `${percent.format(cmvMes)}%` : "—"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--fg-muted)" }}>custo sobre receita</p>
          </div>

          {/* Meta do mês */}
          {(() => {
            const metaConfigurada = current.bar.configuracoes?.meta_mensal;
            const meta = metaConfigurada ?? metaMes.meta;
            const atual = metaMes.faturamentoAtual;
            const progresso = meta > 0 ? Math.min(Math.round((atual / meta) * 100), 100) : 0;
            const falta = Math.max(meta - atual, 0);
            const atingida = atual >= meta && meta > 0;
            return (
              <div style={card}>
                <p style={{ ...overline, margin: 0 }}>Meta do mês</p>
                <p style={{
                  fontSize: "28px", fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  fontVariantNumeric: "tabular-nums",
                  margin: "12px 0 2px",
                }}>
                  {currency.format(atual)}
                </p>
                <p style={{ fontSize: "12px", color: "var(--fg-subtle)", margin: "0 0 20px" }}>
                  de {currency.format(meta)} · {progresso}%
                  {!metaConfigurada && (
                    <span style={{ marginLeft: 6, color: "var(--fg-subtle)", fontStyle: "italic" }}>
                      (automática)
                    </span>
                  )}
                </p>
                <div style={{ background: "var(--border-strong)", borderRadius: "2px", height: "3px", marginBottom: "12px", overflow: "hidden" }}>
                  <div style={{
                    background: atingida ? "var(--ok)" : "var(--accent)",
                    borderRadius: "2px",
                    height: "3px",
                    width: `${progresso}%`,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <p style={{ fontSize: "12px", color: atingida ? "var(--ok)" : "var(--fg-subtle)", margin: 0 }}>
                  {atingida ? "Meta atingida!" : `falta ${currency.format(falta)} para bater a meta`}
                </p>
              </div>
            );
          })()}

          {/* Santé AI insight */}
          <div style={card}>
            <p style={{ ...overline, marginBottom: "12px" }}>Santé AI</p>
            <p style={{ fontSize: "14px", color: "var(--fg-muted)", lineHeight: 1.6 }}>
              {insight ?? "Nenhum insight disponível no momento."}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
