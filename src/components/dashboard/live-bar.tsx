"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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
  const W = 72, H = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const xOf = (i: number) => (i / (values.length - 1)) * W;
  const yOf = (v: number) => H - 2 - ((v - min) / range) * (H - 6);
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
      <circle cx={lx} cy={ly} r="2.5" fill={color} opacity="0.8" />
    </svg>
  );
}

// ── Delta badge ─────────────────────────────────────────────────────────────

function Delta({
  pct,
  invert = false,
  label = "vs. turno ant.",
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
        gap: 4,
        marginTop: 6,
        fontSize: 10,
        fontWeight: 700,
        color,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "2px 8px",
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
    borderRadius: "var(--radius-xl)",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--fg-subtle)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 4,
    display: "block",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.02em",
    color: "var(--fg)",
    display: "block",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>

      {/* ── Gasto por Mesa ── */}
      <div style={cardStyle} title="Faturamento total do turno dividido pelo número de comandas abertas">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={labelStyle}>Gasto por Mesa</span>
          {historicoTicket && historicoTicket.length >= 2 && (
            <MiniSparkline values={historicoTicket} />
          )}
        </div>
        <span style={valueStyle}>
          {data.pessoas > 0 ? currency.format(ticketMedio) : "—"}
        </span>
        {data.pessoas > 0
          ? <Delta pct={comparacaoTicket} />
          : <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>nenhuma mesa aberta</span>}
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
            marginTop: 6,
            fontSize: 10,
            fontWeight: 700,
            color: margemColor,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "2px 8px",
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
          Custo dos Produtos
          {cmvPct !== null && cmvPct >= 42 && (
            <span style={{ color: "var(--danger)", marginLeft: 6, fontSize: 10 }}>▲ acima do limite</span>
          )}
        </span>
        <span style={valueStyle}>
          {cmvPct !== null ? `${cmvPct.toFixed(0)}%` : "—"}
        </span>
        <Delta pct={comparacaoCmv} invert />
      </div>

      {/* ── Faturado no Turno + Meta ── */}
      <div style={cardStyle} title="Soma de tudo que foi vendido desde a abertura do turno.">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={labelStyle}>Faturado no Turno</span>
          {historicoFaturamento && historicoFaturamento.length >= 2 && (
            <MiniSparkline values={historicoFaturamento} />
          )}
        </div>
        <span style={valueStyle}>
          {currency.format(data.faturamento)}
        </span>
        <Delta pct={comparacaoFaturamento} />
        {meta > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>Meta {currency.format(meta)}</span>
              <span
                style={{
                  fontSize: 10,
                  color: metaAtingida ? "var(--ok)" : "var(--fg-subtle)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {metaProgresso}%
              </span>
            </div>
            <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: 3,
                  background: metaAtingida ? "var(--ok)" : "var(--accent)",
                  borderRadius: 2,
                  width: `${Math.min(metaProgresso, 100)}%`,
                  transition: "width 0.6s",
                }}
              />
            </div>
            {metaAtingida && (
              <span style={{ fontSize: 10, color: "var(--ok)", marginTop: 4, display: "block" }}>meta batida ✓</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
