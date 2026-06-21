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
} from "@/lib/dashboard/queries";
import { categorizarProdutos, calcularCmv } from "@/lib/dashboard/menu-engineering";
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
    const passos = await getPrimeirosPassos(current.bar.id, current.userId);
    const tudo_pronto = passos.nProdutos > 0 && passos.nMesas > 0;
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

          {/* Título contextual */}
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--fg)", margin: "0 0 6px", textAlign: "center" }}>
            {passos.nTurnos === 0 ? "Vamos configurar seu bar" : "Aguardando início do turno"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 28px", textAlign: "center", lineHeight: 1.6 }}>
            {passos.nTurnos === 0
              ? "Complete os passos abaixo. Quando tudo estiver pronto, peça ao caixa para abrir o primeiro turno."
              : "O caixa abre o turno pelo painel de Caixa antes de iniciar o atendimento."}
          </p>

          {/* Checklist — só aparece no primeiro acesso */}
          {passos.nTurnos === 0 && (
            <div style={{ ...card, padding: 0, marginBottom: 20 }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 20px",
                    borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* Indicador */}
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: step.done ? "var(--ok-bg)" : "color-mix(in srgb, var(--fg) 5%, transparent)",
                    border: `1.5px solid ${step.done ? "var(--ok)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "var(--ok)",
                  }}>
                    {step.done ? "✓" : ""}
                  </div>

                  {/* Label */}
                  <span style={{ flex: 1, fontSize: 13, color: step.done ? "var(--fg-muted)" : "var(--fg)" }}>
                    {step.label}
                  </span>

                  {/* CTA */}
                  {step.href && !step.done && (
                    <a href={step.href} style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-bright)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                      Configurar →
                    </a>
                  )}
                </div>
              ))}

              {/* Último passo: abrir turno — informativo, link para Caixa */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "color-mix(in srgb, var(--fg) 5%, transparent)",
                  border: "1.5px solid var(--border)",
                }} />
                <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>
                  Peça ao caixa para abrir o primeiro turno
                </span>
                <a href="/dashboard/caixa" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-bright)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Ver Caixa →
                </a>
              </div>
            </div>
          )}

          {/* Retorno: link informativo para Caixa */}
          {passos.nTurnos > 0 && (
            <a
              href="/dashboard/caixa"
              style={{
                display: "block", textAlign: "center",
                padding: "14px 24px",
                background: "color-mix(in srgb, var(--fg) 5%, transparent)",
                color: "var(--fg-muted)",
                borderRadius: "6px",
                fontSize: "13px", fontWeight: 600,
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Ir para Caixa →
            </a>
          )}
        </div>
      </div>
    );
  }

  const [kpis, alertas, produtosVendidos, metaMes, liveStats, pontosHora, rankingMesas, mixPgto, tempos] = await Promise.all([
    getKpisTurno(turno),
    getAlertasEstoque(current.bar.id),
    getProdutosVendidosTurno(current.bar.id, turno.id),
    getMetaMes(current.bar.id, current.bar.configuracoes?.meta_mensal ?? undefined),
    getLiveStats(current.bar.id, turno.id),
    getHorarioPico(current.bar.id, turno.id),
    getRankingMesas(current.bar.id, turno.id),
    getMixPagamento(current.bar.id, turno.id),
    getTempoMedioPreparo(current.bar.id, turno.id),
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

  // P3 — insights declarativos operacionais
  const pico = calcularPico(pontosHora);
  const insightsOp = gerarInsightsOperacionais({
    pico,
    mesas: rankingMesas,
    mix: mixPgto,
    tempos,
    faturamentoTurno: kpis.faturamento,
  });
  const todosInsights = [...insightsOp, ...insights];

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
        <p style={{ fontSize: "13px", color: "var(--fg-subtle)", marginBottom: "24px", textAlign: "center" }}>
          {dataFormatada} · turno aberto
        </p>

        <AiHeroInput barId={current.bar.id} />
      </div>

      {/* Blocos principais */}
      <div
        className="lg:px-8"
        style={{ paddingTop: "32px", paddingBottom: "48px", display: "flex", flexDirection: "column", gap: "32px" }}
      >

        {/* Bloco 1 — AO VIVO */}
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

        {/* Bloco 2 — TURNO ATUAL */}
        <section>
          <span style={sectionLabel}>Turno atual</span>
          <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: "12px" }}>

            {/* CMV */}
            <div
              className="animate-fade-in-up flex items-center justify-between lg:block"
              style={{ ...card, animationDelay: "0ms" }}
            >
              <div className="flex flex-col lg:block">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <p style={overline}>CMV</p>
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
        </section>

        {/* Bloco 3 — OPERAÇÃO */}
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

        {/* Bloco 4 — VISÃO GERAL */}
        <section>
          <span style={sectionLabel}>Visão geral</span>
          <div className="grid lg:grid-cols-5" style={{ gap: "12px" }}>

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

      </div>
    </div>
  );
}
