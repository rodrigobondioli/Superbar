"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BarResumo, RiskAlert, HealthScore } from "@/lib/admin/queries";
import type { AssinaturaStatus } from "@/types/database";

// ─── Constantes ───────────────────────────────────────────────────────────────

// Note: trial usa #3b82f6 (azul) — sem token CSS equivalente no design system.
// Os demais mapeiam para CSS vars.
const STATUS_CONFIG: Record<AssinaturaStatus, { color: string; bg: string; border: string }> = {
  trial:        { color: "#3b82f6",          bg: "color-mix(in srgb, #3b82f6 10%, transparent)",             border: "color-mix(in srgb, #3b82f6 20%, transparent)" },
  ativa:        { color: "var(--ok)",         bg: "var(--ok-bg)",                                            border: "color-mix(in srgb, var(--ok) 20%, transparent)" },
  cancelada:    { color: "var(--fg-subtle)",  bg: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)",   border: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)" },
  inadimplente: { color: "var(--danger)",     bg: "var(--danger-bg)",                                        border: "color-mix(in srgb, var(--danger) 20%, transparent)" },
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
    green:  { emoji: "🟢", label: "Saudável",  color: "var(--ok)",     bg: "var(--ok-bg)",     border: "color-mix(in srgb, var(--ok) 20%, transparent)"     },
    yellow: { emoji: "🟡", label: "Atenção",   color: "var(--warn)",   bg: "var(--warn-bg)",   border: "color-mix(in srgb, var(--warn) 20%, transparent)"   },
    red:    { emoji: "🔴", label: "Risco",     color: "var(--danger)", bg: "var(--danger-bg)", border: "color-mix(in srgb, var(--danger) 20%, transparent)" },
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
          fontSize: 10,
          color: topAlert.level === "red" ? "var(--danger)" : "var(--warn)",
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
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      fontSize: 11, fontWeight: 600, color: cfg.color,
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0,
        ...(status === "ativa" ? { boxShadow: `0 0 6px ${cfg.color}` } : {}),
      }} />
      {STATUS_LABEL[status]}
    </span>
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
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>

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
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, paddingLeft: 20 }}>Bar</th>
              <th style={thStyle}>Saúde</th>
              <th style={thStyle}>Último uso</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Faturamento mês</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Ticket médio</th>
              <th style={{ ...thStyle, textAlign: "right" }}>CMV · Margem</th>
              <th style={{ ...thStyle, textAlign: "right", paddingRight: 20 }}>Plano</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bar) => {
              const isHovered = hover === bar.id;
              const isRed     = bar.healthScore === "red";
              const isYellow  = bar.healthScore === "yellow";

              const rowBg = isHovered
                ? "color-mix(in srgb, var(--fg) 4%, transparent)"
                : isRed
                ? "color-mix(in srgb, var(--danger) 3%, transparent)"
                : "transparent";

              const leftBorder = isRed && !isHovered
                ? "2px solid color-mix(in srgb, var(--danger) 35%, transparent)"
                : isYellow && !isHovered
                ? "2px solid color-mix(in srgb, var(--warn) 25%, transparent)"
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
                        color: bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7 ? "var(--warn)"
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

                  {/* Faturamento mês */}
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                    {bar.faturamento_mes_atual > 0 || bar.faturamento_mes_anterior > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", color: "var(--fg)" }}>
                          {currency.format(bar.faturamento_mes_atual)}
                        </span>
                        {bar.crescimento_fat_mes_pct !== null ? (
                          <span style={{ fontSize: 10, color: bar.crescimento_fat_mes_pct >= 0 ? "var(--ok)" : "var(--danger)" }}>
                            {bar.crescimento_fat_mes_pct >= 0 ? "↑" : "↓"} {Math.abs(bar.crescimento_fat_mes_pct)}%
                          </span>
                        ) : bar.faturamento_mes_anterior > 0 ? (
                          <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>
                            {currency.format(bar.faturamento_mes_anterior)} mês ant.
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>sem movimento</span>
                    )}
                  </td>

                  {/* Ticket médio */}
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                    {bar.ticket_medio_30d !== null ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", color: "var(--fg)" }}>
                          {currency.format(bar.ticket_medio_30d)}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>30 dias</span>
                        {bar.ticket_medio_total !== null && bar.ticket_medio_total !== bar.ticket_medio_30d && (
                          <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>
                            {currency.format(bar.ticket_medio_total)} total
                          </span>
                        )}
                      </div>
                    ) : bar.ticket_medio_total !== null ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
                          {currency.format(bar.ticket_medio_total)}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>histórico</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>—</span>
                    )}
                  </td>

                  {/* CMV + Margem */}
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                    {bar.cmv_pct !== null ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em",
                          color: bar.cmv_pct <= 30 ? "var(--ok)" : bar.cmv_pct <= 38 ? "var(--warn)" : "var(--danger)",
                        }}>
                          CMV {bar.cmv_pct.toFixed(1)}%
                        </span>
                        {bar.margem_pct !== null && (
                          <span style={{
                            fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)",
                            color: bar.margem_confiavel
                              ? (bar.margem_pct >= 65 ? "var(--ok)" : bar.margem_pct >= 55 ? "var(--warn)" : "var(--danger)")
                              : "var(--fg-subtle)",
                            display: "flex", alignItems: "center", gap: 3,
                          }}>
                            {!bar.margem_confiavel && <span title="Cobertura de custo abaixo de 60% — dado estimado" style={{ opacity: 0.7 }}>⚠</span>}
                            Margem {bar.margem_pct.toFixed(1)}%
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>
                          {bar.cmv_cobertura_receita_pct}% cob.
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>sem custo</span>
                    )}
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
