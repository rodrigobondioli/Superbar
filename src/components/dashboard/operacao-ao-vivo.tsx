"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { AiHeroInput } from "@/components/dashboard/ai-hero-input";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** true quando a viewport é menor que o breakpoint `lg` (mesmo corte do shell do dashboard). */
function useIsMobile(bp = 1024) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return mobile;
}

export type Periodo = "hoje" | "ontem" | "7dias";

export interface PeriodView {
  labelFat: string;
  faturado: number;
  deltaFat: number;
  metaProgresso: number;
  margem: number;
  veredito: { txt: string; cor: string };
  cmv: number;
  deltaCmv: number;
  ticket: number;
  deltaTicket: number;
  drinksHora: number;
  petiscosHora: number;
  maiorComanda: number;
  impacto: number | null;
  topDrinks: { nome: string; total: number; qtd: number }[];
}

interface Props {
  views: Record<Periodo, PeriodView>;
  meta: number;
  comandasAbertas: number;
  superNome: string | null;
  superMargem: number | null;
  barId: string;
  alertCount: number;
  turnoId: string;
}

const OPCOES: { id: Periodo; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7dias", label: "7 dias" },
];

// ── Helpers visuais ──
function Tri({ up, color }: { up: boolean; color: string }) {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" style={{ flexShrink: 0 }} aria-hidden>
      <path d={up ? "M5.5 0 L11 9 L0 9 Z" : "M5.5 9 L11 0 L0 0 Z"} fill={color} />
    </svg>
  );
}
function Cifrao() {
  return <span style={{ fontSize: "0.42em", fontWeight: 600, color: "var(--fg-muted)", marginRight: "0.16em", letterSpacing: 0, verticalAlign: "baseline" }}>R$</span>;
}
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
const kpiCard: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, display: "flex", flexDirection: "column", justifyContent: "space-between" };
const kpiLabel: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 500, color: "var(--fg-muted)" };
const kpiMetric: React.CSSProperties = { display: "block", fontSize: 64, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1, marginTop: 15 };
const kpiDivider: React.CSSProperties = { height: 1, background: "var(--border-strong)", marginBottom: 11 };

export function OperacaoAoVivo({ views, meta, comandasAbertas, superNome, superMargem, barId, alertCount, turnoId }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [hover, setHover] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const v = views[periodo];
  const showSuper = superNome !== null && superMargem !== null;
  const kpiCardR: React.CSSProperties = isMobile ? { ...kpiCard, padding: 20 } : kpiCard;
  const kpiMetricR: React.CSSProperties = isMobile ? { ...kpiMetric, fontSize: 36, marginTop: 10 } : kpiMetric;

  return (
    <div
      style={
        isMobile
          ? { display: "flex", flexDirection: "column", padding: "12px 0 24px", gap: 12, boxSizing: "border-box" }
          : { height: "100%", display: "flex", flexDirection: "column", padding: "14px 32px 16px", gap: 12, overflow: "hidden", boxSizing: "border-box" }
      }
    >

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: isMobile ? 12 : 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>Operação ao vivo</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: isMobile ? "100%" : "auto" }}>
          {OPCOES.map((o) => {
            const active = periodo === o.id;
            const isHover = hover === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setPeriodo(o.id)}
                onMouseEnter={() => setHover(o.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  padding: "8px 16px", borderRadius: 999, fontSize: 13,
                  fontWeight: active ? 500 : 400, cursor: "pointer",
                  whiteSpace: "nowrap", flex: isMobile ? 1 : "0 0 auto",
                  transition: "background 120ms, border-color 120ms, color 120ms",
                  background: active ? "var(--accent)" : isHover ? "rgba(255,255,255,0.06)" : "transparent",
                  border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                  color: active ? "var(--accent-fg)" : isHover ? "var(--fg)" : "var(--fg-muted)",
                }}
              >
                {o.label}
              </button>
            );
          })}
          {!isMobile && (
            <Link
              href="/dashboard/relatorios"
              onMouseEnter={() => setHover("rel")}
              onMouseLeave={() => setHover(null)}
              style={{ padding: "8px 16px", fontSize: 13, textDecoration: "none", whiteSpace: "nowrap", color: hover === "rel" ? "var(--fg)" : "var(--fg-muted)", transition: "color 120ms" }}
            >
              Ver relatório completo
            </Link>
          )}
        </div>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1.6fr 1fr 1fr 1fr", gap: isMobile ? 10 : 16, flexShrink: 0 }}>

        {/* Faturado */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: isMobile ? 20 : 32, display: "flex", flexDirection: "column", gridColumn: isMobile ? "1 / -1" : undefined }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)" }}>{v.labelFat}</span>
          <span style={{ fontSize: isMobile ? 44 : 64, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1, marginTop: 15 }}><Cifrao />{v.faturado.toLocaleString("pt-BR")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, fontSize: 15 }}>
            <Tri up={v.deltaFat >= 0} color={v.deltaFat >= 0 ? "var(--accent)" : "var(--danger)"} />
            <span style={{ color: "var(--fg)" }}>
              {Math.abs(v.deltaFat).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% {v.deltaFat >= 0 ? "maior" : "menor"} vs. sem. passada
            </span>
          </div>
          <div style={{ height: 2, borderRadius: 999, background: "var(--border-strong)", overflow: "hidden", marginTop: 25 }}>
            <div style={{ height: 2, borderRadius: 999, background: "var(--accent)", width: `${v.metaProgresso}%`, transition: "width 260ms ease" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 11 }}>
            <span style={{ fontSize: 15, fontWeight: 400, color: "var(--fg-muted)" }}>Meta Mensal - R$ {Math.round(meta).toLocaleString("pt-BR")}</span>
            <span style={{ fontSize: 15, fontWeight: 400, color: "var(--accent)" }}>{v.metaProgresso}%</span>
          </div>
        </div>

        {/* Margem */}
        <div style={kpiCardR}>
          <div>
            <span style={kpiLabel}>Margem</span>
            <span style={kpiMetricR}>{v.margem}%</span>
          </div>
          <div>
            <div style={kpiDivider} />
            <span style={{ fontSize: 15, fontWeight: 400, color: v.veredito.cor }}>{v.veredito.txt}</span>
          </div>
        </div>

        {/* Custo (CMV) */}
        <div style={kpiCardR}>
          <div>
            <span style={kpiLabel}>Custo (CMV)</span>
            <span style={kpiMetricR}>{v.cmv}%</span>
          </div>
          <div>
            <div style={kpiDivider} />
            <DeltaRow value={v.deltaCmv} invert />
          </div>
        </div>

        {/* Ticket Médio */}
        <div style={isMobile ? { ...kpiCardR, gridColumn: "1 / -1" } : kpiCardR}>
          <div>
            <span style={kpiLabel}>Ticket Médio</span>
            <span style={kpiMetricR}><Cifrao />{v.ticket.toLocaleString("pt-BR")}</span>
          </div>
          <div>
            <div style={kpiDivider} />
            <DeltaRow value={v.deltaTicket} />
          </div>
        </div>
      </div>

      {/* ROW 2: STAT PILLS */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 12, flexShrink: 0 }}>
        {[
          { label: "Drinks por hora", value: String(v.drinksHora) },
          { label: "Petiscos por hora", value: String(v.petiscosHora) },
          { label: "Mesas abertas agora", value: String(comandasAbertas) },
          { label: "Maior valor de comanda", value: `R$ ${v.maiorComanda.toLocaleString("pt-BR")}` },
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

      {/* ROW 3: AI + SUPER AÇÃO (esq) · TOP DRINKS (dir) */}
      <div style={isMobile
        ? { display: "flex", flexDirection: "column", gap: 12 }
        : { flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1.32fr 1fr", gap: 16, alignItems: "stretch" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          <AiHeroInput fill={!isMobile} barId={barId} alertCount={alertCount} />

          {showSuper && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: isMobile ? 20 : 24, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "stretch", gap: isMobile ? 18 : 32, flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 24, flex: "0 0 auto", minWidth: isMobile ? 0 : 150 }}>
                <span style={superLabel}>Super ação</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em", lineHeight: 1, margin: 0 }}>{superNome}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
                    <Tri up color="var(--ok)" />
                    <span style={{ color: "var(--fg-muted)" }}>{Math.round(superMargem!)}% de margem</span>
                  </div>
                </div>
              </div>

              <div style={{ width: isMobile ? "100%" : 1, height: isMobile ? 1 : "auto", background: "var(--border-strong)", alignSelf: "stretch", flexShrink: 0 }} />

              <div style={{ flex: 1, display: "flex", alignItems: "center", minWidth: 0 }}>
                <p style={{ fontSize: 15, color: "var(--fg-muted)", lineHeight: 1.5, margin: 0 }}>Apareceu pouco hoje. Sugerir nas próximas 2 horas pode mais que dobrar as vendas.</p>
              </div>

              <div style={{ width: isMobile ? "100%" : 1, height: isMobile ? 1 : "auto", background: "var(--border-strong)", alignSelf: "stretch", flexShrink: 0 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: "0 0 auto", minWidth: isMobile ? 0 : 167 }}>
                <span style={superLabel}>Impacto direto</span>
                {v.impacto !== null && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}><Cifrao />{v.impacto.toLocaleString("pt-BR")}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>Risco: <span style={{ color: "var(--ok)" }}>Baixo</span></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Top drinks */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: isMobile ? "20px 20px 24px" : "24px 32px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0, overflow: isMobile ? "visible" : "hidden" }}>
          <div>
            <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", marginBottom: isMobile ? 20 : 32 }}>Top drinks do turno</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {v.topDrinks.map((p, i) => {
                const max = v.topDrinks[0]?.total || 1;
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
                      <div style={{ height: 2, borderRadius: 999, background: "linear-gradient(90deg, var(--warn) 0%, var(--accent) 100%)", width: `${pct}%`, transition: "width 320ms cubic-bezier(0.22,1,0.36,1)" }} />
                    </div>
                  </div>
                );
              })}
              {v.topDrinks.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--fg-subtle)", padding: "12px 0" }}>Sem vendas registradas ainda.</p>
              )}
            </div>
          </div>
          <Link href={`/dashboard/turnos/${turnoId}`} style={{ marginTop: 32, alignSelf: "flex-start", padding: "8px 16px", borderRadius: 999, background: "var(--accent)", color: "var(--accent-fg)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Comparar com turno anterior</Link>
        </div>
      </div>

    </div>
  );
}
