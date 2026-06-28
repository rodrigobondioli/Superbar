import { TrendText } from "@/components/ui/trend-text";
import { BarChart } from "@/components/ui/bar-chart";
import { CategoriaBadge } from "@/components/dashboard/categoria-badge";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";
import { LiveBar } from "@/components/dashboard/live-bar";
import { ProximaMelhorAcao } from "@/components/dashboard/proxima-melhor-acao";
import { DashCard } from "@/components/dashboard/dash-card";
import { CardOverline } from "@/components/dashboard/card-overline";
import { cn } from "@/lib/utils";
import type { PontoPico } from "@/lib/dashboard/operacao";
import {
  getCurrentBar,
  getTurnoAtual,
  getKpisTurno,
  getAlertasEstoque,
  getKpisComparacao,
  getProdutosVendidosTurno,
  getMetaMes,
  getLiveStats,
  getPrimeirosPassos,
  getUltimoTurnoFechado,
} from "@/lib/dashboard/queries";
import { getInteligenciaStage } from "@/lib/inteligencia/queries";
import { categorizarProdutos, calcularCmv, calcularCoberturaReceita } from "@/lib/dashboard/menu-engineering";
import { getFaturamentoPorDia, getComparacaoPeriodo } from "@/lib/dashboard/relatorios";
import { resolvePeriodo } from "@/lib/dashboard/periodo";
import { gerarInsight, type InsightItem } from "@/lib/dashboard/insights";
import {
  getHorarioPico,
  getRankingMesas,
  getMixPagamento,
  getTempoMedioPreparo,
  calcularPico,
  gerarInsightsOperacionais,
  labelMetodo,
} from "@/lib/dashboard/operacao";

const TOP_DRINKS_LIMIT = 5;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const dataExtenso = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

function VendasPorHoraChart({ pontos }: { pontos: PontoPico[] }) {
  if (pontos.length < 2) return null;
  const W = 600, H = 110, padL = 4, padR = 4, padT = 8, padB = 22;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...pontos.map(p => p.drinks), 1);
  const minHora = pontos[0].hora;
  const maxHora = pontos[pontos.length - 1].hora;
  const horaRange = Math.max(maxHora - minHora, 1);
  const pts = pontos.map(p => ({
    x: padL + ((p.hora - minHora) / horaRange) * chartW,
    y: padT + chartH - (p.drinks / maxVal) * chartH,
    hora: p.hora,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = [
    `M ${pts[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)}`,
    ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`,
  ].join(" ");
  const step = Math.ceil(pts.length / 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 110 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="horaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(245,158,11,0.35)" stopOpacity="1" />
          <stop offset="100%" stopColor="rgba(245,158,11,0.0)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#horaGrad)" />
      <path d={line} fill="none" stroke="rgba(245,158,11,0.85)" strokeWidth="1.5" />
      {pts.map((p, i) => {
        if (i !== 0 && i !== pts.length - 1 && i % step !== 0) return null;
        return (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
            {p.hora}h
          </text>
        );
      })}
    </svg>
  );
}

function capitalizarPrimeiraLetra(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const sectionLabel: React.CSSProperties = {
  display: "block",
  fontSize: "0.62rem",
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "var(--fg-subtle)",
  marginBottom: 0,
  opacity: 0.7,
};

const overline: React.CSSProperties = {
  fontSize: "0.7rem",
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--fg-subtle)",
};

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "20px 24px",
};

export default async function DashboardPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    const [passos, ultimoTurno, inteligencia, alertas, metaMes] = await Promise.all([
      getPrimeirosPassos(current.bar.id, current.userId),
      getUltimoTurnoFechado(current.bar.id),
      getInteligenciaStage(current.bar.id),
      getAlertasEstoque(current.bar.id),
      getMetaMes(current.bar.id, current.bar.configuracoes?.meta_mensal ?? undefined),
    ]);

    // ── Bar novo: nunca teve turno → setup checklist ────────────────────────
    if (passos.nTurnos === 0) {
      const steps = [
        { label: "Conta criada",           done: true,                   href: null },
        { label: `Cardápio — ${passos.nProdutos} ${passos.nProdutos === 1 ? "produto" : "produtos"}`,
          done: passos.nProdutos > 0,   href: "/dashboard/cardapio" },
        { label: `Mesas — ${passos.nMesas} ${passos.nMesas === 1 ? "mesa" : "mesas"}`,
          done: passos.nMesas > 0,      href: "/dashboard/mesas" },
        { label: passos.nEquipe === 0
            ? "Equipe — só você por enquanto"
            : `Equipe — ${passos.nEquipe} ${passos.nEquipe === 1 ? "membro" : "membros"}`,
          done: passos.nEquipe > 0,     href: "/dashboard/equipe" },
      ];

      return (
        <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
          <div style={{ width: "100%", maxWidth: 440 }}>
            <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--fg)", margin: "0 0 6px", textAlign: "center" }}>
              Vamos configurar seu bar
            </h2>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 28px", textAlign: "center", lineHeight: 1.6 }}>
              Complete os passos abaixo. Quando tudo estiver pronto, peça ao caixa para abrir o primeiro turno.
            </p>
            <div style={{ ...card, padding: 0, marginBottom: 20 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: step.done ? "var(--ok-bg)" : "color-mix(in srgb, var(--fg) 5%, transparent)", border: `1.5px solid ${step.done ? "var(--ok)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>
                    {step.done ? "✓" : ""}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: step.done ? "var(--fg-muted)" : "var(--fg)" }}>{step.label}</span>
                  {step.href && !step.done && (
                    <a href={step.href} style={{ fontSize: 12, fontWeight: 600, color: "white", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Configurar →</a>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "color-mix(in srgb, var(--fg) 5%, transparent)", border: "1.5px solid var(--border)" }} />
                <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>Peça ao caixa para abrir o primeiro turno</span>
                <a href="/dashboard/caixa" style={{ fontSize: 12, fontWeight: 600, color: "white", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Ver Caixa →</a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Bar com histórico: mostra última noite + inteligência ───────────────
    function labelTurno(abertoEm: string, fechadoEm: string): { dia: string; horas: string } {
      const abertura = new Date(abertoEm);
      const fechamento = new Date(fechadoEm);
      const hoje = new Date();
      const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);

      const fmt = (d: Date) => `${d.getHours()}h`;
      const horas = `${fmt(abertura)} às ${fmt(fechamento)}`;

      const isHoje = abertura.toDateString() === hoje.toDateString() || fechamento.toDateString() === hoje.toDateString();
      const isOntem = abertura.toDateString() === ontem.toDateString() || fechamento.toDateString() === ontem.toDateString();
      const dia = isHoje ? "Hoje" : isOntem ? "Ontem"
        : capitalizarPrimeiraLetra(dataExtenso.format(abertura));

      return { dia, horas };
    }

    const agora = new Date();
    const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));
    const label = ultimoTurno ? labelTurno(ultimoTurno.abertoEm, ultimoTurno.fechadoEm) : null;

    // Meta do mês para o bloco Negócio
    const metaConfiguradaFechado = current.bar.configuracoes?.meta_mensal;
    const metaFechado = metaConfiguradaFechado ?? metaMes.meta;
    const metaAtualFechado = metaMes.faturamentoAtual;
    const metaProgressoFechado = metaFechado > 0 ? Math.min(Math.round((metaAtualFechado / metaFechado) * 100), 100) : 0;
    const metaFaltaFechado = Math.max(metaFechado - metaAtualFechado, 0);
    const metaAtingidaFechado = metaAtualFechado >= metaFechado && metaFechado > 0;

    return (
      <div className="flex flex-col" style={{ overflowX: "hidden", width: "100%" }}>

        <div className="lg:px-8" style={{ paddingTop: "24px", paddingBottom: "48px", display: "flex", flexDirection: "column", gap: "40px" }}>

          {/* 0. SUPERBAR AI — acesso rápido no topo */}
          <section>
            <span style={sectionLabel}>SUPERBAR IA</span>
            <AiHeroInput barId={current.bar.id} alertCount={inteligencia.stage === 2 ? inteligencia.insightsNaoLidos : 0} />
          </section>

          {/* 1. APRENDIZADO (stage 1) ou ATENÇÃO (stage 2) */}
          {inteligencia.stage === 1 ? (
            <div style={{ ...card }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>
                Superbar está aprendendo sobre seu bar
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                      {inteligencia.comandas >= 30 ? "✓" : "○"} 30 comandas
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{inteligencia.comandas} / 30</span>
                  </div>
                  <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                    <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((inteligencia.comandas / 30) * 100), 100)}%`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                      {inteligencia.diasAtivo >= 7 ? "✓" : "○"} 7 dias de operação
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{inteligencia.diasAtivo} / 7</span>
                  </div>
                  <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                    <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((inteligencia.diasAtivo / 7) * 100), 100)}%`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                {inteligencia.diasAtivo < 7
                  ? `Faltam ${7 - inteligencia.diasAtivo} ${7 - inteligencia.diasAtivo === 1 ? "dia" : "dias"} para gerar análises automáticas.`
                  : inteligencia.comandas < 30
                  ? `Faltam ${30 - inteligencia.comandas} comandas para gerar análises automáticas.`
                  : "Calculando análises…"}
              </p>
            </div>
          ) : (
            <section>
              <span style={sectionLabel}>Atenção Agora</span>
              {inteligencia.insightsNaoLidos === 0 ? (
                <div style={{ ...card, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "white", fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>✓</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>Tudo sob controle</p>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                      Monitorando CMV · Ticket médio · Estoque · Produtos · Equipe
                    </p>
                  </div>
                </div>
              ) : (
                <a href="/dashboard/inteligencia" style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                      {inteligencia.insightsNaoLidos === 1 ? "1 análise disponível" : `${inteligencia.insightsNaoLidos} análises disponíveis`}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "3px 0 0" }}>Ver Inteligência →</p>
                  </div>
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: "50%", minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                    {inteligencia.insightsNaoLidos > 9 ? "9+" : inteligencia.insightsNaoLidos}
                  </span>
                </a>
              )}
            </section>
          )}

          {/* 2. NEGÓCIO — último turno + meta do mês */}
          {ultimoTurno && label && (
            <section>
              <span style={sectionLabel}>Diagnóstico do Turno</span>

              {/* Data do turno */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{label.dia}</span>
                <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{label.horas}</span>
              </div>

              {/* KPI cards — 2 colunas mobile, 4 desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "12px" }}>

                <div style={{ ...card }}>
                  <p style={overline}>Faturamento</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {currency.format(ultimoTurno.faturamento)}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                    {ultimoTurno.totalComandas} {ultimoTurno.totalComandas === 1 ? "comanda" : "comandas"}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>Ticket médio</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {currency.format(ultimoTurno.ticketMedio)}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>CMV</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {ultimoTurno.cmv !== null ? `${ultimoTurno.cmv}%` : "—"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                    {ultimoTurno.cmv === null ? "custos não configurados" : "custo sobre receita"}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>Top drink</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ultimoTurno.topDrink ?? "—"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>mais vendido</p>
                </div>

              </div>

              {/* Meta do mês */}
              {metaFechado > 0 && (
                <div style={{ ...card, marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <p style={overline}>Meta do mês</p>
                      <p style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                        {currency.format(metaAtualFechado)}
                        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--fg-subtle)", marginLeft: 6 }}>de {currency.format(metaFechado)}</span>
                      </p>
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "white", marginTop: 18 }}>
                      {metaProgressoFechado}%
                    </span>
                  </div>
                  <div style={{ background: "var(--border-strong)", borderRadius: "2px", height: "3px", overflow: "hidden" }}>
                    <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "2px", height: "3px", width: `${metaProgressoFechado}%`, transition: "width 0.6s ease" }} />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 6 }}>
                    {metaAtingidaFechado ? "Meta atingida!" : `falta ${currency.format(metaFaltaFechado)}`}
                    {!metaConfiguradaFechado && (
                      <span
                        title="Calculada automaticamente com base no faturamento do mês anterior + 10%. Configure uma meta manual nas Configurações."
                        style={{ marginLeft: 6, fontSize: 9, fontWeight: 500, padding: "2px 6px", borderRadius: 2, background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "help", whiteSpace: "nowrap" }}
                      >
                        Sugerida
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Link para detalhes */}
              <a href={`/dashboard/turnos/${ultimoTurno.id}`} style={{ display: "inline-block", marginTop: 12, fontSize: 12, color: "var(--fg-subtle)", textDecoration: "none" }}
                className="hover:!text-[var(--fg-muted)]">
                Ver detalhes do turno →
              </a>
            </section>
          )}

          {/* 3. OPERAÇÃO — resumo, não tela operacional */}
          <section>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>

              {/* Estoque */}
              <div style={card}>
                <p style={overline}>Estoque</p>
                {alertas.length > 0 ? (
                  <>
                    <p style={{ fontSize: "3rem", fontWeight: 700, color: "white", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      {alertas.length}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                      {alertas.length === 1 ? "item crítico" : "itens críticos"}
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "3rem", fontWeight: 700, color: "white", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      OK
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>nenhum alerta</p>
                  </>
                )}
                <a href="/dashboard/estoque" style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "var(--fg-subtle)", textDecoration: "none" }}
                  className="hover:!text-[var(--fg-muted)]">
                  Ver estoque →
                </a>
              </div>

              {/* Relatórios */}
              <div style={card}>
                <p style={overline}>Relatórios</p>
                <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  →
                </p>
                <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>análise por período</p>
                <a href="/dashboard/relatorios" style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "var(--fg-subtle)", textDecoration: "none" }}
                  className="hover:!text-[var(--fg-muted)]">
                  Ver relatórios →
                </a>
              </div>

            </div>
          </section>

          {/* Footer: turno fechado */}
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", textAlign: "center" }}>
            Bar fechado ·{" "}
            <a href="/caixa" style={{ color: "white", textDecoration: "none" }}>
              O caixa abre o próximo turno →
            </a>
          </p>

        </div>
      </div>
    );
  }

  const [kpis, alertas, produtosVendidos, metaMes, liveStats, pontosHora, rankingMesas, mixPgto, tempos, inteligencia] = await Promise.all([
    getKpisTurno(turno),
    getAlertasEstoque(current.bar.id),
    getProdutosVendidosTurno(current.bar.id, turno.id),
    getMetaMes(current.bar.id, current.bar.configuracoes?.meta_mensal ?? undefined),
    getLiveStats(current.bar.id, turno.id),
    getHorarioPico(current.bar.id, turno.id),
    getRankingMesas(current.bar.id, turno.id),
    getMixPagamento(current.bar.id, turno.id),
    getTempoMedioPreparo(current.bar.id, turno.id),
    getInteligenciaStage(current.bar.id),
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
  const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));

  const coberturaReceita = calcularCoberturaReceita(produtosVendidos);
  const cmvParcial = coberturaReceita.status !== "confiavel";

  // Veredictos semânticos — "estou melhor ou pior?"
  const cmvVeredito = coberturaReceita.status === "indisponivel" || cmvAtual === null
    ? null
    : cmvAtual < 30 ? "Margem excelente"
    : cmvAtual < 36 ? "Margem saudável"
    : cmvAtual < 42 ? "Custo elevado"
    : "CMV crítico"
  const cmvCorVeredito: string = cmvVeredito === "Margem excelente" || cmvVeredito === "Margem saudável"
    ? "white"
    : cmvVeredito === "Custo elevado" ? "white"
    : cmvVeredito === "CMV crítico" ? "white"
    : "var(--fg-muted)"
  const ticketDelta = comparacao?.ticketMedio ?? null
  const ticketVeredito = ticketDelta !== null && Math.abs(ticketDelta) > 5
    ? ticketDelta > 0 ? "Ticket crescendo" : "Ticket caindo"
    : null
  const ticketCorVeredito: string = "white"

  const insights: InsightItem[] = gerarInsight({
    produtosCategorizado: produtosCategorizados,
    cmvTrend: comparacao.cmv,
    ticketMedioTrend: comparacao.ticketMedio,
    cmvParcial,
    ticketMedio: kpis.ticketMedio,
    faturamento: kpis.faturamento,
  });

  const pico = calcularPico(pontosHora);
  const insightsOp = gerarInsightsOperacionais({
    pico,
    mesas: rankingMesas,
    mix: mixPgto,
    tempos,
    faturamentoTurno: kpis.faturamento,
  });
  const todosInsights = [...insightsOp, ...insights];
  const insightsSorted = [
    ...todosInsights.filter(i => i.tipo === "action"),
    ...todosInsights.filter(i => i.tipo === "opportunity"),
    ...todosInsights.filter(i => i.tipo === "info"),
  ];
  const nAction = todosInsights.filter(i => i.tipo === "action").length;
  const nOpportunity = todosInsights.filter(i => i.tipo === "opportunity").length;
  const nInfo = todosInsights.filter(i => i.tipo === "info").length;
  const metaConfigurada = current.bar.configuracoes?.meta_mensal;
  const meta = metaConfigurada ?? metaMes.meta;
  const metaAtual = metaMes.faturamentoAtual;
  const metaProgresso = meta > 0 ? Math.min(Math.round((metaAtual / meta) * 100), 100) : 0;
  const metaFalta = Math.max(meta - metaAtual, 0);
  const metaAtingida = metaAtual >= meta && meta > 0;

  // Natural language ticket impact (linguagem de dono)
  const ticketDeltaPct = comparacao.ticketMedio;
  let ritmoLabel: string | null = null;
  if (ticketDeltaPct !== null && Math.abs(ticketDeltaPct) > 3 && kpis.comandasAbertas > 0) {
    const impacto = Math.abs(kpis.ticketMedio * (ticketDeltaPct / 100) * kpis.comandasAbertas);
    ritmoLabel = ticketDeltaPct < 0
      ? `Ticket caiu ${Math.abs(ticketDeltaPct).toFixed(1)}% — projeta ${currency.format(impacto)} a menos no turno`
      : `Ticket subiu ${ticketDeltaPct.toFixed(1)}% — projeta +${currency.format(impacto)} no turno`;
  }
  const proximaAcaoTexto = inteligencia.stage === 2 && insightsSorted.length > 0 ? insightsSorted[0].texto : null;

  return (
    <div className="flex flex-col" style={{ overflowX: "hidden", width: "100%" }}>

      {/* ━━ ZONA 1 — Pulso do Turno (full-width, sem padding) ━━ */}
      <LiveBar
        turnoId={turno.id}
        barId={current.bar.id}
        faturamentoInicial={kpis.faturamento}
        pessoasInicial={kpis.comandasAbertas}
        drinksInicial={liveStats.drinks}
        margemEstimada={cmvAtual}
        comparacaoFaturamento={comparacao.faturamento}
        comparacaoTicket={comparacao.ticketMedio}
        cmvParcial={cmvParcial}
        barNome={current.bar.nome}
        dataFormatada={dataFormatada}
        metaProgresso={metaProgresso}
        metaFalta={metaFalta}
        metaAtingida={metaAtingida}
        meta={meta}
      />


      {/* ── CONTENT ── */}
      <div style={{ padding: "20px 32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ═══ APRENDIZADO (stage 1 only) ═══ */}
        {inteligencia.stage === 1 && (
          <DashCard style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                Superbar está aprendendo sobre seu bar
              </p>
              <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                {inteligencia.diasAtivo < 7
                  ? `${7 - inteligencia.diasAtivo} dias restantes`
                  : inteligencia.comandas < 30
                  ? `${30 - inteligencia.comandas} comandas restantes`
                  : "calculando…"}
              </span>
            </div>
            {[
              { label: "30 comandas", atual: inteligencia.comandas, meta: 30 },
              { label: "7 dias de operação", atual: inteligencia.diasAtivo, meta: 7 },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{item.atual >= item.meta ? "✓" : "○"} {item.label}</span>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>{item.atual}/{item.meta}</span>
                </div>
                <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                  <div style={{ background: "var(--accent)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((item.atual / item.meta) * 100), 100)}%`, transition: "width 0.6s" }} />
                </div>
              </div>
            ))}
          </DashCard>
        )}

        {/* ═══ AI INPUT ═══ */}
        <AiHeroInput barId={current.bar.id} alertCount={nAction} />

        {/* ═══ GRÁFICO — Receita 7 dias ═══ */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>
              Receita dos últimos 7 dias
            </h2>
            <TrendText percent={receitaSemana.percentual} comparativoLabel="vs semana passada" />
          </div>
          <DashCard style={{ height: 220 }}>
            <BarChart data={pontosReceita} fill />
          </DashCard>
        </div>

        {/* ═══ BOTTOM ROW — 3 cards ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

          {/* Card 1 — Análises */}
          {inteligencia.stage === 2 && todosInsights.length > 0 ? (
            <DashCard style={{ padding: 0, overflow: "hidden" }}>
              {insightsSorted.slice(0, 3).map((item, i) => {
                const cor = item.tipo === "action" ? "var(--danger)" : item.tipo === "opportunity" ? "var(--ok)" : "var(--border-strong)";
                const isCritical = item.tipo === "action";
                return (
                  <div key={i} style={{
                    borderLeft: `3px solid ${cor}`,
                    borderBottom: i < Math.min(insightsSorted.length, 3) - 1 ? "1px solid var(--border)" : "none",
                    background: isCritical ? "color-mix(in srgb, var(--danger) 5%, transparent)" : "transparent",
                    padding: "14px 16px",
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: cor, margin: "0 0 4px" }}>
                      {item.tipo === "action" ? "Crítico" : item.tipo === "opportunity" ? "Oportunidade" : "Info"}
                    </p>
                    <p style={{ fontSize: isCritical ? 13 : 12, fontWeight: isCritical ? 700 : 500, color: "var(--fg)", margin: 0, lineHeight: 1.4 }}>
                      {item.texto}
                    </p>
                    {item.impactoReais !== undefined && (
                      <p style={{ fontSize: 12, fontWeight: 700, color: isCritical ? "var(--danger)" : "var(--ok)", fontVariantNumeric: "tabular-nums", margin: "4px 0 0" }}>
                        {item.impactoReais < 0 ? `−${currency.format(Math.abs(item.impactoReais))}` : `+${currency.format(item.impactoReais)}`}
                      </p>
                    )}
                  </div>
                );
              })}
              {inteligencia.insightsNaoLidos > 0 && (
                <a href="/dashboard/inteligencia" style={{ display: "block", padding: "10px 16px", textDecoration: "none", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                  {inteligencia.insightsNaoLidos} análise{inteligencia.insightsNaoLidos !== 1 ? "s" : ""} disponível →
                </a>
              )}
            </DashCard>
          ) : inteligencia.stage === 2 ? (
            <DashCard style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, color: "var(--ok)" }}>✓</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: "0 0 3px" }}>Tudo sob controle</p>
                <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>CMV · Ticket · Estoque</p>
              </div>
            </DashCard>
          ) : (
            <DashCard>
              <CardOverline>Análises</CardOverline>
              <p style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 8, lineHeight: 1.5 }}>
                Disponível após 30 comandas e 7 dias de operação.
              </p>
            </DashCard>
          )}

          {/* Card 2 — Vendas por hora */}
          <DashCard>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <CardOverline style={{ marginBottom: 0 }}>Vendas por hora</CardOverline>
              {pico && <span style={{ fontSize: 11, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>Pico {pico.hora}h</span>}
            </div>
            {pontosHora.length >= 2 ? (
              <VendasPorHoraChart pontos={pontosHora} />
            ) : (
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Aguardando pedidos…</p>
                {mixPgto.length > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    {labelMetodo(mixPgto[0].metodo)} · {mixPgto[0].percentual}%
                  </p>
                )}
              </div>
            )}
          </DashCard>

          {/* Card 3 — Próxima ação */}
          {produtosTop5.length > 0 && produtosTop5[0].margemPercentual !== null ? (
            <ProximaMelhorAcao
              produtoNome={produtosTop5[0].produtoNome}
              margemPercentual={produtosTop5[0].margemPercentual}
              faturamento={produtosTop5[0].faturamento}
              quantidadeVendida={produtosTop5[0].quantidadeVendida}
              categoria={produtosTop5[0].categoria}
              ranking={produtosTop5.slice(1).map(p => ({
                produtoId: p.produtoId,
                produtoNome: p.produtoNome,
                margemPercentual: p.margemPercentual,
                faturamento: p.faturamento,
              }))}
            />
          ) : rankingMesas.length > 0 ? (
            <DashCard>
              <CardOverline>Mesa destaque</CardOverline>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "8px 0 6px" }}>
                {rankingMesas[0].mesaLabel}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" }}>
                {currency.format(rankingMesas[0].faturamento)} · {rankingMesas[0].comandas} comanda{rankingMesas[0].comandas !== 1 ? "s" : ""}
              </p>
            </DashCard>
          ) : (
            <DashCard>
              <CardOverline>Estoque</CardOverline>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: alertas.length > 0 ? "var(--danger)" : "var(--ok)", lineHeight: 1, margin: "8px 0 6px" }}>
                {alertas.length > 0 ? alertas.length : "OK"}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                {alertas.length > 0
                  ? `${alertas.length === 1 ? "1 item crítico" : `${alertas.length} críticos`}`
                  : "nenhum alerta"}
              </p>
            </DashCard>
          )}

        </div>


      </div>
    </div>
  );
}
