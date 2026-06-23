"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BarResumo, RiskAlert, HealthScore } from "@/lib/admin/queries";
import type { AssinaturaStatus } from "@/types/database";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_DOT: Record<AssinaturaStatus, string> = {
  trial:        "#3b82f6",
  ativa:        "#22c55e",
  cancelada:    "#65656b",
  inadimplente: "#ef4444",
};

const STATUS_LABEL: Record<AssinaturaStatus, string> = {
  trial:        "Trial",
  ativa:        "Ativa",
  cancelada:    "Cancelada",
  inadimplente: "Inadimplente",
};

const HEALTH_ORDER: Record<HealthScore, number> = { red: 0, yellow: 1, green: 2 };

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function relDate(iso: string | null): string {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d}d atrás`;
  return `${Math.floor(d / 30)}m atrás`;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function HealthBadge({ score, alertas }: { score: HealthScore; alertas: RiskAlert[] }) {
  const config = {
    green:  { emoji: "🟢", label: "Saudável",  color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
    yellow: { emoji: "🟡", label: "Atenção",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    red:    { emoji: "🔴", label: "Risco",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
  }[score];

  const topAlert = alertas[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 9px", borderRadius: 99,
        border: `1px solid ${config.border}`,
        background: config.bg,
        fontSize: 11, fontWeight: 600, color: config.color,
        width: "fit-content", whiteSpace: "nowrap",
      }}>
        {config.emoji} {config.label}
      </span>
      {topAlert && (
        <span style={{
          fontSize: 10, color: topAlert.level === "red" ? "#ef4444" : "#f59e0b",
          paddingLeft: 2,
        }}>
          {topAlert.label}
          {alertas.length > 1 && <span style={{ color: "var(--fg-subtle)" }}> +{alertas.length - 1}</span>}
        </span>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: AssinaturaStatus | null }) {
  if (!status) return <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>—</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99,
      border: `1px solid ${STATUS_DOT[status]}33`,
      background: `${STATUS_DOT[status]}10`,
      fontSize: 11, fontWeight: 600, color: STATUS_DOT[status],
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[status], flexShrink: 0,
        ...(status === "ativa" ? { boxShadow: `0 0 6px ${STATUS_DOT[status]}` } : {}),
      }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function Activity7d({ turnos, comandas, faturamento }: { turnos: number; comandas: number; faturamento: number }) {
  if (turnos === 0 && comandas === 0)
    return <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>sem atividade</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 12, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
        {turnos} turno{turnos !== 1 ? "s" : ""}
        {comandas > 0 && <> · {comandas} cmd</>}
      </span>
      {faturamento > 0 && (
        <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
          {currency.format(faturamento)}
        </span>
      )}
    </div>
  );
}

// ─── Tabela principal ─────────────────────────────────────────────────────────

export function AdminBaresTable({ bares }: { bares: BarResumo[] }) {
  const router  = useRouter();
  const [hover, setHover]   = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Ordenar: risco → atenção → saudável, depois por último uso
  const sorted = [...bares].sort((a, b) => {
    const hDiff = HEALTH_ORDER[a.healthScore] - HEALTH_ORDER[b.healthScore];
    if (hDiff !== 0) return hDiff;
    // Se mesmo nível, mais antigo (sem uso) primeiro
    const dA = a.dias_sem_uso ?? 9999;
    const dB = b.dias_sem_uso ?? 9999;
    return dB - dA;
  });

  const filtered = sorted.filter(
    (b) =>
      b.nome.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      (b.cidade ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (bares.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--fg-subtle)", fontSize: 14 }}>
        Nenhum bar cadastrado.
      </div>
    );

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "var(--fg-subtle)",
    textAlign: "left", borderBottom: "1px solid var(--border)",
    background: "var(--bg)", whiteSpace: "nowrap", userSelect: "none",
  };

  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 8, overflow: "hidden" }}>

      {/* Toolbar */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar bares…"
            style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px 6px 30px", fontSize: 12, color: "var(--fg)", outline: "none" }}
          />
        </div>
        <span style={{ fontSize: 12, color: "var(--fg-subtle)", marginLeft: "auto" }}>
          {filtered.length} de {bares.length}
        </span>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, paddingLeft: 20 }}>Bar</th>
              <th style={thStyle}>Saúde</th>
              <th style={thStyle}>Último uso</th>
              <th style={thStyle}>Atividade 7d</th>
              <th style={{ ...thStyle, textAlign: "right", paddingRight: 20 }}>Plano</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bar) => {
              const isHovered = hover === bar.id;
              const isRed     = bar.healthScore === "red";
              const isYellow  = bar.healthScore === "yellow";

              const rowBg = isHovered
                ? "rgba(255,255,255,0.03)"
                : isRed
                ? "rgba(239,68,68,0.02)"
                : "transparent";

              const leftBorder = isRed && !isHovered
                ? "2px solid rgba(239,68,68,0.35)"
                : isYellow && !isHovered
                ? "2px solid rgba(245,158,11,0.25)"
                : "2px solid transparent";

              return (
                <tr key={bar.id}
                  onClick={() => router.push(`/admin/${bar.id}`)}
                  onMouseEnter={() => setHover(bar.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer", background: rowBg, borderLeft: leftBorder, transition: "background 100ms" }}
                >

                  {/* Bar */}
                  <td style={{ padding: "14px 16px 14px 18px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 6,
                        background: `hsl(${hashCode(bar.id) % 360}, 40%, 18%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                        color: `hsl(${hashCode(bar.id) % 360}, 60%, 70%)`,
                        flexShrink: 0,
                      }}>
                        {bar.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: "0 0 1px", letterSpacing: "-0.01em" }}>
                          {bar.nome}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                          {bar.cidade ? `${bar.cidade}${bar.estado ? `, ${bar.estado}` : ""}` : bar.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Saúde */}
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <HealthBadge score={bar.healthScore} alertas={bar.alertas} />
                  </td>

                  {/* Último uso */}
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{
                        fontSize: 13,
                        color: bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7 ? "#f59e0b"
                              : bar.dias_sem_uso !== null && bar.dias_sem_uso >= 3 ? "var(--fg-muted)"
                              : "var(--fg)",
                        fontFamily: "var(--font-mono)",
                      }}>
                        {relDate(bar.ultimo_turno_em)}
                      </span>
                      {bar.total_turnos > 0 && (
                        <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>
                          {bar.total_turnos} turno{bar.total_turnos !== 1 ? "s" : ""} total
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Atividade 7d */}
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                    <Activity7d turnos={bar.turnos_7d} comandas={bar.comandas_7d} faturamento={bar.faturamento_7d} />
                  </td>

                  {/* Plano */}
                  <td style={{ padding: "14px 20px 14px 16px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <StatusPill status={bar.assinatura_status} />
                      {bar.plano_nome && (
                        <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>{bar.plano_nome}</span>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}
