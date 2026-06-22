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

function saudacao(horaDoDia: number) {
  if (horaDoDia < 12) return "Bom dia";
  if (horaDoDia < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalizarPrimeiraLetra(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const sectionLabel: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--fg-subtle)",
  marginBottom: "12px",
};

const overline: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--fg-subtle)",
};

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
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
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: step.done ? "var(--ok-bg)" : "color-mix(in srgb, var(--fg) 5%, transparent)", border: `1.5px solid ${step.done ? "var(--ok)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--ok)" }}>
                    {step.done ? "✓" : ""}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: step.done ? "var(--fg-muted)" : "var(--fg)" }}>{step.label}</span>
                  {step.href && !step.done && (
                    <a href={step.href} style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-bright)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Configurar →</a>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "color-mix(in srgb, var(--fg) 5%, transparent)", border: "1.5px solid var(--border)" }} />
                <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>Peça ao caixa para abrir o primeiro turno</span>
                <a href="/dashboard/caixa" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-bright)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Ver Caixa →</a>
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
    const primeiroNome = current.userNome.split(" ")[0];
    const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));
    const label = ultimoTurno ? labelTurno(ultimoTurno.abertoEm, ultimoTurno.fechadoEm) : null;

    // Stage 1 → usa comandas reais; stage 2 → 30/30 (já superou o threshold)
    const comandasScore = inteligencia.stage === 1 ? inteligencia.comandas : 30;

    // Meta do mês para o bloco Negócio
    const metaConfiguradaFechado = current.bar.configuracoes?.meta_mensal;
    const metaFechado = metaConfiguradaFechado ?? metaMes.meta;
    const metaAtualFechado = metaMes.faturamentoAtual;
    const metaProgressoFechado = metaFechado > 0 ? Math.min(Math.round((metaAtualFechado / metaFechado) * 100), 100) : 0;
    const metaFaltaFechado = Math.max(metaFechado - metaAtualFechado, 0);
    const metaAtingidaFechado = metaAtualFechado >= metaFechado && metaFechado > 0;

    return (
      <div className="flex flex-col" style={{ overflowX: "hidden", width: "100%" }}>

        {/* Hero */}
        <div className="relative pt-8 pb-6 lg:px-8 lg:pt-14 lg:pb-10" style={{ background: "var(--bg)" }}>
          <h1 className="lg:text-[24px] text-[18px]" style={{ fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "6px", textAlign: "center" }}>
            {saudacao(agora.getHours())}, {primeiroNome}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-subtle)", textAlign: "center" }}>
            {dataFormatada} · bar fechado
          </p>
        </div>

        <div className="lg:px-8" style={{ paddingTop: "24px", paddingBottom: "48px", display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* 0. SCORE DE SAÚDE */}
          <div style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Saúde do Bar</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Em calibração</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
              <span style={{ fontSize: 44, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", lineHeight: 1 }}>—</span>
              <span style={{ fontSize: 20, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>/100</span>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>Aguardando dados suficientes</span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{comandasScore} / 30</span>
              </div>
              <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 3, overflow: "hidden" }}>
                <div style={{ background: "color-mix(in srgb, var(--accent) 40%, transparent)", borderRadius: 2, height: 3, width: `${Math.min(Math.round((comandasScore / 30) * 100), 100)}%`, transition: "width 0.6s ease" }} />
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 8, marginBottom: 0 }}>
                {Math.max(0, 30 - comandasScore) > 0
                  ? `Disponível após mais ${30 - comandasScore} ${30 - comandasScore === 1 ? "comanda registrada" : "comandas registradas"}.`
                  : "Calculando score inicial…"}
              </p>
            </div>
          </div>

          {/* 1. ATENÇÃO */}
          {inteligencia.stage === 1 ? null : (
            <section>
              <span style={sectionLabel}>Atenção</span>
              <a href="/dashboard/inteligencia" style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", cursor: "pointer" }} className="hover:!border-[var(--border-strong)]">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 16 }}>🧠</span>
                  <div>
                    {inteligencia.insightsNaoLidos > 0 ? (
                      <>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{inteligencia.insightsNaoLidos === 1 ? "1 item precisa da sua atenção" : `${inteligencia.insightsNaoLidos} itens precisam da sua atenção`}</p>
                        <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>Ver análise completa →</p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Tudo sob controle</p>
                        <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>Nenhum alerta · Ver Inteligência →</p>
                      </>
                    )}
                  </div>
                </div>
                {inteligencia.insightsNaoLidos > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: "50%", minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                    {inteligencia.insightsNaoLidos > 9 ? "9+" : inteligencia.insightsNaoLidos}
                  </span>
                )}
              </a>
            </section>
          )}

          {/* 2. NEGÓCIO — último turno + meta do mês */}
          {ultimoTurno && label && (
            <section>
              <span style={sectionLabel}>Negócio</span>

              {/* Data do turno */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{label.dia}</span>
                <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{label.horas}</span>
              </div>

              {/* KPI cards — 2 colunas mobile, 4 desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "12px" }}>

                <div style={{ ...card }}>
                  <p style={overline}>Faturamento</p>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {currency.format(ultimoTurno.faturamento)}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                    {ultimoTurno.totalComandas} {ultimoTurno.totalComandas === 1 ? "comanda" : "comandas"}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>Ticket médio</p>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {currency.format(ultimoTurno.ticketMedio)}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>CMV</p>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {ultimoTurno.cmv !== null ? `${ultimoTurno.cmv}%` : "—"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                    {ultimoTurno.cmv === null ? "custos não configurados" : "custo sobre receita"}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>Top drink</p>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                    <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: metaAtingidaFechado ? "var(--ok)" : "var(--fg-muted)", marginTop: 18 }}>
                      {metaProgressoFechado}%
                    </span>
                  </div>
                  <div style={{ background: "var(--border-strong)", borderRadius: "2px", height: "3px", overflow: "hidden" }}>
                    <div style={{ background: metaAtingidaFechado ? "var(--ok)" : "var(--accent)", borderRadius: "2px", height: "3px", width: `${metaProgressoFechado}%`, transition: "width 0.6s ease" }} />
                  </div>
                  <p style={{ fontSize: 11, color: metaAtingidaFechado ? "var(--ok)" : "var(--fg-subtle)", marginTop: 6 }}>
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
            <span style={sectionLabel}>Operação</span>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>

              {/* Estoque */}
              <div style={card}>
                <p style={overline}>Estoque</p>
                {alertas.length > 0 ? (
                  <>
                    <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--warn)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      {alertas.length}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                      {alertas.length === 1 ? "item crítico" : "itens críticos"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--ok)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
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
                <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
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

          {/* 4. SUPERBAR AI */}
          <section>
            <span style={sectionLabel}>Superbar AI</span>
            <AiHeroInput barId={current.bar.id} />
          </section>

          {/* Footer: turno fechado */}
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", textAlign: "center" }}>
            Bar fechado ·{" "}
            <a href="/caixa" style={{ color: "var(--accent-bright)", textDecoration: "none" }}>
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
  const primeiroNome = current.userNome.split(" ")[0];
  const dataFormatada = capitalizarPrimeiraLetra(dataExtenso.format(agora));

  const coberturaReceita = calcularCoberturaReceita(produtosVendidos);
  const cmvParcial = coberturaReceita.status !== "confiavel";

  const insights: InsightItem[] = gerarInsight({
    produtosCategorizado: produtosCategorizados,
    cmvTrend: comparacao.cmv,
    ticketMedioTrend: comparacao.ticketMedio,
    cmvParcial,
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
  const comandasScore = inteligencia.stage === 1 ? inteligencia.comandas : 30;

  const metaConfigurada = current.bar.configuracoes?.meta_mensal;
  const meta = metaConfigurada ?? metaMes.meta;
  const metaAtual = metaMes.faturamentoAtual;
  const metaProgresso = meta > 0 ? Math.min(Math.round((metaAtual / meta) * 100), 100) : 0;
  const metaFalta = Math.max(meta - metaAtual, 0);
  const metaAtingida = metaAtual >= meta && meta > 0;

  return (
    <div className="flex flex-col" style={{ overflowX: "hidden", width: "100%" }}>

      {/* Hero */}
      <div className="relative pt-8 pb-6 lg:px-8 lg:pt-14 lg:pb-10"
        style={{ background: "var(--bg)" }}>
        <div className="hidden lg:flex"
          style={{ position: "absolute", top: "16px", right: "32px", alignItems: "center", gap: "10px" }}>
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
        <p style={{ fontSize: "13px", color: "var(--fg-subtle)", textAlign: "center" }}>
          {dataFormatada} · turno aberto
        </p>
      </div>

      {/* Blocos principais */}
      <div
        className="lg:px-8"
        style={{ paddingTop: "24px", paddingBottom: "48px", display: "flex", flexDirection: "column", gap: "32px" }}
      >

        {/* 0. SCORE DE SAÚDE */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Saúde do Bar</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Em calibração</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", lineHeight: 1 }}>—</span>
            <span style={{ fontSize: 20, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>/100</span>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>Aguardando dados suficientes</span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{comandasScore} / 30</span>
            </div>
            <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 3, overflow: "hidden" }}>
              <div style={{ background: "color-mix(in srgb, var(--accent) 40%, transparent)", borderRadius: 2, height: 3, width: `${Math.min(Math.round((comandasScore / 30) * 100), 100)}%`, transition: "width 0.6s ease" }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 8, marginBottom: 0 }}>
              {Math.max(0, 30 - comandasScore) > 0
                ? `Disponível após mais ${30 - comandasScore} ${30 - comandasScore === 1 ? "comanda registrada" : "comandas registradas"}.`
                : "Calculando score inicial…"}
            </p>
          </div>
        </div>

        {/* 1. ATENÇÃO */}
        {inteligencia.stage === 2 && (
          <section>
            <span style={sectionLabel}>Atenção</span>
            <a
              href="/dashboard/inteligencia"
              style={{
                ...card,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textDecoration: "none",
                transition: "border-color 150ms",
                cursor: "pointer",
              }}
              className="hover:!border-[var(--border-strong)]"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <div>
                  {inteligencia.insightsNaoLidos > 0 ? (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                        {inteligencia.insightsNaoLidos === 1
                          ? "1 item precisa da sua atenção"
                          : `${inteligencia.insightsNaoLidos} itens precisam da sua atenção`}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                        Ver análise completa →
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                        Tudo sob controle
                      </p>
                      <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                        Nenhum alerta · Ver Inteligência →
                      </p>
                    </>
                  )}
                </div>
              </div>
              {inteligencia.insightsNaoLidos > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: "50%",
                  minWidth: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  flexShrink: 0,
                }}>
                  {inteligencia.insightsNaoLidos > 9 ? "9+" : inteligencia.insightsNaoLidos}
                </span>
              )}
            </a>
          </section>
        )}

        {/* 2. AO VIVO — só existe quando turno está aberto */}
        <section>
          <span style={sectionLabel}>Ao vivo</span>
          <LiveBar
            turnoId={turno.id}
            barId={current.bar.id}
            faturamentoInicial={kpis.faturamento}
            pessoasInicial={kpis.comandasAbertas}
            drinksInicial={liveStats.drinks}
          />
        </section>

        {/* 3. NEGÓCIO — turno atual + semana */}
        <section>
          <span style={sectionLabel}>Negócio</span>

          {/* KPIs do turno */}
          <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: "12px" }}>

            {/* CMV */}
            <div
              className="animate-fade-in-up flex items-center justify-between lg:block"
              style={{ ...card, animationDelay: "0ms" }}
            >
              <div className="flex flex-col lg:block">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <p style={overline}>CMV</p>
                  {coberturaReceita.status === "estimado" && (
                    <span style={{
                      fontSize: "9px", fontWeight: 500,
                      padding: "2px 5px", borderRadius: "2px",
                      background: "color-mix(in srgb, var(--warn) 12%, transparent)",
                      color: "var(--warn)",
                      textTransform: "uppercase" as const, letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}>estimado</span>
                  )}
                </div>
                <p
                  className="text-[22px] lg:text-[26px]"
                  style={{ fontWeight: 600, color: coberturaReceita.status === "indisponivel" ? "var(--fg-subtle)" : "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}
                >
                  {coberturaReceita.status === "indisponivel" ? "—" : `${percent.format(cmvAtual ?? 0)}%`}
                </p>
                <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                  {coberturaReceita.status === "indisponivel"
                    ? `${coberturaReceita.cobertura}% da receita com custo`
                    : coberturaReceita.status === "estimado"
                    ? `${coberturaReceita.cobertura}% da receita coberta`
                    : "custo sobre receita"}
                </p>
              </div>
              <div className="lg:mt-1 flex-shrink-0 ml-4 lg:ml-0">
                {coberturaReceita.status !== "indisponivel"
                  ? <TrendText percent={comparacao.cmv} invert={true} />
                  : <a href="/dashboard/cardapio" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>Configurar →</a>
                }
              </div>
            </div>

            {/* Ticket médio */}
            <div
              className="animate-fade-in-up flex items-center justify-between lg:block"
              style={{ ...card, animationDelay: "60ms" }}
            >
              <div className="flex flex-col lg:block">
                <p style={overline}>Ticket médio</p>
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
              style={{ ...card, animationDelay: "120ms" }}
            >
              <div className="flex-1 min-w-0">
                <p style={overline}>Meta do mês</p>
                <p
                  className="text-[22px] lg:text-[26px]"
                  style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}
                >
                  {currency.format(metaAtual)}
                </p>
                <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px", marginBottom: "10px" }}>
                  de {currency.format(meta)} · {metaProgresso}%
                  {!metaConfigurada && (
                    <span
                      title="Calculada automaticamente com base no faturamento do mês anterior + 10%. Configure uma meta manual nas Configurações."
                      style={{
                        marginLeft: 6,
                        fontSize: 9, fontWeight: 500,
                        padding: "2px 6px", borderRadius: 2,
                        background: "color-mix(in srgb, var(--fg) 8%, transparent)",
                        color: "var(--fg-subtle)",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        cursor: "help", whiteSpace: "nowrap",
                      }}
                    >
                      Sugerida
                    </span>
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
              style={{ ...card, animationDelay: "180ms" }}
            >
              <p style={{ ...overline, marginBottom: "10px" }}>Insights</p>
              {todosInsights.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--fg-muted)", lineHeight: 1.5 }}>
                  Nenhum alerta no momento.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {todosInsights.map((item, i) => (
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

          {/* Semana — gráfico + top drinks */}
          <div className="grid lg:grid-cols-5" style={{ gap: "12px", marginTop: "12px" }}>

            {/* Receita — gráfico */}
            <div
              className="animate-fade-in-up lg:col-span-3"
              style={{ ...card, animationDelay: "240ms" }}
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

            {/* Top drinks — tabela */}
            <div
              className="animate-fade-in-up lg:col-span-2"
              style={{ ...card, padding: 0, animationDelay: "300ms" }}
            >
              <div style={{ padding: "20px 24px 0" }}>
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
        </section>

        {/* 4. OPERAÇÃO */}
        <section>
          <span style={sectionLabel}>Operação</span>
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "12px" }}>

            {/* Horário de pico */}
            <div className="animate-fade-in-up" style={{ ...card, animationDelay: "200ms" }}>
              <p style={overline}>Pico de vendas</p>
              {pico ? (
                <>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                    {pico.hora}h–{pico.hora + 1}h
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                    {pico.drinks} drinks nessa hora
                  </p>
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginTop: "8px" }}>Aguardando dados…</p>
              )}
            </div>

            {/* Mesa top */}
            <div className="animate-fade-in-up" style={{ ...card, animationDelay: "240ms" }}>
              <p style={overline}>Mesa top</p>
              {rankingMesas.length > 0 ? (
                <>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                    {rankingMesas[0].mesaLabel}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                    {currency.format(rankingMesas[0].faturamento)} · {rankingMesas[0].comandas} {rankingMesas[0].comandas === 1 ? "comanda" : "comandas"}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginTop: "8px" }}>Sem mesas ativas</p>
              )}
            </div>

            {/* Mix de pagamento */}
            <div className="animate-fade-in-up" style={{ ...card, animationDelay: "280ms" }}>
              <p style={overline}>Pagamento</p>
              {mixPgto.length > 0 ? (
                <>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                    {labelMetodo(mixPgto[0].metodo)}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                    {mixPgto[0].percentual}% dos pagamentos
                  </p>
                  {mixPgto.length > 1 && (
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {mixPgto.slice(1).map(f => (
                        <div key={f.metodo} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--border-strong)", overflow: "hidden" }}>
                            <div style={{ width: `${f.percentual}%`, height: "100%", background: "color-mix(in srgb, var(--accent) 50%, transparent)", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 10, color: "var(--fg-subtle)", minWidth: 32, textAlign: "right", fontFamily: "var(--font-mono)" }}>{f.percentual}%</span>
                          <span style={{ fontSize: 10, color: "var(--fg-subtle)", minWidth: 50 }}>{labelMetodo(f.metodo)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginTop: "8px" }}>Sem pagamentos</p>
              )}
            </div>

            {/* Tempo médio de preparo */}
            <div className="animate-fade-in-up" style={{ ...card, animationDelay: "320ms" }}>
              <p style={overline}>Preparo médio</p>
              {tempos.mediaMinutos !== null ? (
                <>
                  <p className="text-[22px] lg:text-[26px]" style={{
                    fontWeight: 600,
                    color: tempos.mediaMinutos >= 8 ? "var(--warn)" : tempos.mediaMinutos <= 3 ? "var(--ok)" : "var(--fg)",
                    fontFamily: "var(--font-mono)", marginTop: "4px",
                  }}>
                    {tempos.mediaMinutos}min
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                    {tempos.totalEntregues} de {tempos.totalRecebidos} {tempos.totalRecebidos === 1 ? "pedido" : "pedidos"} entregues
                  </p>
                </>
              ) : tempos.totalRecebidos > 0 ? (
                <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginTop: "8px" }}>Em andamento…</p>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginTop: "8px" }}>Nenhum pedido ainda</p>
              )}
            </div>

          </div>
        </section>

        {/* 5. SUPERBAR AI */}
        <section>
          <span style={sectionLabel}>Superbar AI</span>
          <AiHeroInput barId={current.bar.id} />
        </section>

      </div>
    </div>
  );
}
