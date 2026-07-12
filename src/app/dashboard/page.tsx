import { redirect } from "next/navigation";
import { podeVerFinanceiro } from "@/lib/auth/roles";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";
import { BarraProgresso } from "@/components/dashboard/barra-progresso";
import { GuiaConfiguracao, type PassoConfig } from "@/components/dashboard/guia-configuracao";
import { AlertaVariacaoCusto } from "@/components/dashboard/alerta-variacao-custo";
import { OperacaoAoVivo, type Periodo, type PeriodView } from "@/components/dashboard/operacao-ao-vivo";
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
  getHistoricoTurnos,
  getVariacaoCusto,
  type PrimeirosPassosData,
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
} from "@/lib/dashboard/operacao";
import { currency } from "@/lib/format";

const TOP_DRINKS_LIMIT = 5;
const dataExtenso = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
const dataLongaFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

function capitalizarPrimeiraLetra(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const overline: React.CSSProperties = {
  fontSize: "0.7rem",
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

/** Passos do guia de configuração, na hierarquia da inteligência: cardápio → custo → mesas → equipe → turno. */
function montarPassosSetup(p: PrimeirosPassosData): PassoConfig[] {
  const custoOk = p.nProdutos > 0 && p.nProdutosComCusto >= p.nProdutos;
  return [
    { label: "Conta criada", done: true, href: null },
    {
      label: `Cardápio — ${p.nProdutos} ${p.nProdutos === 1 ? "produto" : "produtos"}`,
      done: p.nProdutos > 0, href: "/dashboard/cardapio", cta: "Cadastrar",
    },
    {
      label: p.nProdutos === 0
        ? "Custo dos produtos"
        : `Custo — ${p.nProdutosComCusto} de ${p.nProdutos} com ficha`,
      apoio: "Sem custo, a margem é chute. Suba uma nota (NF-e) ou cadastre a ficha.",
      done: custoOk, href: "/dashboard/cardapio/fichas", cta: "Cadastrar custo", critico: true,
    },
    {
      label: `Mesas — ${p.nMesas} ${p.nMesas === 1 ? "mesa" : "mesas"}`,
      done: p.nMesas > 0, href: "/dashboard/mesas", cta: "Cadastrar",
    },
    {
      label: p.nEquipe === 0
        ? "Equipe — só você por enquanto"
        : `Equipe — ${p.nEquipe} ${p.nEquipe === 1 ? "membro" : "membros"}`,
      done: p.nEquipe > 0, href: "/dashboard/equipe", cta: "Convidar",
    },
    {
      label: "Abrir o primeiro turno no Caixa",
      done: p.nTurnos > 0, href: "/dashboard/caixa", cta: "Ver Caixa",
    },
  ];
}

/** Setup ainda aberto? Falta cardápio, custo em algum produto, ou mesas. */
function setupIncompleto(p: PrimeirosPassosData): boolean {
  return p.nProdutos === 0 || p.nProdutosComCusto < p.nProdutos || p.nMesas === 0;
}

export default async function DashboardPage() {
  const current = await getCurrentBar();
  if (!current) return null;
  // Só o dono vê o financeiro. Bar Manager cai no Estoque.
  if (!podeVerFinanceiro(current.role)) redirect("/dashboard/estoque");

  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    const [passos, ultimoTurno, inteligencia, alertas, metaMes, variacaoCusto] = await Promise.all([
      getPrimeirosPassos(current.bar.id, current.userId),
      getUltimoTurnoFechado(current.bar.id),
      getInteligenciaStage(current.bar.id),
      getAlertasEstoque(current.bar.id),
      getMetaMes(current.bar.id, current.bar.configuracoes?.meta_mensal ?? undefined),
      getVariacaoCusto(current.bar.id),
    ]);

    // ── Bar novo: nunca teve turno → guia de configuração ───────────────────
    if (passos.nTurnos === 0) {
      return (
        <GuiaConfiguracao
          variante="hero"
          passos={montarPassosSetup(passos)}
          subtitulo="Complete os passos abaixo. Quando o cardápio tiver custo, sua margem deixa de ser chute."
        />
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

        <div style={{ paddingTop: "24px", paddingBottom: "48px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* 0. SUPERBAR AI — acesso rápido no topo */}
          <section>

            <AiHeroInput barId={current.bar.id} alertCount={inteligencia.stage === 2 ? inteligencia.insightsNaoLidos : 0} />
          </section>

          {/* 0.5. Guia de configuração — persiste enquanto o setup (incl. custo) não fecha */}
          {setupIncompleto(passos) && (
            <section style={{ ...card }}>
              <GuiaConfiguracao
                variante="card"
                passos={montarPassosSetup(passos)}
                titulo="Termine de configurar seu bar"
                subtitulo="Enquanto faltar custo, sua margem e seu CMV ficam cegos."
              />
            </section>
          )}

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
                    <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{inteligencia.comandas} / 30</span>
                  </div>
                  <BarraProgresso valor={inteligencia.comandas / 30} raio={2} corBarra="rgba(255,255,255,0.5)" />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                      {inteligencia.diasAtivo >= 7 ? "✓" : "○"} 7 dias de operação
                    </span>
                    <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{inteligencia.diasAtivo} / 7</span>
                  </div>
                  <BarraProgresso valor={inteligencia.diasAtivo / 7} raio={2} corBarra="rgba(255,255,255,0.5)" />
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
  

              {/* Data do turno */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{label.dia}</span>
                <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{label.horas}</span>
              </div>

              {/* KPI cards — 2 colunas mobile, 4 desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "12px" }}>

                <div style={{ ...card }}>
                  <p style={overline}>Faturamento</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {currency.format(ultimoTurno.faturamento)}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                    {ultimoTurno.totalComandas} {ultimoTurno.totalComandas === 1 ? "comanda" : "comandas"}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>Ticket médio</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {currency.format(ultimoTurno.ticketMedio)}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>CMV</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                    {ultimoTurno.cmv !== null ? `${ultimoTurno.cmv}%` : "—"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                    {ultimoTurno.cmv === null ? "custos não configurados" : "custo sobre receita"}
                  </p>
                </div>

                <div style={{ ...card }}>
                  <p style={overline}>Top drink</p>
                  <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                      <p style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                        {currency.format(metaAtualFechado)}
                        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--fg-subtle)", marginLeft: 6 }}>de {currency.format(metaFechado)}</span>
                      </p>
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "white", marginTop: 18 }}>
                      {metaProgressoFechado}%
                    </span>
                  </div>
                  <BarraProgresso valor={metaProgressoFechado / 100} altura={3} raio={2} corBarra="rgba(255,255,255,0.6)" />
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

          {/* 2.5. CUSTO SUBINDO — variance alert (só quando há sinal) */}
          {variacaoCusto.length > 0 && (
            <section>
              <AlertaVariacaoCusto itens={variacaoCusto} />
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
                    <p style={{ fontSize: "3rem", fontWeight: 700, color: "white", marginTop: 4 }}>
                      {alertas.length}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
                      {alertas.length === 1 ? "item crítico" : "itens críticos"}
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "3rem", fontWeight: 700, color: "white", marginTop: 4 }}>
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
                <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--fg)", marginTop: 4 }}>
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

  const periodoSemana = resolvePeriodo({ preset: "7d" });
  const [kpis, alertas, produtosVendidos, metaMes, liveStats, pontosHora, rankingMesas, mixPgto, tempos, inteligencia, historicoTurnos, pontosReceita, receitaSemana] = await Promise.all([
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
    getHistoricoTurnos(current.bar.id),
    // Receita da semana não depende de turno/kpis — roda junto pra evitar mais uma viagem.
    getFaturamentoPorDia(current.bar.id, periodoSemana, "diaSemana"),
    getComparacaoPeriodo(current.bar.id, periodoSemana),
  ]);

  const comparacao = await getKpisComparacao(
    current.bar.id,
    turno,
    kpis,
    alertas.length,
    produtosVendidos
  );

  const produtosCategorizados = categorizarProdutos(produtosVendidos);
  // "Top drinks" = só drinks de verdade (categoria com ficha). Água e comida
  // ficam de fora do widget — mas seguem contando no CMV/cobertura acima.
  const produtosTop5 = [...produtosCategorizados]
    .filter((p) => p.usaFicha)
    .sort((a, b) => (b.margemPercentual ?? -Infinity) - (a.margemPercentual ?? -Infinity))
    .slice(0, TOP_DRINKS_LIMIT);
  const cmvAtual = calcularCmv(produtosVendidos);

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

  // Alertas críticos de AI (tipo "action")
  const alertasAction = insightsSorted.filter(i => i.tipo === "action");
  const temAlertas = alertas.length > 0 || alertasAction.length > 0;

  const filaAtual = tempos.totalRecebidos - tempos.totalEntregues;
  const cortesiaTotal = mixPgto.find(m => m.metodo === "cortesia")?.valor ?? 0;
  const cortesiaPct = kpis.faturamento > 0 ? (cortesiaTotal / kpis.faturamento) * 100 : 0;
  const impactoEstimado = insightsSorted[0]?.impactoReais ?? null;
  const horasTurno = Math.max((Date.now() - new Date(turno.aberto_em).getTime()) / 3_600_000, 0.5);

  // ── Períodos ──────────────────────────────────────────────────────────────
  // Só "hoje" tem dado real. Ontem/7 dias ainda não têm query por período —
  // estado honesto "aguardando dados", nunca número fabricado (Princípio 9).
  const drinksHoraBase = Math.max(1, Math.round(liveStats.drinks / horasTurno));

  function buildView(p: Periodo): PeriodView {
    if (p !== "hoje") {
      return {
        labelFat: p === "ontem" ? "Faturado ontem" : "Faturado (7 dias)",
        faturado: 0, deltaFat: 0, metaProgresso: 0,
        margem: null, veredito: { txt: "—", cor: "var(--fg-subtle)" },
        cmv: null, deltaCmv: 0, ticket: 0, deltaTicket: 0,
        drinksHora: 0, petiscosHora: null, maiorComanda: null,
        impacto: null, topDrinks: [], pending: true,
      };
    }
    const cmv = cmvAtual !== null ? Math.round(cmvAtual) : null;
    const margem = cmv !== null ? 100 - cmv : null;
    const veredito =
      margem === null ? { txt: "—", cor: "var(--fg-subtle)" }
      : margem >= 60 ? { txt: "Saudável", cor: "var(--ok)" }
      : margem >= 45 ? { txt: "Atenção", cor: "var(--warn)" }
      : { txt: "Baixa", cor: "var(--danger)" };
    const faturado = Math.round(kpis.faturamento);
    const metaProgressoView = meta > 0 ? Math.min(100, Math.round((faturado / meta) * 100)) : metaProgresso;
    // R$ e quantidade reais por produto — nada de topo fixo (Princípio 9).
    const topDrinks = produtosTop5.slice(0, 6).map((prod) => ({
      nome: prod.produtoNome,
      total: Math.round(prod.faturamento),
      qtd: prod.quantidadeVendida,
    }));
    return {
      labelFat: "Faturado no turno",
      faturado,
      deltaFat: comparacao.faturamento ?? 0,
      metaProgresso: metaProgressoView,
      margem, veredito, cmv,
      deltaCmv: comparacao.cmv ?? 0,
      ticket: Math.round(kpis.ticketMedio),
      deltaTicket: comparacao.ticketMedio ?? 0,
      drinksHora: drinksHoraBase,
      petiscosHora: null,   // sem query real ainda
      maiorComanda: null,   // sem query real ainda
      impacto: impactoEstimado !== null ? Math.round(Math.abs(impactoEstimado)) : null,
      topDrinks,
    };
  }

  const views: Record<Periodo, PeriodView> = { hoje: buildView("hoje"), ontem: buildView("ontem"), "7dias": buildView("7dias") };
  const superPrimeiro = produtosTop5.length > 0 && produtosTop5[0].margemPercentual !== null ? produtosTop5[0] : null;

  return (
    <OperacaoAoVivo
      views={views}
      meta={meta}
      comandasAbertas={kpis.comandasAbertas}
      superNome={superPrimeiro ? superPrimeiro.produtoNome : null}
      superMargem={superPrimeiro ? superPrimeiro.margemPercentual : null}
      barId={current.bar.id}
      alertCount={inteligencia.stage === 2 ? inteligencia.insightsNaoLidos : 0}
      turnoId={turno.id}
    />
  );
}
