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

          {/* 0. SUPERBAR AI — acesso rápido no topo */}
          <section>
            <span style={sectionLabel}>Superbar AI</span>
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
                    <span style={{ fontSize: 12, color: inteligencia.comandas >= 30 ? "var(--ok)" : "var(--fg-subtle)" }}>
                      {inteligencia.comandas >= 30 ? "✓" : "○"} 30 comandas
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{inteligencia.comandas} / 30</span>
                  </div>
                  <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                    <div style={{ background: inteligencia.comandas >= 30 ? "var(--ok)" : "color-mix(in srgb, var(--accent) 50%, transparent)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((inteligencia.comandas / 30) * 100), 100)}%`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: inteligencia.diasAtivo >= 7 ? "var(--ok)" : "var(--fg-subtle)" }}>
                      {inteligencia.diasAtivo >= 7 ? "✓" : "○"} 7 dias de operação
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{inteligencia.diasAtivo} / 7</span>
                  </div>
                  <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                    <div style={{ background: inteligencia.diasAtivo >= 7 ? "var(--ok)" : "color-mix(in srgb, var(--accent) 50%, transparent)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((inteligencia.diasAtivo / 7) * 100), 100)}%`, transition: "width 0.6s ease" }} />
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
              <span style={sectionLabel}>Atenção</span>
              {inteligencia.insightsNaoLidos === 0 ? (
                <div style={{ ...card, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>✓</span>
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
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: "50%", minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                    {inteligencia.insightsNaoLidos > 9 ? "9+" : inteligencia.insightsNaoLidos}
                  </span>
                </a>
              )}
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

  // Veredictos semânticos — "estou melhor ou pior?"
  const cmvVeredito = coberturaReceita.status === "indisponivel" || cmvAtual === null
    ? null
    : cmvAtual < 30 ? "Margem excelente"
    : cmvAtual < 36 ? "Margem saudável"
    : cmvAtual < 42 ? "Custo elevado"
    : "CMV crítico"
  const cmvCorVeredito: string = cmvVeredito === "Margem excelente" || cmvVeredito === "Margem saudável"
    ? "var(--ok)"
    : cmvVeredito === "Custo elevado" ? "var(--warn)"
    : cmvVeredito === "CMV crítico" ? "#ef4444"
    : "var(--fg-muted)"
  const ticketDelta = comparacao?.ticketMedio ?? null
  const ticketVeredito = ticketDelta !== null && Math.abs(ticketDelta) > 5
    ? ticketDelta > 0 ? "Ticket crescendo" : "Ticket caindo"
    : null
  const ticketCorVeredito: string = ticketVeredito === "Ticket caindo" ? "var(--warn)" : "var(--ok)"

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

        {/* 0. SUPERBAR AI — acesso rápido no topo */}
        <section>
          <span style={sectionLabel}>Superbar AI</span>
          <AiHeroInput barId={current.bar.id} alertCount={nAction} />
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
                  <span style={{ fontSize: 12, color: inteligencia.comandas >= 30 ? "var(--ok)" : "var(--fg-subtle)" }}>
                    {inteligencia.comandas >= 30 ? "✓" : "○"} 30 comandas
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{inteligencia.comandas} / 30</span>
                </div>
                <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                  <div style={{ background: inteligencia.comandas >= 30 ? "var(--ok)" : "color-mix(in srgb, var(--accent) 50%, transparent)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((inteligencia.comandas / 30) * 100), 100)}%`, transition: "width 0.6s ease" }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: inteligencia.diasAtivo >= 7 ? "var(--ok)" : "var(--fg-subtle)" }}>
                    {inteligencia.diasAtivo >= 7 ? "✓" : "○"} 7 dias de operação
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{inteligencia.diasAtivo} / 7</span>
                </div>
                <div style={{ background: "var(--border-strong)", borderRadius: 2, height: 2, overflow: "hidden" }}>
                  <div style={{ background: inteligencia.diasAtivo >= 7 ? "var(--ok)" : "color-mix(in srgb, var(--accent) 50%, transparent)", borderRadius: 2, height: 2, width: `${Math.min(Math.round((inteligencia.diasAtivo / 7) * 100), 100)}%`, transition: "width 0.6s ease" }} />
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
            <span style={sectionLabel}>Atenção</span>
            {todosInsights.length === 0 && inteligencia.insightsNaoLidos === 0 ? (
              // Compact — tudo sob controle
              <div style={{ ...card, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>Tudo sob controle</p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                    Monitorando CMV · Ticket médio · Estoque · Produtos · Equipe
                  </p>
                </div>
              </div>
            ) : (
              // Expandido — um card por insight
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {insightsSorted.map((item, i) => {
                  const severityColor = item.tipo === "action" ? "#ef4444" : item.tipo === "opportunity" ? "var(--ok)" : "#3b82f6";
                  const severityLabel = item.tipo === "action" ? "🔴 AÇÃO NECESSÁRIA" : item.tipo === "opportunity" ? "🟢 OPORTUNIDADE" : "🔵 INFORMAÇÃO";
                  return (
                    <div key={i} style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderLeft: `${item.tipo === "info" ? "2px" : "3px"} solid ${severityColor}`,
                      borderRadius: "4px",
                      padding: item.tipo === "info" ? "12px 16px" : "16px 20px",
                    }}>
                      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: severityColor, margin: "0 0 6px" }}>
                        {severityLabel}
                      </p>
                      <p style={{ fontSize: item.tipo === "info" ? 12 : 13, color: item.tipo === "info" ? "var(--fg-muted)" : "var(--fg)", margin: "0 0 4px", lineHeight: 1.5 }}>{item.texto}</p>
                      {item.contexto && (
                        <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "0 0 6px", fontStyle: "italic" }}>{item.contexto}</p>
                      )}
                      {item.impactoReais !== undefined && (
                        <p style={{ fontSize: 12, fontWeight: 600, color: item.impactoReais < 0 ? "#ef4444" : "var(--ok)", fontFamily: "var(--font-mono)", margin: "0 0 6px" }}>
                          Impacto estimado: {item.impactoReais < 0 ? `−${currency.format(Math.abs(item.impactoReais))}` : `+${currency.format(item.impactoReais)}`} neste turno
                        </p>
                      )}
                      {item.sugestao && (
                        <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0, lineHeight: 1.5 }}>→ {item.sugestao}</p>
                      )}
                    </div>
                  );
                })}

                {inteligencia.insightsNaoLidos > 0 && (
                  <a href="/dashboard/inteligencia" style={{
                    ...card,
                    display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                    padding: "14px 20px",
                  }}>
                    <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: "50%", minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {inteligencia.insightsNaoLidos > 9 ? "9+" : inteligencia.insightsNaoLidos}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                      {inteligencia.insightsNaoLidos === 1 ? "1 análise detalhada disponível" : `${inteligencia.insightsNaoLidos} análises detalhadas disponíveis`} →
                    </span>
                  </a>
                )}
              </div>
            )}
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
          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "12px" }}>

            {/* CMV */}
            <div
              className="animate-fade-in-up"
              style={{ ...card, animationDelay: "0ms" }}
            >
              {coberturaReceita.status === "indisponivel" ? (
                <>
                  <p style={overline}>CMV</p>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>—</p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2, marginBottom: 4 }}>{coberturaReceita.cobertura}% da receita com custo</p>
                  <a href="/dashboard/cardapio" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>Configurar →</a>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: cmvCorVeredito, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                    {cmvVeredito}
                    {coberturaReceita.status === "estimado" && (
                      <span style={{ fontSize: 9, fontWeight: 500, padding: "2px 5px", borderRadius: 2, background: "color-mix(in srgb, var(--warn) 12%, transparent)", color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.05em" }}>estimado</span>
                    )}
                  </p>
                  <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", margin: "0 0 3px" }}>
                    {percent.format(cmvAtual ?? 0)}%
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>CMV do turno</span>
                    <TrendText percent={comparacao.cmv} invert={true} />
                  </div>
                </>
              )}
            </div>

            {/* Ticket médio */}
            <div
              className="animate-fade-in-up"
              style={{ ...card, animationDelay: "60ms" }}
            >
              {ticketVeredito ? (
                <p style={{ fontSize: 12, fontWeight: 600, color: ticketCorVeredito, margin: "0 0 4px" }}>
                  {ticketVeredito}
                </p>
              ) : (
                <p style={{ ...overline, marginBottom: 4 }}>Ticket médio</p>
              )}
              <p
                className="text-[22px] lg:text-[26px]"
                style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", margin: "0 0 3px" }}
              >
                {currency.format(kpis.ticketMedio)}
              </p>
              <TrendText percent={comparacao.ticketMedio} invert={false} />
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

            {/* Oportunidade principal */}
            <div
              className="animate-fade-in-up lg:col-span-2"
              style={{ ...card, animationDelay: "300ms" }}
            >
              {produtosTop5.length === 0 || produtosTop5[0].margemPercentual === null ? (
                <>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ok)", margin: "0 0 10px" }}>
                    🎯 OPORTUNIDADE PRINCIPAL
                  </p>
                  <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>Nenhuma venda com dado de margem ainda.</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ok)", margin: "0 0 10px" }}>
                    🎯 OPORTUNIDADE PRINCIPAL
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                    {produtosTop5[0].produtoNome}
                  </p>
                  <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--ok)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {percent.format(produtosTop5[0].margemPercentual ?? 0)}% margem
                    </span>
                    <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                      {currency.format(produtosTop5[0].faturamento)} vendido
                    </span>
                    <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                      {produtosTop5[0].quantidadeVendida}× pedido
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.6, marginBottom: produtosTop5.length > 1 ? 14 : 0 }}>
                    {produtosTop5[0].categoria === "star" || produtosTop5[0].categoria === "cash_cow"
                      ? "Já vende bem. Treine a equipe para sugerir ainda mais."
                      : "Alta margem com potencial. Considere destacar no cardápio e no discurso da equipe."}
                  </p>
                  {produtosTop5.length > 1 && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <p style={{ ...overline, marginBottom: 8 }}>Outros com boa margem</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {produtosTop5.slice(1).filter(p => p.margemPercentual !== null).map(p => (
                          <div key={p.produtoId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{p.produtoNome}</span>
                            <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                              {percent.format(p.margemPercentual ?? 0)}% · {currency.format(p.faturamento)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </section>

        {/* 4. OPERAÇÃO */}
        <section>
          <span style={sectionLabel}>Operação</span>
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "12px" }}>

            {/* Horário de pico — só aparece quando há dado */}
            {pico && (
              <div className="animate-fade-in-up" style={{ ...card, animationDelay: "200ms" }}>
                <p style={overline}>Pico de vendas</p>
                <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                  {pico.hora}h–{pico.hora + 1}h
                </p>
                <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                  {pico.drinks} drinks nessa hora
                </p>
              </div>
            )}

            {/* Mesa top — só aparece quando há dado */}
            {rankingMesas.length > 0 && (
              <div className="animate-fade-in-up" style={{ ...card, animationDelay: "240ms" }}>
                <p style={overline}>Mesa top</p>
                <p className="text-[22px] lg:text-[26px]" style={{ fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                  {rankingMesas[0].mesaLabel}
                </p>
                <p style={{ fontSize: "11px", color: "var(--fg-subtle)", marginTop: "2px" }}>
                  {currency.format(rankingMesas[0].faturamento)} · {rankingMesas[0].comandas} {rankingMesas[0].comandas === 1 ? "comanda" : "comandas"}
                </p>
              </div>
            )}

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



      </div>
    </div>
  );
}
