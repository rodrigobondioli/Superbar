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
  margemEstimada?: number | null; // = CMV% (naming legado)
  cmvParcial?: boolean;
  dataFormatada?: string;
  metaProgresso?: number;
  metaFalta?: number;
  metaAtingida?: boolean;
  meta?: number;
}

// Delta normal: up = bom (verde), down = ruim (vermelho)
function Delta({ pct, invert = false }: { pct: number | null | undefined; invert?: boolean }) {
  if (pct == null) return <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>—</span>;
  const isGood = invert ? pct <= 0 : pct >= 0;
  const color = isGood ? "var(--ok)" : "var(--danger)";
  const up = pct >= 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
      <svg width="6" height="6" viewBox="0 0 6 6" style={{ flexShrink: 0 }}>
        {up
          ? <path d="M3 0.5L5.8 5.5H0.2L3 0.5Z" fill={color} />
          : <path d="M3 5.5L0.2 0.5H5.8L3 5.5Z" fill={color} />}
      </svg>
      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color }}>{Math.abs(pct).toFixed(1)}%</span>
      <span style={{ fontWeight: 400, color: "var(--fg-subtle)" }}>vs ontem</span>
    </span>
  );
}

export function LiveBar({
  turnoId,
  barId,
  faturamentoInicial,
  pessoasInicial,
  drinksInicial,
  comparacaoFaturamento,
  comparacaoTicket,
  comparacaoCmv,
  margemEstimada, // = CMV%
  cmvParcial,
  dataFormatada,
  metaProgresso = 0,
  metaFalta = 0,
  metaAtingida = false,
  meta = 0,
}: LiveBarProps) {
  const [data, setData] = useState({ faturamento: faturamentoInicial, pessoas: pessoasInicial, drinks: drinksInicial });

  const fetchLiveData = useCallback(async () => {
    const supabase = createClient();
    const { data: comandas } = await supabase.from("comandas").select("id").eq("turno_id", turnoId).eq("status", "aberta").returns<{ id: string }[]>();
    const pessoas = (comandas ?? []).length;
    const ids = (comandas ?? []).map(c => c.id);
    if (!ids.length) { setData(d => ({ ...d, pessoas: 0 })); return; }
    const { data: items } = await supabase.from("comanda_items").select("quantidade, preco_total").in("comanda_id", ids).eq("status", "ativo").returns<{ quantidade: number; preco_total: number }[]>();
    const faturamento = (items ?? []).reduce((s, i) => s + Number(i.preco_total), 0);
    const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);
    setData({ faturamento, pessoas, drinks });
  }, [turnoId, barId]);

  useEffect(() => {
    const supabase = createClient();
    const ch1 = supabase.channel(`live-cmd-${turnoId}`).on("postgres_changes", { event: "*", schema: "public", table: "comandas", filter: `turno_id=eq.${turnoId}` }, () => fetchLiveData()).subscribe();
    const ch2 = supabase.channel(`live-itm-${turnoId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "comanda_items" }, () => fetchLiveData()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [turnoId, fetchLiveData]);

  const ticketMedio = data.pessoas > 0 ? data.faturamento / data.pessoas : 0;

  // margemEstimada = CMV%; margem = 100 - CMV
  const cmvPct    = margemEstimada ?? null;
  const margemPct = cmvPct !== null ? 100 - cmvPct : null;

  const cmvColor = cmvPct == null ? "var(--fg)"
    : cmvPct < 36 ? "var(--ok)"
    : cmvPct < 42 ? "var(--warn)"
    : "var(--danger)";
  const margemColor = cmvPct == null ? "var(--fg)"
    : cmvPct < 36 ? "var(--ok)"
    : cmvPct < 42 ? "var(--warn)"
    : "var(--danger)";

  const cmvStatus = cmvPct == null ? (cmvParcial ? "configurar custos" : "sem dados")
    : cmvParcial ? "estimativa parcial"
    : cmvPct < 30 ? "excelente"
    : cmvPct < 36 ? "saudável"
    : cmvPct < 42 ? "atenção"
    : "crítico";

  const overlineStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.12em", color: "var(--fg-subtle)", margin: "0 0 10px", display: "block",
  };
  const valueStyle: React.CSSProperties = {
    fontSize: 40, fontWeight: 800, lineHeight: 1,
    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em",
    margin: "0 0 8px",
  };

  return (
    <div style={{ padding: "28px 32px 0", borderBottom: "1px solid var(--border)" }}>
      <div>

        {/* ── Status row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 20 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span
              className="animate-live-pulse"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ok)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Ao Vivo</span>
          </span>
          <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>·</span>
          <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>Turno aberto</span>
          {dataFormatada && <>
            <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{dataFormatada}</span>
          </>}
        </div>

        {/* ── 3 Hero Metrics ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0 0 24px" }}>

          {/* Ticket Médio */}
          <div style={{ paddingRight: 32, borderRight: "1px solid var(--border)" }}>
            <span style={overlineStyle}>Ticket Médio</span>
            <p style={{ ...valueStyle, color: "var(--fg)" }}>
              {data.pessoas > 0 ? currency.format(ticketMedio) : "—"}
            </p>
            {data.pessoas > 0
              ? <Delta pct={comparacaoTicket} />
              : <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>sem comandas</span>}
          </div>

          {/* Margem */}
          <div style={{ paddingLeft: 32, paddingRight: 32, borderRight: "1px solid var(--border)" }}>
            <span style={overlineStyle}>Margem</span>
            <p style={{ ...valueStyle, color: margemColor }}>
              {margemPct !== null ? `${margemPct.toFixed(0)}%` : "—"}
            </p>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{cmvStatus}</span>
          </div>

          {/* CMV */}
          <div style={{ paddingLeft: 32 }}>
            <span style={overlineStyle}>CMV</span>
            <p style={{ ...valueStyle, color: cmvColor }}>
              {cmvPct !== null ? `${cmvPct.toFixed(0)}%` : "—"}
            </p>
            <Delta pct={comparacaoCmv} invert />
          </div>

        </div>

        {/* ── Footer: Faturamento · Comandas · Meta ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          borderTop: "1px solid var(--border)",
          padding: "12px 0 20px",
          background: "transparent",
        }}>

          {/* Faturamento */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 20 }}>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Fat.</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--fg)" }}>
              {currency.format(data.faturamento)}
            </span>
            <Delta pct={comparacaoFaturamento} />
          </div>

          <span style={{ width: 1, height: 20, background: "var(--border)", marginRight: 20, flexShrink: 0 }} />

          {/* Comandas */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 20 }}>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Comandas</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--fg)" }}>{data.pessoas}</span>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>abertas agora</span>
          </div>

          {meta > 0 && <>
            <span style={{ width: 1, height: 20, background: "var(--border)", marginRight: 20, flexShrink: 0 }} />

            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <span style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Meta</span>
              <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--fg)" }}>{metaProgresso}%</span>
              <div style={{ flex: 1, maxWidth: 100, height: 3, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: 3, background: "var(--accent)", borderRadius: 2, width: `${metaProgresso}%`, transition: "width 0.6s" }} />
              </div>
              <span style={{ fontSize: 11, color: metaAtingida ? "var(--ok)" : "var(--fg-subtle)" }}>
                {metaAtingida ? "meta atingida ✓" : `falta ${currency.format(metaFalta)}`}
              </span>
            </div>
          </>}

        </div>

      </div>
    </div>
  );
}
