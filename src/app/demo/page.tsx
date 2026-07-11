"use client";

/**
 * /demo — Dashboard de demonstração Aurora Bar
 * Dados 100% mockados, sem autenticação, para apresentação a clientes.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, History, UtensilsCrossed,
  TableProperties, Users, MonitorSmartphone, Wallet, Package, Sparkles,
} from "lucide-react";
import { BarChart } from "@/components/ui/bar-chart";
import { TrendText } from "@/components/ui/trend-text";

// ─── Design tokens ───────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "20px 24px",
};

const overline: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--fg-subtle)",
  margin: "0 0 8px",
};

// ─── Mock data ───────────────────────────────────────────────────
const MOCK = {
  barNome: "Aurora Bar",
  data: "Sáb, 28 Jun",
  faturamento: 6840.0,
  comandasAbertas: 24,
  ticketMedio: 285.0,
  margem: 31,           // CMV 31% → margem "saudável"
  comparacaoFaturamento: 18.5,
  comparacaoTicket: 9.2,
  metaProgresso: 78,
  metaFalta: 10800,
  metaAtingida: false,
  meta: 50000,
  receita7dias: [
    { label: "Dom", value: 3200 },
    { label: "Seg", value: 1820 },
    { label: "Ter", value: 2150 },
    { label: "Qua", value: 2780 },
    { label: "Qui", value: 3490 },
    { label: "Sex", value: 5820 },
    { label: "Sáb", value: 6840 },
  ],
  insights: [
    { tipo: "action", label: "CRÍTICO", texto: "CMV da Whisky Sour em 48% — acima do limite saudável", impacto: -380 },
    { tipo: "opportunity", label: "OPORTUNIDADE", texto: "Sex on the Beach tem 71% de margem e baixo giro — vale oferecer mais", impacto: 420 },
    { tipo: "info", label: "INFO", texto: "Pix respondeu por 62% dos pagamentos neste turno", impacto: undefined },
  ],
  topProduto: { nome: "Caipirinha de Morango", margem: 74 },
  ranking: [
    { produtoId: "1", produtoNome: "Sex on the Beach", margemPercentual: 71, faturamento: 940 },
    { produtoId: "2", produtoNome: "Chopp 500ml",      margemPercentual: 68, faturamento: 1240 },
    { produtoId: "3", produtoNome: "Cosmopolitan",     margemPercentual: 65, faturamento: 720 },
    { produtoId: "4", produtoNome: "Gin Tônica",       margemPercentual: 63, faturamento: 680 },
  ],
  picoHora: 22,
  pontosHora: [
    { hora: 18, drinks: 8 }, { hora: 19, drinks: 14 }, { hora: 20, drinks: 22 },
    { hora: 21, drinks: 31 }, { hora: 22, drinks: 38 }, { hora: 23, drinks: 29 },
  ],
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

// ─── Sidebar ─────────────────────────────────────────────────────
const links = [
  { href: "/demo",                   label: "Operação ao Vivo", icon: LayoutDashboard },
  { href: "/demo/inteligencia",      label: "Inteligência",     icon: Sparkles },
  { href: "/demo/relatorios",        label: "Relatórios",       icon: BarChart3 },
  { href: "/demo/turnos",            label: "Turnos",           icon: History },
  { href: "/demo/cardapio",          label: "Cardápio",         icon: UtensilsCrossed },
  { href: "/demo/mesas",             label: "Mesas",            icon: TableProperties },
  { href: "/demo/estoque",           label: "Estoque",          icon: Package },
  { href: "/demo/equipe",            label: "Equipe",           icon: Users },
  { href: "/demo/caixa",             label: "Caixa",            icon: Wallet },
];

function DemoSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, height: "100dvh", flexShrink: 0,
      background: "var(--bg-elevated)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--accent-fg)", lineHeight: 1 }}>S</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em" }}>SUPERBAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: "var(--fg-subtle)", flex: 1 }}>{MOCK.barNome}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
            background: "color-mix(in srgb, var(--accent) 14%, transparent)",
            color: "var(--accent)", flexShrink: 0,
          }}>Dono</span>
        </div>
        {/* Demo badge */}
        <div style={{
          marginTop: 8, padding: "3px 8px", borderRadius: 4,
          background: "color-mix(in srgb, var(--warn) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--warn) 30%, transparent)",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--warn)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Modo Demo
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 10px 0", flex: 1 }}>
        {links.map((link) => {
          const active = link.href === "/demo"
            ? pathname === "/demo"
            : pathname.startsWith(link.href);
          return (
            <div key={link.href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              fontSize: 13, fontWeight: active ? 500 : 400,
              color: active ? "var(--fg)" : "var(--fg-muted)",
              background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
              cursor: "default",
            }}>
              <link.icon
                style={{ width: 16, height: 16, flexShrink: 0, color: active ? "var(--accent)" : "var(--fg-subtle)" }}
                strokeWidth={1.75}
              />
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.label === "Inteligência" && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "var(--danger)", color: "#fff" }}>2</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: "color-mix(in srgb, var(--accent) 20%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "var(--accent)",
          }}>R</div>
          <span style={{ fontSize: 12, color: "var(--fg-muted)", flex: 1 }}>Rodrigo</span>
        </div>
        <div style={{ padding: "4px 10px" }}>
          {["Suporte", "Sugestão"].map(label => (
            <div key={label} style={{ padding: "7px 10px", fontSize: 12, color: "var(--fg-subtle)", borderRadius: 6 }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", borderTop: "1px solid var(--border)", color: "var(--fg-subtle)", fontSize: 12, fontWeight: 500 }}>
          <MonitorSmartphone style={{ width: 13, height: 13 }} />
          Ver operação
        </div>
      </div>
    </aside>
  );
}

// ─── Hero / LiveBar mock ──────────────────────────────────────────
function DemoHeroBar() {
  const ticketMedio = MOCK.faturamento / MOCK.comandasAbertas;

  const Delta = ({ pct: p }: { pct: number }) => {
    const pos = p >= 0;
    const color = pos ? "var(--ok)" : "var(--danger)";
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
        <svg width="6" height="6" viewBox="0 0 6 6" style={{ flexShrink: 0 }}>
          {pos
            ? <path d="M3 0.5L5.8 5.5H0.2L3 0.5Z" fill={color} />
            : <path d="M3 5.5L0.2 0.5H5.8L3 5.5Z" fill={color} />}
        </svg>
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color }}>{Math.abs(p).toFixed(1)}%</span>
        <span style={{ fontWeight: 400, color: "var(--fg-subtle)" }}>vs ontem</span>
      </span>
    );
  };

  const kpis = [
    { label: "Faturamento",  value: currency.format(MOCK.faturamento),  sub: <Delta pct={MOCK.comparacaoFaturamento} />, color: "var(--fg)" },
    { label: "Ticket Médio", value: currency.format(ticketMedio),        sub: <Delta pct={MOCK.comparacaoTicket} />,     color: "var(--fg)" },
    { label: "Margem",       value: `${100 - MOCK.margem}%`,             sub: <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>saudável</span>, color: "var(--ok)" },
  ];

  return (
    <div style={{ padding: "24px 32px 0" }}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "22px 28px 24px",
        display: "flex", alignItems: "stretch",
      }}>
        {/* Esquerda */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ok)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Ao Vivo</span>
            </span>
            <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>Turno aberto</span>
            <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{MOCK.data}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {kpis.map((kpi, i) => (
              <div key={i} style={{
                paddingLeft: i > 0 ? 28 : 0, paddingRight: i < 2 ? 28 : 0,
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              }}>
                <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
                  {kpi.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "0 0 9px", letterSpacing: "-0.025em" }}>
                  {kpi.value}
                </p>
                {kpi.sub}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "var(--border)", margin: "0 28px", flexShrink: 0 }} />

        {/* Direita */}
        <div style={{ width: 172, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-subtle)", margin: "0 0 8px" }}>
            Meta do Mês
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "0 0 auto", letterSpacing: "-0.04em" }}>
            {MOCK.metaProgresso}%
          </p>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 3, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: 3, background: "var(--accent)", borderRadius: 2, width: `${MOCK.metaProgresso}%` }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
              falta {currency.format(MOCK.metaFalta)}
            </p>
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-subtle)", margin: "0 0 6px" }}>
              Comandas
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.02em" }}>
              {MOCK.comandasAbertas}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "4px 0 0" }}>abertas agora</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vendas por hora ──────────────────────────────────────────────
function VendasPorHoraChart() {
  const pontos = MOCK.pontosHora;
  const W = 600, H = 110, padL = 4, padR = 4, padT = 8, padB = 22;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...pontos.map(p => p.drinks), 1);
  const minHora = pontos[0].hora, maxHora = pontos[pontos.length - 1].hora;
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 110 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="horaGradDemo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,53,0,0.35)" />
          <stop offset="100%" stopColor="rgba(255,53,0,0.0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#horaGradDemo)" />
      <path d={line} fill="none" stroke="rgba(255,53,0,0.85)" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
          {p.hora}h
        </text>
      ))}
    </svg>
  );
}

// ─── Ranking de produtos ──────────────────────────────────────────
function RankingProdutos() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 16px" }}>
        Próxima Melhor Ação
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 8px", lineHeight: 1.3 }}>
        Sugerir {MOCK.topProduto.nome} como primeira oferta nas próximas 2h
      </p>
      <p style={{ fontSize: 13, color: "white", fontWeight: 600, margin: "0 0 16px" }}>
        Potencial: +{currency.format(MOCK.faturamento * 0.3)} em receita adicional estimada
      </p>
      <p style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
        {MOCK.topProduto.nome} já vende bem e tem margem de {MOCK.topProduto.margem}%. Aumentar frequência de oferta é o caminho de menor esforço para crescer receita agora.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 20px" }}>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>Confiança:</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{MOCK.topProduto.margem}%</span>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>· Métrica-alvo: ticket médio do turno</span>
      </div>
      <div style={{ height: 1, background: "var(--border)", margin: "0 0 16px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK.ranking.map(p => (
          <div key={p.produtoId}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)", flex: 1, marginRight: 8 }}>{p.produtoNome}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{pct.format(p.margemPercentual ?? 0)}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "var(--accent)", borderRadius: 2, transformOrigin: "left", transform: `scaleX(${Math.min((p.margemPercentual ?? 0) / 100, 1)})`, transition: "transform 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Input mockado ─────────────────────────────────────────────
function DemoAiInput() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const DEMO_ANSWERS: Record<string, string> = {
    "Como está meu CMV agora?": "Seu CMV estimado está em 31% — dentro da faixa saudável (abaixo de 36%). O principal problema está na Whisky Sour, com CMV de 48%. Recomendo revisar a ficha técnica ou ajustar o preço de venda desse item.",
    "O que precisa da minha atenção?": "1 ponto crítico: CMV da Whisky Sour em 48%. Isso está gerando uma perda estimada de R$ 380 por turno comparado ao CMV ideal. Ação recomendada: revisar custo dos ingredientes ou reajustar preço de venda.",
    "Qual produto mais vendeu hoje?": "Caipirinha de Morango lidera com 38 unidades vendidas e margem de 74%. Em segundo lugar vem Chopp 500ml com 52 unidades (margem 68%). O Chopp tem mais volume mas a Caipirinha gera mais lucro por unidade.",
    "Resumo do turno": `Turno iniciado às 18h30. Faturamento atual: R$ 6.840 com 24 comandas abertas. Ticket médio de R$ 285 — 9,2% acima de ontem. Meta do mês: 78% atingida, faltam R$ 10.800. Pico de movimento esperado para as 22h. Um alerta ativo: CMV da Whisky Sour.`,
  };

  function ask(q: string) {
    setQuestion(q);
    setAnswer(DEMO_ANSWERS[q] ?? `Aurora Bar — ${q}: dados analisados com base em 24 comandas abertas e R$ 6.840 de faturamento neste turno.`);
  }

  const chipBase: React.CSSProperties = {
    background: "transparent", border: "1px solid var(--border)", borderRadius: 4,
    padding: "3px 8px", color: "var(--fg-subtle)", fontSize: 11, cursor: "pointer",
    whiteSpace: "nowrap", fontFamily: "var(--font-mono)",
  };

  const SUGGESTIONS = [
    "Como está meu CMV agora?",
    "O que precisa da minha atenção?",
    "Qual produto mais vendeu hoje?",
    "Resumo do turno",
  ];

  return (
    <div>
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => ask(s)} style={chipBase}>{s}</button>
          ))}
          <button
            onClick={() => ask("O que precisa da minha atenção agora? Me dê o impacto em reais.")}
            style={{ marginLeft: "auto", fontSize: 10, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-mono)" }}
          >
            1 ponto requer atenção
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask(question)}
            placeholder="Pergunte sobre margem, produtos, pagamentos ou gargalos…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--fg)", fontFamily: "var(--font-mono)", fontSize: 13 }}
          />
          <button
            onClick={() => ask(question)}
            style={{ background: "var(--accent)", border: "none", borderRadius: 4, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-fg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>
      {answer && (
        <div style={{ marginTop: 8, outline: "1px solid rgba(255,255,255,0.15)", padding: "14px 16px", fontSize: 13, color: "var(--fg)", fontFamily: "var(--font-mono)", lineHeight: 1.7 }}>
          {answer}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function DemoPage() {
  const insightColors = {
    action: "var(--danger)",
    opportunity: "var(--ok)",
    info: "var(--border-strong)",
  } as const;

  return (
    <div data-theme="dark" style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg)", fontFamily: "var(--font-sans)" }}>
      {/* Selo permanente: esta é a tela de demonstração — dados fictícios, nunca reais. */}
      <div style={{ position: "fixed", top: 12, right: 16, zIndex: 1000, display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "var(--accent)", color: "var(--accent-fg)", fontSize: 12, fontWeight: 700, letterSpacing: "0.02em", pointerEvents: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>
        DEMO · dados fictícios
      </div>
      <DemoSidebar />

      <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Hero */}
          <DemoHeroBar />

          {/* Content */}
          <div style={{ padding: "20px 32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* AI */}
            <DemoAiInput />

            {/* Gráfico 7 dias */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>
                  Receita dos últimos 7 dias
                </h2>
                <TrendText percent={24.3} comparativoLabel="vs semana passada" />
              </div>
              <div style={{ ...card, height: 220 }}>
                <BarChart data={MOCK.receita7dias} fill />
              </div>
            </div>

            {/* Bottom 3 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

              {/* Card 1 — Insights */}
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                {MOCK.insights.map((item, i) => {
                  const cor = insightColors[item.tipo as keyof typeof insightColors];
                  const isCritical = item.tipo === "action";
                  return (
                    <div key={i} style={{
                      borderBottom: i < MOCK.insights.length - 1 ? "1px solid var(--border)" : "none",
                      background: isCritical ? "color-mix(in srgb, var(--danger) 4%, transparent)" : "transparent",
                      padding: "14px 16px",
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: cor, margin: "0 0 5px" }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: isCritical ? 13 : 12, fontWeight: isCritical ? 700 : 500, color: "var(--fg)", margin: 0, lineHeight: 1.4 }}>
                        {item.texto}
                      </p>
                      {item.impacto !== undefined && (
                        <p style={{ fontSize: 12, fontWeight: 700, color: isCritical ? "var(--danger)" : "var(--ok)", margin: "4px 0 0" }}>
                          {item.impacto < 0 ? `−${currency.format(Math.abs(item.impacto))}` : `+${currency.format(item.impacto)}`}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div style={{ display: "block", padding: "10px 16px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                  2 análises disponíveis →
                </div>
              </div>

              {/* Card 2 — Vendas por hora */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ ...overline, margin: 0 }}>Vendas por hora</p>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>Pico {MOCK.picoHora}h</span>
                </div>
                <VendasPorHoraChart />
              </div>

              {/* Card 3 — Próxima ação */}
              <RankingProdutos />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
