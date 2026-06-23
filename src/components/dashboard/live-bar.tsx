"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface LiveData {
  faturamento: number;
  pessoas: number;
  drinks: number;
}

interface LiveBarProps {
  turnoId: string;
  barId: string;
  faturamentoInicial: number;
  pessoasInicial: number;
  drinksInicial: number;
}

const overline: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--fg-subtle)",
};

const metricCard: React.CSSProperties = {
  background: "var(--bg-elevated)",

  borderRadius: "4px",
  padding: "20px 24px",
  minWidth: 0,
};

export function LiveBar({
  turnoId,
  barId,
  faturamentoInicial,
  pessoasInicial,
  drinksInicial,
}: LiveBarProps) {
  const [data, setData] = useState<LiveData>({
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
    const comandaIds = (comandas ?? []).map(c => c.id);

    if (comandaIds.length === 0) {
      setData(d => ({ ...d, pessoas: 0 }));
      return;
    }

    const { data: items } = await supabase
      .from("comanda_items")
      .select("quantidade, preco_total")
      .in("comanda_id", comandaIds)
      .eq("status", "ativo")
      .returns<{ quantidade: number; preco_total: number }[]>();

    const faturamento = (items ?? []).reduce((s, i) => s + Number(i.preco_total), 0);
    const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);

    setData({ faturamento, pessoas, drinks });
  }, [turnoId, barId]);

  useEffect(() => {
    const supabase = createClient();

    const comandasChannel = supabase
      .channel(`live-comandas-${turnoId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "comandas",
        filter: `turno_id=eq.${turnoId}`,
      }, () => { fetchLiveData(); })
      .subscribe();

    const itemsChannel = supabase
      .channel(`live-items-${turnoId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "comanda_items",
      }, () => { fetchLiveData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(comandasChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [turnoId, fetchLiveData]);

  const metrics = [
    { label: "Faturamento", value: currency.format(data.faturamento) },
    { label: "Comandas abertas", value: String(data.pessoas) },
    { label: "Drinks vendidos", value: String(data.drinks) },
  ];

  const liveDot = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span
        className="animate-live-pulse"
        style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "var(--ok)", display: "block", flexShrink: 0,
        }}
      />
      <span style={{
        fontSize: 9, fontWeight: 600, letterSpacing: "0.14em",
        color: "var(--ok)", textTransform: "uppercase" as const,
      }}>
        Ao vivo
      </span>
    </span>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "12px" }}>
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className="flex items-center justify-between lg:block"
          style={metricCard}
        >
          <div className="flex flex-col lg:block">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={overline}>{m.label}</p>
              {i === 0 && <span className="hidden lg:inline-flex">{liveDot}</span>}
            </div>
            <p
              className="text-[22px] lg:text-[26px]"
              style={{
                fontWeight: 600,
                color: "var(--fg)",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                marginTop: "4px",
              }}
            >
              {m.value}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4 lg:hidden">
            {i === 0 ? liveDot : null}
          </div>
        </div>
      ))}
    </div>
  );
}
