"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const currencyNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

interface LiveBarProps {
  turnoId: string;
  barId: string;
  faturamentoInicial: number;
  pessoasInicial: number;
  drinksInicial: number;
  comparacaoFaturamento?: number | null;
  comparacaoTicket?: number | null;
  comparacaoCmv?: number | null;
  margemEstimada?: number | null;
  cmvParcial?: boolean;
  metaProgresso?: number;
  metaFalta?: number;
  metaAtingida?: boolean;
  meta?: number;
  historicoFaturamento?: number[];
  historicoTicket?: number[];
}

// ── Mini sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({ values, invert = false }: { values: number[]; invert?: boolean }) {
  if (values.length < 2) return null;
  const W = 56, H = 20;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const xOf = (i: number) => (i / (values.length - 1)) * W;
  const yOf = (v: number) => H - 2 - ((v - min) / range) * (H - 5);
  const pts = values.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  const first = values[0];
  const trending = invert ? last <= first : last >= first;
  const color = trending ? "var(--ok)" : "var(--danger)";
  const lx = xOf(values.length - 1).toFixed(1);
  const ly = yOf(last).toFixed(1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block", flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx={lx} cy={ly} r="2" fill={color} opacity="0.85" />
    </svg>
  );
}

// ── Delta badge ─────────────────────────────────────────────────────────────

function Delta({
  pct,
  invert = false,
  label = "vs. ant.",
}: {
  pct: number | null | undefined;
  invert?: boolean;
  label?: string;
}) {
  if (pct == null) return null;
  const isGood = invert ? pct <= 0 : pct >= 0;
  const color = isGood ? "var(--ok)" : "var(--danger)";
  const up = pct >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        marginTop: 4,
        fontSize: 9,
        fontWeight: 700,
        color,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "1px 6px",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
        width: "fit-content",
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
      <span style={{ fontWeight: 400, color: "var(--fg-subtle)", marginLeft: 1 }}>{label}</span>
    </span>
  );
}

// ── LiveBar ─────────────────────────────────────────────────────────────────

export function LiveBar({
  turnoId,
  barId,
  faturamentoInicial,
  pessoasInicial,
  drinksInicial,
  comparacaoFaturamento,
  comparacaoTicket,
  comparacaoCmv,
  margemEstimada,
  cmvParcial,
  metaProgresso = 0,
  metaFalta = 0,
  metaAtingida = false,
  meta = 0,
  historicoFaturamento,
  historicoTicket,
}: LiveBarProps) {
  const [data, setData] = useState({
    faturamento: faturamentoInicial,
    pessoas: pessoasInicial,
    drinks: drinksInicial,
  });

  const fetchLiveData = useCallback(async () => {
    const supabase = createClient();
    const { data: comandas } = await supabase
      .from("comandas")
      .select("id")
      .eq("turno_id", turnoId)
      .eq("status", "aberta")
      .returns<{ id: string }[]>();
    const pessoas = (comandas ?? []).length;
    const ids = (comandas ?? []).map(c => c.id);
    if (!ids.length) { setData(d => ({ ...d, pessoas: 0 })); return; }
    const { data: items } = await supabase
      .from("comanda_items")
      .select("quantidade, preco_total")
      .in("comanda_id", ids)
      .eq("status", "ativo")
      .returns<{ quantidade: number; preco_total: number }[]>();
    const faturamento = (items ?? []).reduce((s, i) => s + Number(i.preco_total), 0);
    const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);
    setData({ faturamento, pessoas, drinks });
  }, [turnoId, barId]);

  useEffect(() => {
    const supabase = createClient();
    const ch1 = supabase
      .channel(`live-cmd-${turnoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comandas", filter: `turno_id=eq.${turnoId}` }, () => fetchLiveData())
      .subscribe();
    const ch2 = supabase
      .channel(`live-itm-${turnoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comanda_items" }, () => fetchLiveData())
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [turnoId, fetchLiveData]);

  const ticketMedio = data.pessoas > 0 ? data.faturamento / data.pessoas : 0;
  const cmvPct = margemEstimada ?? null;
  const margemPct = cmvPct !== null ? 100 - cmvPct : null;

  const margemColor =
    cmvPct == null ? "var(--fg)"
    : cmvPct < 36 ? "var(--ok)"
    : cmvPct < 42 ? "var(--warn)"
    : "var(--danger)";

  const cmvStatus =
    cmvPct == null
      ? (cmvParcial ? "estimativa" : "sem dados")
      : cmvParcial ? "estimativa"
      : cmvPct < 30 ? "excelente"
      : cmvPct < 36 ? "saudável"
      : cmvPct < 42 ? "atenção"
      : "crítico";

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-2xl)",
    padding: "18px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    color: "var(--fg-subtle)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 2,
    display: "block",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 36,
    fontWeight: 600,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.03em",
    color: "var(--fg)",
    display: "block",
    marginTop: 6,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, flexShrink: 0 }}>

      {/* ── Faturado no Turno (HERÓI) ── */}
      <div style={{
        ...cardStyle,
        background: "var(--bg-hero)",
        border: "1px solid var(--border-accent)",
        position: "relative",
        overflow: "hidden",
        padding: "18px 22px",
      }} title="Soma de tudo que foi vendido desde a abertura do turno.">

        {/* Glow orb */}
        <div style={{
          position: "absolute",
          top: -60, left: -40,
          width: 220, height: 220,
          borderRadius: "50%",
          background: "var(--glow-hero)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
          <span style={labelStyle}>Faturado no Turno</span>
          {historicoFaturamento && historicoFaturamento.length >= 2 && (
            <MiniSparkline values={historicoFaturamento} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, lineHeight: 1, marginTop: 6, position: "relative" }}>
          <span style={{ fontSize: 20, fontWeight: 300, color: "var(--fg)", opacity: 0.35, paddingBottom: 10, letterSpacing: 0 }}>R$</span>
          <span style={{ fontSize: 72, fontWeight: 200, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums", color: "var(--fg)", lineHeight: 0.9 }}>
            {currencyNum.format(Math.round(data.faturamento))}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, position: "relative" }}>
          <Delta pct={comparacaoFaturamento} />
          {data.pessoas > 0 && (
            <span style={{ fontSize: 10, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" }}>
              {data.pessoas} {data.pessoas === 1 ? "mesa aberta" : "mesas abertas"}
            </span>
          )}
        </div>

        {meta > 0 && (
          <div style={{ marginTop: 10, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: "var(--fg-subtle)" }}>Meta {currency.format(meta)}</span>
              <span style={{ fontSize: 9, color: metaAtingida ? "var(--ok)" : "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" }}>
                {metaProgresso}%
              </span>
            </div>
            <div style={{ height: 2, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: 2,
                background: metaAtingida ? "var(--ok)" : "var(--accent)",
                borderRadius: 2,
                width: "100%",
                transformOrigin: "left",
                transform: `scaleX(${Math.min(metaProgresso / 100, 1)})`,
                transition: "transform 0.6s",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Margem do Turno ── */}
      <div style={cardStyle} title="O que sobra depois de pagar o custo dos produtos. 100% menos o CMV.">
        <span style={labelStyle}>Margem do Turno</span>
        <span style={valueStyle}>
          {margemPct !== null ? `${margemPct.toFixed(0)}%` : "—"}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginTop: 4,
            fontSize: 9,
            fontWeight: 700,
            color: margemColor,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 6px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            width: "fit-content",
          }}
        >
          {cmvStatus}
        </span>
      </div>

      {/* ── Custo dos Produtos (CMV) ── */}
      <div style={cardStyle} title="Custo do produto ÷ receita total. Abaixo de 36% é saudável. Acima de 42% está sangrando.">
        <span style={labelStyle}>
          Custo (CMV)
          {cmvPct !== null && cmvPct >= 42 && (
            <span style={{ color: "var(--danger)", marginLeft: 5, fontSize: 9 }}>▲</span>
          )}
        </span>
        <span style={valueStyle}>
          {cmvPct !== null ? `${cmvPct.toFixed(0)}%` : "—"}
        </span>
        <Delta pct={comparacaoCmv} invert />
      </div>

      {/* ── Gasto por Mesa ── */}
      <div style={cardStyle} title="Faturamento total do turno dividido pelo número de comandas abertas">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={labelStyle}>Ticket Médio</span>
          {historicoTicket && historicoTicket.length >= 2 && (
            <MiniSparkline values={historicoTicket} />
          )}
        </div>
        <span style={valueStyle}>
          {data.pessoas > 0 ? currency.format(ticketMedio) : "—"}
        </span>
        {data.pessoas > 0
          ? <Delta pct={comparacaoTicket} />
          : <span style={{ fontSize: 10, color: "var(--fg-subtle)", marginTop: 4, display: "block" }}>sem mesas abertas</span>}
      </div>

    </div>
  );
}
