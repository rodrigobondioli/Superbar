"use client";

import { useEffect, useState, useTransition } from "react";
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

const IconClock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconPessoas = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ─── Modal: selecionar número de pessoas ─────────────────────────────────────

function SeletorPessoas({
  label, onConfirm, onClose, isPending,
}: {
  label: string;
  onConfirm: (n: number) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 50 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
        borderRadius: "10px 10px 0 0", padding: "24px 24px 40px", zIndex: 51,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
          Abrir comanda
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px" }}>
          {label} — Quantas pessoas?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <button key={n} onClick={() => !isPending && onConfirm(n)} disabled={isPending} style={{
              height: 64, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)",
              background: "color-mix(in srgb, var(--fg) 6%, transparent)",
              border: "1px solid var(--border)", borderRadius: 10,
              cursor: isPending ? "not-allowed" : "pointer", color: "var(--fg)",
              transition: "background 120ms", WebkitTapHighlightColor: "transparent",
              opacity: isPending ? 0.5 : 1,
            }}>{n}</button>
          ))}
        </div>
        <button onClick={() => !isPending && onConfirm(0)} disabled={isPending} style={{
          width: "100%", padding: "14px", background: "transparent", border: "none",
          color: "var(--fg-subtle)", fontSize: 13, cursor: "pointer",
        }}>
          Pular (não informar)
        </button>
      </div>
    </>
  );
}

// ─── Card individual ──────────────────────────────────────────────────────────

const CARD_H = 220;

function MesaCard({ label, comanda, capacidade, href, onAbrir }: {
  label: string;
  comanda: Comanda | null;
  capacidade?: number | null;
  href?: string;
  onAbrir?: () => void;
}) {
  const querPagar = comanda?.status === "aguardando_pagamento";
  const ocupada   = comanda !== null;
  const pessoas   = comanda?.total_pessoas ?? null;

  const base: React.CSSProperties = {
    display: "flex", flexDirection: "column", height: CARD_H,
    borderRadius: 10, position: "relative", transition: "opacity 0.15s",
    padding: "16px 18px 16px", boxSizing: "border-box",
  };

  // ── Livre ──
  if (!ocupada) {
    return (
      <button type="button" onClick={onAbrir} style={{
        ...base,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        justifyContent: "space-between",
        cursor: "pointer", width: "100%", textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.2px" }}>
          {label}
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
            + Abrir comanda
          </span>
          {capacidade && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 3 }}>
              <IconPessoas />{capacidade}
            </span>
          )}
        </div>
      </button>
    );
  }

  // ── Ocupada (aberta ou aguardando) ──
  // Aguardando: roxo mais saturado + borda mais visível
  // Aberta:     roxo suave
  const bg     = querPagar
    ? "color-mix(in srgb, #9333EA 22%, transparent)"
    : "color-mix(in srgb, #8B5CF6 13%, transparent)";
  const border = querPagar
    ? "1.5px solid color-mix(in srgb, #9333EA 55%, transparent)"
    : "1px solid color-mix(in srgb, #8B5CF6 25%, transparent)";

  return (
    <Link href={href!} style={{
      ...base, background: bg, border, textDecoration: "none",
      justifyContent: "space-between",
    }}>
      {/* Topo: nome da mesa */}
      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
        {label}
      </span>

      {/* Centro: total em destaque */}
      <p style={{
        fontSize: 28, fontWeight: 900, color: "var(--fg)",
        margin: 0, letterSpacing: "-0.6px",
        fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)", lineHeight: 1,
      }}>
        {currency.format(comanda.total)}
      </p>

      {/* Rodapé: tempo + pessoas */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: "rgba(255,255,255,0.45)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 4, padding: "3px 8px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <IconClock />{tempoAberta(comanda.aberta_em)}
        </span>
        {pessoas != null && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}>
            <IconPessoas />{pessoas}
          </span>
        )}
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
  const [mesas, setMesas]   = useState<MesaComStatus[]>(initialMesas);
  const [balcao, setBalcao] = useState<Comanda | null>(initialBalcao);
  const [pendingAbrir, setPendingAbrir] = useState<{ mesaId: string | null; label: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bartender_comandas_${barId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "comandas", filter: `bar_id=eq.${barId}` }, (payload) => {
        const atualizada = payload.new as Comanda;
        if (!atualizada.mesa_id) {
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") setBalcao(atualizada);
          else setBalcao(prev => prev?.id === atualizada.id ? null : prev);
          return;
        }
        setMesas(prev => prev.map(m => {
          if (m.comanda?.id !== atualizada.id) return m;
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") return { ...m, comanda: atualizada };
          return { ...m, comanda: null };
        }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comandas", filter: `bar_id=eq.${barId}` }, (payload) => {
        const nova = payload.new as Comanda;
        if (!nova.mesa_id) { setBalcao(nova); return; }
        setMesas(prev => prev.map(m => m.mesa.id === nova.mesa_id ? { ...m, comanda: nova } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [barId]);

  const handleConfirmarPessoas = (n: number) => {
    if (!pendingAbrir) return;
    const { mesaId } = pendingAbrir;
    startTransition(async () => {
      await abrirComanda(mesaId, n > 0 ? n : undefined);
      setPendingAbrir(null);
    });
  };

  type MesaEntry = { key: string; label: string; comanda: Comanda | null; capacidade?: number | null; href?: string; onAbrir?: () => void };

  const todasEntradas: MesaEntry[] = [
    ...mesas.map(({ mesa, comanda }) => ({
      key: mesa.id,
      label: mesa.nome ?? `Mesa ${mesa.numero}`,
      comanda,
      capacidade: mesa.capacidade,
      href: comanda ? `/bartender/${comanda.id}` : undefined,
      onAbrir: comanda ? undefined : () => setPendingAbrir({ mesaId: mesa.id, label: mesa.nome ?? `Mesa ${mesa.numero}` }),
    })),
    {
      key: "balcao", label: "Balcão", comanda: balcao,
      href: balcao ? `/bartender/${balcao.id}` : undefined,
      onAbrir: balcao ? undefined : () => setPendingAbrir({ mesaId: null, label: "Balcão" }),
    },
  ];

  const aguardando    = todasEntradas.filter(e => e.comanda?.status === "aguardando_pagamento");
  const abertas       = todasEntradas.filter(e => e.comanda?.status === "aberta");
  const livres        = todasEntradas.filter(e => !e.comanda);
  const totalOcupadas = aguardando.length + abertas.length;

  const GRID: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  };

  const SecLabel = ({ label, count }: { label: string; count: number }) => (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", margin: "0 0 12px",
      color: "var(--fg-subtle)",
    }}>
      {label} · {count}
    </p>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:px-7 md:py-6">

      {/* ── Header limpo ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          Mesas
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.4px", fontFamily: "var(--font-mono)" }}>
            {totalOcupadas > 0 ? `${totalOcupadas} ocupada${totalOcupadas > 1 ? "s" : ""}` : "Todas livres"}
          </p>
          {/* Pills de resumo — sem vermelho, só informação */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {aguardando.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "3px 10px", borderRadius: 20,
                background: "color-mix(in srgb, #9333EA 18%, transparent)",
                border: "1px solid color-mix(in srgb, #9333EA 35%, transparent)",
                color: "color-mix(in srgb, #C084FC 90%, white)",
              }}>
                {aguardando.length} aguardando pagamento
              </span>
            )}
            {livres.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "3px 10px", borderRadius: 20,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.35)",
              }}>
                {livres.length} livre{livres.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {mesas.length === 0 && (
        <div style={{
          background: "color-mix(in srgb, var(--fg) 4%, transparent)",
          borderRadius: 10, border: "1px solid var(--border)",
          padding: "28px 20px", textAlign: "center", marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>Nenhuma mesa cadastrada.</p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "8px 0 0", opacity: 0.7 }}>
            Configure as mesas em Dashboard → Mesas.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {aguardando.length > 0 && (
          <section>
            <SecLabel label="Aguardando pagamento" count={aguardando.length} />
            <div style={GRID}>
              {aguardando.map(e => <MesaCard key={e.key} label={e.label} comanda={e.comanda} capacidade={e.capacidade} href={e.href} onAbrir={e.onAbrir} />)}
            </div>
          </section>
        )}

        {abertas.length > 0 && (
          <section>
            <SecLabel label="Abertas" count={abertas.length} />
            <div style={GRID}>
              {abertas.map(e => <MesaCard key={e.key} label={e.label} comanda={e.comanda} capacidade={e.capacidade} href={e.href} onAbrir={e.onAbrir} />)}
            </div>
          </section>
        )}

        {livres.length > 0 && (
          <section>
            <SecLabel label="Livres" count={livres.length} />
            <div style={GRID}>
              {livres.map(e => <MesaCard key={e.key} label={e.label} comanda={e.comanda} capacidade={e.capacidade} href={e.href} onAbrir={e.onAbrir} />)}
            </div>
          </section>
        )}
      </div>

      {pendingAbrir && (
        <SeletorPessoas
          label={pendingAbrir.label}
          onConfirm={handleConfirmarPessoas}
          onClose={() => setPendingAbrir(null)}
          isPending={isPending}
        />
      )}
    </div>
  );
}
