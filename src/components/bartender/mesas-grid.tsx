"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Comanda, Mesa } from "@/types/database";
import { abrirComanda } from "@/lib/bartender/actions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function tempoAberta(abertaEm: string) {
  const diff = Math.floor((Date.now() - new Date(abertaEm).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export interface MesaComStatus {
  mesa: Mesa;
  comanda: Comanda | null;
}

// ─── Card individual ──────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: 190,
  borderRadius: 8,
  overflow: "hidden",
  position: "relative",
  transition: "opacity 0.15s",
};

function MesaCard({
  label,
  comanda,
  capacidade,
  href,
  onAbrir,
}: {
  label: string;
  comanda: Comanda | null;
  capacidade?: number | null;
  href?: string;
  onAbrir?: () => void;
}) {
  const querPagar = comanda?.status === "aguardando_pagamento";
  const ocupada = comanda !== null;

  // ── Livre ──
  if (!ocupada) {
    const inner = (
      <div style={{
        ...CARD_STYLE,
        background: "color-mix(in srgb, var(--fg) 3%, transparent)",
        border: "1px solid var(--border)",
        padding: "18px 18px 16px",
        justifyContent: "space-between",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-muted)", letterSpacing: "-0.2px" }}>
            {label}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
            background: "color-mix(in srgb, var(--fg) 6%, transparent)",
            color: "var(--fg-subtle)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Livre
          </span>
        </div>

        <div>
          <p style={{
            fontSize: 13, fontWeight: 600,
            color: "var(--fg-subtle)",
            margin: "0 0 6px",
          }}>
            + Abrir comanda
          </p>
          {capacidade && (
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0, opacity: 0.6 }}>
              {capacidade} lugares
            </p>
          )}
        </div>
      </div>
    );

    if (onAbrir) {
      return (
        <form action={onAbrir} style={{ display: "contents" }}>
          <button type="submit" style={{ all: "unset", display: "block" }}>
            {inner}
          </button>
        </form>
      );
    }
    return inner;
  }

  // ── Ocupada — semantic colors allowed in Bartender ──
  const bgColor     = querPagar
    ? "color-mix(in srgb, var(--danger) 12%, transparent)"
    : "color-mix(in srgb, var(--accent) 22%, transparent)";
  const borderColor = querPagar
    ? "color-mix(in srgb, var(--danger) 35%, transparent)"
    : "color-mix(in srgb, var(--accent-bright) 35%, transparent)";
  const topBarColor = querPagar ? "var(--danger)" : "var(--accent-bright)";
  const totalColor  = querPagar ? "var(--danger)" : "var(--fg)";

  return (
    <Link
      href={href!}
      style={{
        ...CARD_STYLE,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        textDecoration: "none",
        padding: "0",
      }}
    >
      {/* Barra de cor no topo — solid */}
      <div style={{ height: 3, background: topBarColor, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: "14px 16px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Topo: nome + badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
            {label}
          </span>
          {querPagar ? (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4,
              background: "color-mix(in srgb, var(--danger) 18%, transparent)",
              color: "var(--danger)",
              border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              flexShrink: 0, whiteSpace: "nowrap",
            }}>
              Quer pagar
            </span>
          ) : (
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--ok)",
              flexShrink: 0, marginTop: 4,
            }} />
          )}
        </div>

        {/* Total — destaque */}
        <div>
          <p style={{
            fontSize: 22, fontWeight: 900,
            color: totalColor,
            margin: 0,
            letterSpacing: "-0.5px",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--font-mono)",
          }}>
            {currency.format(comanda.total)}
          </p>
        </div>

        {/* Rodapé: tempo + capacidade */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: querPagar ? "var(--danger)" : "var(--fg-subtle)",
            background: querPagar
              ? "color-mix(in srgb, var(--danger) 10%, transparent)"
              : "color-mix(in srgb, var(--fg) 6%, transparent)",
            borderRadius: 4, padding: "2px 7px",
            opacity: querPagar ? 1 : 0.8,
          }}>
            {tempoAberta(comanda.aberta_em)}
          </span>
          {capacidade && (
            <span style={{ fontSize: 10, color: "var(--fg-subtle)", opacity: 0.6 }}>
              {capacidade} lug.
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Grid principal ───────────────────────────────────────────────────────────

interface MesasGridProps {
  barId: string;
  initialMesas: MesaComStatus[];
  initialBalcao: Comanda | null;
}

export function MesasGrid({ barId, initialMesas, initialBalcao }: MesasGridProps) {
  const [mesas, setMesas] = useState<MesaComStatus[]>(initialMesas);
  const [balcao, setBalcao] = useState<Comanda | null>(initialBalcao);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bartender_comandas_${barId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "comandas",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const atualizada = payload.new as Comanda;
        if (!atualizada.mesa_id) {
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") {
            setBalcao(atualizada);
          } else {
            setBalcao(prev => prev?.id === atualizada.id ? null : prev);
          }
          return;
        }
        setMesas(prev => prev.map(m => {
          if (m.comanda?.id !== atualizada.id) return m;
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") {
            return { ...m, comanda: atualizada };
          }
          return { ...m, comanda: null };
        }));
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "comandas",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const nova = payload.new as Comanda;
        if (!nova.mesa_id) { setBalcao(nova); return; }
        setMesas(prev => prev.map(m =>
          m.mesa.id === nova.mesa_id ? { ...m, comanda: nova } : m
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [barId]);

  // ── Agrupar por urgência ──────────────────────────────────────────────────────
  type MesaEntry = { key: string; label: string; comanda: Comanda | null; capacidade?: number | null; href?: string; onAbrir?: () => void };

  const todasEntradas: MesaEntry[] = [
    ...mesas.map(({ mesa, comanda }) => ({
      key: mesa.id,
      label: mesa.nome ?? `Mesa ${mesa.numero}`,
      comanda,
      capacidade: mesa.capacidade,
      href: comanda ? `/bartender/${comanda.id}` : undefined,
      onAbrir: comanda ? undefined : (abrirComanda.bind(null, mesa.id) as () => void),
    })),
    {
      key: "balcao",
      label: "Balcão",
      comanda: balcao,
      href: balcao ? `/bartender/${balcao.id}` : undefined,
      onAbrir: balcao ? undefined : (abrirComanda.bind(null, null) as () => void),
    },
  ];

  const querPagar = todasEntradas.filter(e => e.comanda?.status === "aguardando_pagamento");
  const abertas   = todasEntradas.filter(e => e.comanda?.status === "aberta");
  const livres    = todasEntradas.filter(e => !e.comanda);

  const totalOcupadas = querPagar.length + abertas.length;
  const querPagarCount = querPagar.length;

  const GRID: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 14,
  };

  function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", margin: "0 0 10px",
        color: color ?? "var(--fg-subtle)",
      }}>
        {children}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:px-7 md:py-6">
      {/* Header */}
      <div className="mb-5 md:mb-7 flex justify-between items-end">
        <div>
          <p style={{
            fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)",
            textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
          }}>
            Mesas
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "4px 0 0", letterSpacing: "-0.3px", fontFamily: "var(--font-mono)" }}>
            {totalOcupadas === 0
              ? "Todas as mesas livres"
              : `${totalOcupadas} ocupada${totalOcupadas > 1 ? "s" : ""}`}
          </p>
        </div>
        {querPagarCount > 0 && (
          <div style={{
            background: "color-mix(in srgb, var(--danger) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
            borderRadius: 8, padding: "6px 12px",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>
              {querPagarCount} quer{querPagarCount > 1 ? "em" : ""} pagar
            </span>
          </div>
        )}
      </div>

      {mesas.length === 0 && (
        <div style={{
          background: "color-mix(in srgb, var(--fg) 4%, transparent)",
          borderRadius: 8, border: "1px solid var(--border)",
          padding: "28px 20px", textAlign: "center", marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>Nenhuma mesa cadastrada.</p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "8px 0 0", opacity: 0.7 }}>
            Configure as mesas em Dashboard → Mesas.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Querem pagar — prioridade máxima */}
        {querPagar.length > 0 && (
          <section>
            <SectionLabel color="var(--danger)">
              Querem pagar · {querPagar.length}
            </SectionLabel>
            <div style={GRID}>
              {querPagar.map(e => (
                <MesaCard key={e.key} label={e.label} comanda={e.comanda} capacidade={e.capacidade} href={e.href} onAbrir={e.onAbrir} />
              ))}
            </div>
          </section>
        )}

        {/* Abertas */}
        {abertas.length > 0 && (
          <section>
            <SectionLabel>Abertas · {abertas.length}</SectionLabel>
            <div style={GRID}>
              {abertas.map(e => (
                <MesaCard key={e.key} label={e.label} comanda={e.comanda} capacidade={e.capacidade} href={e.href} onAbrir={e.onAbrir} />
              ))}
            </div>
          </section>
        )}

        {/* Livres */}
        {livres.length > 0 && (
          <section>
            <SectionLabel>Livres · {livres.length}</SectionLabel>
            <div style={GRID}>
              {livres.map(e => (
                <MesaCard key={e.key} label={e.label} comanda={e.comanda} capacidade={e.capacidade} href={e.href} onAbrir={e.onAbrir} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
