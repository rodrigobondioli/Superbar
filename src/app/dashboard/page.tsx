import { TrendingUp } from "lucide-react";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";
import { PeriodoSelector } from "@/components/dashboard/periodo-selector";
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

const TOP_DRINKS_LIMIT = 5;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataExtenso = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
const dataLongaFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

function capitalizarPrimeiraLetra(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Triângulo preenchido (estilo material arrow-drop-up), igual ao Figma.
function Tri({ up, color }: { up: boolean; color: string }) {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" style={{ flexShrink: 0 }} aria-hidden>
      <path d={up ? "M5.5 0 L11 9 L0 9 Z" : "M5.5 9 L11 0 L0 0 Z"} fill={color} />
    </svg>
  );
}

// Prefixo "R$" menor que o número (dimensiona com a fonte do valor).
function Cifrao() {
  return <span style={{ fontSize: "0.42em", fontWeight: 600, color: "var(--fg-muted)", marginRight: "0.16em", letterSpacing: 0, verticalAlign: "baseline" }}>R$</span>;
}

// Delta vs. período anterior (▲/▼ + cor semântica). invert=true → subir é ruim (ex: CMV).
function DeltaRow({ value, invert = false }: { value: number | null | undefined; invert?: boolean }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
      <Tri up={up} color={good ? "var(--accent)" : "var(--danger)"} />
      <span style={{ color: "var(--fg)" }}>
        {Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% {up ? "maior" : "menor"} vs. sem. passada
      </span>
    </div>
  );
}

const superLabel: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "var(--fg-muted)" };

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

const kpiCard: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 24,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};
const kpiLabel: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 500, color: "var(--fg-muted)" };
const kpiMetric: React.CSSProperties = { display: "block", fontSize: 64, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1, marginTop: 15 };
const kpiDivider: React.CSSProperties = { height: 1, background: "var(--border-strong)", marginBottom: 11 };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams;
  const periodo: "hoje" | "ontem" | "7dias" = sp?.periodo === "ontem" ? "ontem" : sp?.periodo === "7dias" ? "7dias" : "hoje";

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

  const [kpis, alertas, produtosVendidos, metaMes, liveStats, pontosHora, rankingMesas, mixPgto, tempos, inteligencia, historicoTurnos] = await Promise.all([
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

  // Alertas críticos de AI (tipo "action")
  const alertasAction = insightsSorted.filter(i => i.tipo === "action");
  const temAlertas = alertas.length > 0 || alertasAction.length > 0;

  const filaAtual = tempos.totalRecebidos - tempos.totalEntregues;
  const cortesiaTotal = mixPgto.find(m => m.metodo === "cortesia")?.valor ?? 0;
  const cortesiaPct = kpis.faturamento > 0 ? (cortesiaTotal / kpis.faturamento) * 100 : 0;
  const impactoEstimado = insightsSorted[0]?.impactoReais ?? null;
  const horasTurno = Math.max((Date.now() - new Date(turno.aberto_em).getTime()) / 3_600_000, 0.5);

  // ── Simulação de período (DEMO) — "hoje" usa dados reais; ontem/7 dias são fictícios ──
  const drinksHoraBase = Math.max(1, Math.round(liveStats.drinks / horasTurno));
  const SIM = {
    hoje:   { fator: 1,    ticketMul: 1,    labelFat: "Faturado no turno", drinksHora: drinksHoraBase,        petiscosHora: Math.max(1, Math.round(drinksHoraBase * 0.42)), maiorComanda: Math.max(80, Math.round(kpis.ticketMedio * 2.4)), cmv: 34, deltaFat: -15.8, deltaCmv: 18,   deltaTicket: 26.3 },
    ontem:  { fator: 0.86, ticketMul: 0.94, labelFat: "Faturado ontem",    drinksHora: 47, petiscosHora: 19, maiorComanda: 312, cmv: 37, deltaFat: 8.2,   deltaCmv: -3.5, deltaTicket: 11.5 },
    "7dias":{ fator: 6.3,  ticketMul: 1.05, labelFat: "Faturado (7 dias)", drinksHora: 52, petiscosHora: 22, maiorComanda: 548, cmv: 33, deltaFat: 12.4,  deltaCmv: 5.2,  deltaTicket: 9.1 },
  }[periodo];

  const faturamentoView = Math.round(kpis.faturamento * SIM.fator);
  const ticketView = Math.round(kpis.ticketMedio * SIM.ticketMul);
  const metaProgressoView = meta > 0 ? Math.min(100, Math.round((faturamentoView / meta) * 100)) : metaProgresso;
  const impactoView = impactoEstimado !== null ? Math.round(Math.abs(impactoEstimado) * SIM.fator) : null;
  const cmvView = periodo === "hoje" && cmvAtual !== null ? Math.round(cmvAtual) : SIM.cmv;
  const margemView = 100 - cmvView;
  const vereditoView = margemView >= 60 ? { txt: "Saudável", cor: "var(--ok)" } : margemView >= 45 ? { txt: "Atenção", cor: "var(--warn)" } : { txt: "Baixa", cor: "var(--danger)" };

  // Top drinks (DEMO) — total gerado por drink no turno + quantidade vendida.
  // Nome e preço unitário são reais; volume é simulado com dispersão e escala com o período.
  // Quando o bar for real, trocar por getProdutosVendidosPeriodo (já traz quantidadeVendida real).
  const topShares = [1, 0.83, 0.64, 0.47, 0.36, 0.28];
  const topTopo = 720; // R$ do 1º colocado (hoje)
  const topDrinksView = produtosTop5.slice(0, 6).map((p, i) => {
    const total = Math.round(topTopo * SIM.fator * (topShares[i] ?? 0.22));
    const precoUnit = p.quantidadeVendida > 0 ? p.faturamento / p.quantidadeVendida : (p.faturamento || 25);
    const qtd = Math.max(1, Math.round(total / Math.max(precoUnit, 5)));
    return { nome: p.produtoNome, total, qtd };
  });

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "14px 32px 16px",
      gap: 12,
      overflow: "hidden",
      boxSizing: "border-box",
    }}>

      {/* ══ HEADER: Operação ao vivo + períodos ══════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>Operação ao vivo</h1>
        <PeriodoSelector periodo={periodo} />
      </div>

      {/* ══ ROW 1: KPI CARDS (Figma) ═════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 16, flexShrink: 0 }}>

        {/* Faturado no turno — spec exata do Figma (532×238, r24, pad32) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)" }}>{SIM.labelFat}</span>
          <span style={{ fontSize: 64, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1, marginTop: 15 }}><Cifrao />{faturamentoView.toLocaleString("pt-BR")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, fontSize: 15 }}>
            <Tri up={SIM.deltaFat >= 0} color={SIM.deltaFat >= 0 ? "var(--accent)" : "var(--danger)"} />
            <span style={{ color: "var(--fg)" }}>
              {Math.abs(SIM.deltaFat).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% {SIM.deltaFat >= 0 ? "maior" : "menor"} vs. sem. passada
            </span>
          </div>
          {/* barra de progresso (linha fina — faz o papel de separador) */}
          <div style={{ height: 2, borderRadius: 999, background: "var(--border-strong)", overflow: "hidden", marginTop: 25 }}>
            <div style={{ height: 2, borderRadius: 999, background: "var(--accent)", width: `${metaProgressoView}%` }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 11 }}>
            <span style={{ fontSize: 15, fontWeight: 400, color: "var(--fg-muted)" }}>Meta Mensal - R$ {Math.round(meta).toLocaleString("pt-BR")}</span>
            <span style={{ fontSize: 15, fontWeight: 400, color: "var(--accent)" }}>{metaProgressoView}%</span>
          </div>
        </div>

        {/* Margem */}
        <div style={kpiCard}>
          <div>
            <span style={kpiLabel}>Margem</span>
            <span style={kpiMetric}>{margemView}%</span>
          </div>
          <div>
            <div style={kpiDivider} />
            <span style={{ fontSize: 15, fontWeight: 400, color: vereditoView.cor }}>{vereditoView.txt}</span>
          </div>
        </div>

        {/* Custo (CMV) */}
        <div style={kpiCard}>
          <div>
            <span style={kpiLabel}>Custo (CMV)</span>
            <span style={kpiMetric}>{cmvView}%</span>
          </div>
          <div>
            <div style={kpiDivider} />
            <DeltaRow value={SIM.deltaCmv} invert />
          </div>
        </div>

        {/* Ticket Médio */}
        <div style={kpiCard}>
          <div>
            <span style={kpiLabel}>Ticket Médio</span>
            <span style={kpiMetric}><Cifrao />{ticketView.toLocaleString("pt-BR")}</span>
          </div>
          <div>
            <div style={kpiDivider} />
            <DeltaRow value={SIM.deltaTicket} />
          </div>
        </div>
      </div>

      {/* ══ ROW 2: STAT PILLS ════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, flexShrink: 0 }}>
        {[
          { label: "Drinks por hora", value: String(SIM.drinksHora) },
          { label: "Petiscos por hora", value: String(SIM.petiscosHora) },
          { label: "Mesas abertas agora", value: String(kpis.comandasAbertas) },
          { label: "Maior valor de comanda", value: `R$ ${SIM.maiorComanda.toLocaleString("pt-BR")}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>{s.label}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              <TrendingUp size={16} strokeWidth={2.5} style={{ color: "var(--warn)" }} />
            </span>
          </div>
        ))}
      </div>

      {/* ══ ROW 3: AI + SUPER AÇÃO (esq) · TOP DRINKS (dir) ═══════════════ */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1.32fr 1fr", gap: 16, alignItems: "stretch" }}>

        {/* LEFT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>

          <AiHeroInput fill barId={current.bar.id} alertCount={inteligencia.stage === 2 ? inteligencia.insightsNaoLidos : 0} />

          {produtosTop5.length > 0 && produtosTop5[0].margemPercentual !== null && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, display: "flex", alignItems: "stretch", gap: 32, flexShrink: 0 }}>

              {/* Seção 1 — Super ação */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: "0 0 auto", minWidth: 150 }}>
                <span style={superLabel}>Super ação</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em", lineHeight: 1, margin: 0 }}>{produtosTop5[0].produtoNome}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
                    <Tri up color="var(--ok)" />
                    <span style={{ color: "var(--fg-muted)" }}>{Math.round(produtosTop5[0].margemPercentual)}% de margem</span>
                  </div>
                </div>
              </div>

              <div style={{ width: 1, background: "var(--border-strong)", alignSelf: "stretch", flexShrink: 0 }} />

              {/* Seção 2 — texto do meio */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", minWidth: 0 }}>
                <p style={{ fontSize: 15, color: "var(--fg-muted)", lineHeight: 1.5, margin: 0 }}>Apareceu pouco hoje. Sugerir nas próximas 2 horas pode mais que dobrar as vendas.</p>
              </div>

              <div style={{ width: 1, background: "var(--border-strong)", alignSelf: "stretch", flexShrink: 0 }} />

              {/* Seção 3 — Impacto direto */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: "0 0 auto", minWidth: 167 }}>
                <span style={superLabel}>Impacto direto</span>
                {impactoEstimado !== null && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}><Cifrao />{(impactoView ?? 0).toLocaleString("pt-BR")}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>Risco: <span style={{ color: "var(--ok)" }}>Baixo</span></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Top drinks — spec exata do Figma (Frame 162: r24, pad 24/32/32/32) */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: "24px 32px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0, overflow: "hidden" }}>
          <div>
          <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", marginBottom: 32 }}>Top drinks do turno</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {topDrinksView.map((p, i) => {
              const max = topDrinksView[0]?.total || 1;
              const pct = Math.max(6, Math.round((p.total / max) * 100));
              return (
                <div key={p.nome + i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <span style={{ fontSize: 15, color: "var(--fg)", display: "flex", gap: 8, minWidth: 0 }}>
                      <span style={{ color: "var(--fg-muted)", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome} <span style={{ color: "var(--fg-muted)" }}>({p.qtd})</span></span>
                    </span>
                    <span style={{ fontSize: 15, color: "var(--fg)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{currency.format(p.total)}</span>
                  </div>
                  <div style={{ height: 2, borderRadius: 999, background: "var(--border-strong)", overflow: "hidden" }}>
                    <div style={{ height: 2, borderRadius: 999, background: "linear-gradient(90deg, var(--warn) 0%, var(--accent) 100%)", width: `${pct}%`, transformOrigin: "left", animation: "barGrow 0.85s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${i * 90}ms` }} />
                  </div>
                </div>
              );
            })}
            {produtosTop5.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", padding: "12px 0" }}>Sem vendas registradas ainda.</p>
            )}
          </div>
          </div>
          <a href={`/dashboard/turnos/${turno.id}`} style={{ marginTop: 32, alignSelf: "flex-start", padding: "8px 16px", borderRadius: 999, background: "var(--accent)", color: "var(--accent-fg)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Comparar com turno anterior</a>
        </div>
      </div>

    </div>
  );
}
