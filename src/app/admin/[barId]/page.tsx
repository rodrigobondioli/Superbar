import { notFound } from "next/navigation";
import { getAdminBarDetalhe, getBarEvolucaoMensal } from "@/lib/admin/queries";
import type { BarDetalhe, HealthScore, ImplantacaoScore, EvolucaoMes } from "@/lib/admin/queries";
import type { AssinaturaStatus } from "@/types/database";
import { suspenderBar, reativarBar, alterarStatusAssinatura } from "@/lib/admin/actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<AssinaturaStatus, string> = {
  trial:        "#3b82f6",
  ativa:        "var(--ok)",
  cancelada:    "var(--fg-subtle)",
  inadimplente: "#ef4444",
};

const STATUS_LABEL: Record<AssinaturaStatus, string> = {
  trial:        "Trial",
  ativa:        "Ativa",
  cancelada:    "Cancelada",
  inadimplente: "Inadimplente",
};

const ROLE_LABEL: Record<string, string> = {
  dono: "Dono", gerente: "Gerente", bartender: "Bartender",
  caixa: "Caixa", bar_manager: "Gerente",
};

const HEALTH_CONFIG: Record<HealthScore, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  green:  { label: "Saudável",  emoji: "🟢", color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
  yellow: { label: "Atenção",   emoji: "🟡", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  red:    { label: "Risco",     emoji: "🔴", color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
};

const IMPL_CONFIG: Record<ImplantacaoScore, { label: string; color: string; bg: string; border: string }> = {
  completo:   { label: "Implantado",   color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
  parcial:    { label: "Em implant.",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  abandonado: { label: "Não implant.", color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function relDate(iso: string | null): string {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d}d atrás`;
  return `${Math.floor(d / 30)}m atrás`;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "20px 24px",
};

const overline: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
  textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 6px",
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function QuestionSection({
  question,
  answer,
  answerColor,
  children,
}: {
  question: string;
  answer: string;
  answerColor?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>
          {question}
        </h2>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: answerColor ?? "var(--fg-muted)",
          padding: "1px 8px", borderRadius: 8,
          background: answerColor ? `${answerColor}15` : "var(--bg)",
          border: `1px solid ${answerColor ? `${answerColor}30` : "var(--border)"}`,
        }}>
          {answer}
        </span>
      </div>
      {children}
    </section>
  );
}

function StatBlock({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={card}>
      <p style={overline}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: color ?? "var(--fg)", fontFamily: "var(--font-mono)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ── Evolução mensal (prova de valor) ──
function EvolucaoSection({ meses }: { meses: EvolucaoMes[] }) {
  const comDado = meses.filter(m => m.faturamento > 0 || m.ticket !== null);
  if (comDado.length < 2) return null;

  const c0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  function delta(vals: (number | null)[], mode: "pct" | "pp", upGood: boolean): { txt: string; cor: string } | null {
    const nn = vals.filter((v): v is number => v !== null);
    if (nn.length < 2) return null;
    const first = nn[0], last = nn[nn.length - 1];
    let raw: number;
    if (mode === "pct") { if (first === 0) return null; raw = ((last - first) / first) * 100; }
    else raw = last - first;
    const melhora = upGood ? raw >= 0 : raw <= 0;
    return { txt: `${raw > 0 ? "+" : ""}${Math.round(raw)}${mode === "pct" ? "%" : "pp"}`, cor: raw === 0 ? "var(--fg-muted)" : melhora ? "var(--ok)" : "var(--danger)" };
  }

  const th: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", padding: "0 0 12px", textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid var(--border-strong)" };
  const td: React.CSSProperties = { fontSize: 15, color: "var(--fg)", padding: "14px 0", textAlign: "right", fontVariantNumeric: "tabular-nums", borderTop: "1px solid var(--border-strong)", whiteSpace: "nowrap" };

  const linhas: { label: string; fmt: (v: number | null) => string; vals: (number | null)[]; mode: "pct" | "pp"; upGood: boolean }[] = [
    { label: "Faturamento",  fmt: v => v && v > 0 ? c0.format(v) : "—", vals: comDado.map(m => m.faturamento || null), mode: "pct", upGood: true },
    { label: "Ticket médio", fmt: v => v !== null ? c0.format(v) : "—", vals: comDado.map(m => m.ticket), mode: "pct", upGood: true },
    { label: "CMV",          fmt: v => v !== null ? `${v}%` : "—",       vals: comDado.map(m => m.cmv),    mode: "pp",  upGood: false },
    { label: "Margem",       fmt: v => v !== null ? `${v}%` : "—",       vals: comDado.map(m => m.margem), mode: "pp",  upGood: true },
  ];

  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Evolução</h2>
        <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>prova de valor pra renovação — 1º ao último mês com dado</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>Métrica</th>
              {comDado.map(m => <th key={m.mes} style={th}>{m.label}</th>)}
              <th style={th}>Variação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => {
              const d = delta(l.vals, l.mode, l.upGood);
              return (
                <tr key={l.label}>
                  <td style={{ ...td, textAlign: "left", color: "var(--fg-muted)", fontSize: 13 }}>{l.label}</td>
                  {l.vals.map((v, i) => <td key={i} style={td}>{l.fmt(v)}</td>)}
                  <td style={{ ...td, fontWeight: 600, color: d ? d.cor : "var(--fg-subtle)" }}>{d ? d.txt : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminBarPage({
  params,
}: {
  params: Promise<{ barId: string }>;
}) {
  const { barId } = await params;
  const [bar, evolucao] = await Promise.all([
    getAdminBarDetalhe(barId),
    getBarEvolucaoMensal(barId),
  ]);
  if (!bar) notFound();

  const health = HEALTH_CONFIG[bar.healthScore];
  const impl   = IMPL_CONFIG[bar.implantacaoScore];

  // ── Deriving answers ──────────────────────────────────────────────────────
  const usandoAnswer = bar.ultimo_turno_em === null
    ? "Nunca usou"
    : bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7
    ? `${bar.dias_sem_uso}d sem uso`
    : bar.turnos_7d > 0
    ? "Ativo esta semana"
    : "Pouca atividade";

  const usandoColor = bar.ultimo_turno_em === null ? "#ef4444"
    : bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7 ? "#f59e0b"
    : bar.turnos_7d > 0 ? "#22c55e"
    : "var(--fg-muted)";

  const pagandoAnswer = bar.assinatura_status
    ? STATUS_LABEL[bar.assinatura_status]
    : "Sem assinatura";
  const pagandoColor = bar.assinatura_status ? STATUS_COLOR[bar.assinatura_status] : "#ef4444";

  const coberturaBg = bar.cobertura_custo_pct >= 80 ? "var(--ok)" : bar.cobertura_custo_pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

      {/* Breadcrumb */}
      <a href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)", textDecoration: "none" }}>
        ← Clientes
      </a>

      {/* Header ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          {/* Nome + status bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.02em" }}>
              {bar.nome}
            </h1>
            {!bar.ativo && (
              <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: 8, padding: "2px 7px", fontWeight: 700, letterSpacing: "0.08em" }}>
                SUSPENSO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 3px" }}>
            /{bar.slug}
            {(bar.cidade || bar.estado) && <> · {[bar.cidade, bar.estado].filter(Boolean).join(", ")}</>}
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
            Cadastrado em {shortDate(bar.created_at)}
            {bar.cnpj && ` · CNPJ ${bar.cnpj}`}
          </p>
        </div>

        {/* Score badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${health.border}`, background: health.bg, fontSize: 12, fontWeight: 700, color: health.color, letterSpacing: "0.02em" }}>
            {health.emoji} {health.label}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${impl.border}`, background: impl.bg, fontSize: 12, fontWeight: 700, color: impl.color, letterSpacing: "0.02em" }}>
            {impl.label}
          </span>
          {bar.assinatura_status && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid var(--border)`, background: "var(--bg-elevated)", fontSize: 12, fontWeight: 600, color: STATUS_COLOR[bar.assinatura_status] }}>
              {STATUS_LABEL[bar.assinatura_status]}
            </span>
          )}
        </div>
      </div>

      {/* ── 1. Está usando? ──────────────────────────────────────────────────── */}
      <QuestionSection question="Está usando?" answer={usandoAnswer} answerColor={usandoColor}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          <StatBlock
            label="Último turno"
            value={bar.ultimo_turno_em ? relDate(bar.ultimo_turno_em) : "—"}
            sub={bar.ultimo_turno_em ? shortDate(bar.ultimo_turno_em) : "nunca abriu turno"}
            color={bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7 ? "#f59e0b" : "var(--fg)"}
          />
          <StatBlock
            label="Dias sem uso"
            value={bar.dias_sem_uso !== null ? bar.dias_sem_uso : "—"}
            color={bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7 ? "#ef4444" : "var(--fg)"}
          />
          <StatBlock
            label="Turnos 7d"
            value={bar.turnos_7d}
            sub={`${bar.comandas_7d} comanda${bar.comandas_7d !== 1 ? "s" : ""}`}
            color={bar.turnos_7d === 0 ? "var(--fg-subtle)" : "#22c55e"}
          />
          <StatBlock
            label="Faturamento 7d"
            value={bar.faturamento_7d > 0 ? currency.format(bar.faturamento_7d) : "—"}
            color={bar.faturamento_7d > 0 ? "var(--fg)" : "var(--fg-subtle)"}
          />
        </div>
      </QuestionSection>

      {/* ── 2. Está implantado? ──────────────────────────────────────────────── */}
      <QuestionSection question="Está implantado?" answer={impl.label} answerColor={impl.color}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
          <StatBlock
            label="Turnos totais"
            value={bar.total_turnos}
            sub={bar.total_turnos === 0 ? "nunca abriu turno" : "histórico"}
            color={bar.total_turnos === 0 ? "#ef4444" : bar.total_turnos >= 3 ? "#22c55e" : "#f59e0b"}
          />
          <StatBlock
            label="Membros ativos"
            value={bar.membros.filter((m) => m.ativo).length}
            sub={`de ${bar.membros.length} cadastrado${bar.membros.length !== 1 ? "s" : ""}`}
            color={bar.membros.filter((m) => m.ativo).length >= 2 ? "#22c55e" : "#f59e0b"}
          />
          <StatBlock
            label="Produtos"
            value={bar.total_produtos}
            sub={`${bar.total_produtos_com_custo} com custo`}
            color={bar.total_produtos === 0 ? "#ef4444" : "var(--fg)"}
          />
          <StatBlock
            label="Cobertura de custo"
            value={`${bar.cobertura_custo_pct}%`}
            sub={bar.total_produtos > 0 ? `${bar.total_produtos_com_custo}/${bar.total_produtos} produtos` : "sem produtos"}
            color={coberturaBg}
          />
        </div>

        {/* Barra de cobertura */}
        {bar.total_produtos > 0 && (
          <div style={{ ...card, padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ ...overline, margin: 0 }}>Cobertura de ficha técnica</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: coberturaBg, fontFamily: "var(--font-mono)" }}>
                {bar.cobertura_custo_pct}%
              </span>
            </div>
            <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${bar.cobertura_custo_pct}%`, height: "100%", background: coberturaBg, borderRadius: 3 }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "6px 0 0" }}>
              {bar.cobertura_custo_pct < 60
                ? "Preencher fichas técnicas para CMV real"
                : "Boa cobertura — CMV confiável"}
            </p>
          </div>
        )}

        {/* Equipe */}
        {bar.membros.length > 0 && (
          <div style={{ ...card, marginTop: 10, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {(["Nome", "Cargo", "Status", "Desde"] as const).map((h, i) => (
                    <th key={h} style={{ padding: "8px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-subtle)", textAlign: i === 3 ? "right" : "left", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bar.membros.map((m) => (
                  <tr key={m.id}>
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--fg)", fontWeight: 500 }}>{m.nome ?? "—"}</td>
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--fg-muted)" }}>{ROLE_LABEL[m.role] ?? m.role}</td>
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: m.ativo ? "var(--ok)" : "var(--fg-subtle)" }}>{m.ativo ? "Ativo" : "Inativo"}</td>
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--fg-muted)", textAlign: "right" }}>{shortDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QuestionSection>

      {/* ── 3. Está saudável? ────────────────────────────────────────────────── */}
      <QuestionSection question="Está saudável?" answer={health.label} answerColor={health.color}>
        {bar.alertas.length === 0 ? (
          <div style={{ ...card, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Nenhum alerta de risco</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bar.alertas.map((a, i) => (
              <div key={i} style={{ ...card, padding: "12px 18px", background: a.level === "red" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${a.level === "red" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14 }}>{a.level === "red" ? "🔴" : "🟡"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: a.level === "red" ? "#ef4444" : "#f59e0b" }}>{a.label}</span>
              </div>
            ))}
          </div>
        )}
      </QuestionSection>

      {/* ── 4. Está pagando? ─────────────────────────────────────────────────── */}
      <QuestionSection question="Está pagando?" answer={pagandoAnswer} answerColor={pagandoColor}>
        <div style={card}>
          {bar.assinatura_status ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 24 }}>
              <div>
                <p style={overline}>Status</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: STATUS_COLOR[bar.assinatura_status], margin: 0 }}>
                  {STATUS_LABEL[bar.assinatura_status]}
                </p>
              </div>
              <div>
                <p style={overline}>Plano</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{bar.plano_nome ?? "—"}</p>
                {bar.plano_preco !== null && (
                  <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                    {currency.format(bar.plano_preco)}/mês
                  </p>
                )}
              </div>
              {bar.assinatura_status === "trial" && bar.trial_fim && (
                <div>
                  <p style={overline}>Trial até</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: new Date(bar.trial_fim) < new Date() ? "#ef4444" : "var(--fg)", margin: 0 }}>
                    {shortDate(bar.trial_fim)}
                  </p>
                </div>
              )}
              {bar.periodo_inicio && (
                <div>
                  <p style={overline}>Período</p>
                  <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                    {shortDate(bar.periodo_inicio)}
                    {bar.periodo_fim && <> → {shortDate(bar.periodo_fim)}</>}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Sem assinatura cadastrada.</p>
          )}
        </div>
      </QuestionSection>

      {/* ── Ações ────────────────────────────────────────────────────────────── */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", margin: "0 0 14px", letterSpacing: "-0.01em" }}>
          Ações
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>

          <a href={`/dashboard?_admin_bar=${bar.id}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--accent)", color: "var(--accent-fg)", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            ↗ Abrir dashboard
          </a>

          {bar.ativo ? (
            <form action={async () => { "use server"; await suspenderBar(bar.id); }}>
              <button type="submit" style={{ padding: "8px 16px", background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Suspender bar
              </button>
            </form>
          ) : (
            <form action={async () => { "use server"; await reativarBar(bar.id); }}>
              <button type="submit" style={{ padding: "8px 16px", background: "transparent", color: "var(--ok)", border: "1px solid rgba(101,163,13,0.4)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Reativar bar
              </button>
            </form>
          )}

          {bar.assinatura_id && bar.assinatura_status !== "inadimplente" && (
            <form action={async () => { "use server"; await alterarStatusAssinatura(bar.assinatura_id!, "inadimplente", bar.id); }}>
              <button type="submit" style={{ padding: "8px 16px", background: "transparent", color: "var(--fg-muted)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Marcar inadimplente
              </button>
            </form>
          )}

          {bar.assinatura_id && (bar.assinatura_status === "inadimplente" || bar.assinatura_status === "cancelada") && (
            <form action={async () => { "use server"; await alterarStatusAssinatura(bar.assinatura_id!, "ativa", bar.id); }}>
              <button type="submit" style={{ padding: "8px 16px", background: "transparent", color: "var(--ok)", border: "1px solid rgba(101,163,13,0.4)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Reativar assinatura
              </button>
            </form>
          )}
        </div>
        <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "12px 0 0", fontStyle: "italic" }}>
          "Entrar como suporte" com log de auditoria — a implementar.
        </p>
      </section>

      {/* Config técnica */}
      <details style={{ ...card }}>
        <summary style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)", cursor: "pointer", userSelect: "none" }}>
          Configurações técnicas do bar
        </summary>
        <pre style={{ marginTop: 12, fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {JSON.stringify(bar.configuracoes, null, 2)}
        </pre>
      </details>
    </div>
  );
}
