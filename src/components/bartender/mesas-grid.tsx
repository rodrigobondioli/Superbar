"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Comanda, Mesa } from "@/types/database";
import { abrirComanda, atenderChamada } from "@/lib/bartender/actions";
import { ScanCartao } from "@/components/bartender/scan-cartao";

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
  comandas: Comanda[]; // vazio = livre; múltiplas = individual por pessoa
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
  onConfirm: (n: number, nome?: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [step, setStep] = useState<"pessoas" | "nome">("pessoas");
  const [qtd, setQtd]   = useState(0);
  const [nome, setNome] = useState("");

  const confirmarQtd = (n: number) => {
    if (n === 1) { setQtd(1); setStep("nome"); }
    else onConfirm(n);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 50 }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 51,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        pointerEvents: "none",
      }}>
      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "28px 28px 24px",
        width: "100%", maxWidth: 480,
        pointerEvents: "all",
      }}>
        <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
          Nova comanda
        </p>

        {step === "pessoas" ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px" }}>
              {label} — Quantas pessoas?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[1,2,3,4,5,6,7,8].map(n => (
                <button key={n} onClick={() => !isPending && confirmarQtd(n)} disabled={isPending} style={{
                  height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)",
                  background: "color-mix(in srgb, var(--fg) 6%, transparent)",
                  border: "1px solid var(--border)", borderRadius: 8,
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
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 8px" }}>
              {label} — 1 pessoa
            </h2>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 16px" }}>
              Qual o nome? (opcional)
            </p>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isPending && onConfirm(qtd, nome || undefined)}
              placeholder="Ex: João, Mesa 3 — Ana..."
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8, padding: "13px 14px",
                color: "var(--fg)", fontSize: 16, outline: "none", marginBottom: 16,
              } as React.CSSProperties}
            />
            <button
              onClick={() => !isPending && onConfirm(qtd, nome || undefined)}
              disabled={isPending}
              style={{
                width: "100%", padding: "16px",
                background: "var(--accent)", border: "none", borderRadius: 8,
                color: "var(--accent-fg)", fontSize: 15, fontWeight: 700,
                cursor: isPending ? "not-allowed" : "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isPending ? "Abrindo..." : "Abrir comanda"}
            </button>
            <button onClick={() => setStep("pessoas")} style={{
              width: "100%", padding: "12px", background: "transparent", border: "none",
              color: "var(--fg-subtle)", fontSize: 13, cursor: "pointer", marginTop: 4,
            }}>
              ← Voltar
            </button>
          </>
        )}
      </div>
      </div>
    </>
  );
}

// ─── Card individual de mesa ──────────────────────────────────────────────────

function MesaCard({ label, comandas, capacidade, chamadaId, onAbrir, onAtender }: {
  label: string;
  comandas: Comanda[];
  capacidade?: number | null;
  chamadaId?: string;
  onAbrir?: () => void;
  onAtender?: () => void;
}) {
  const livre         = comandas.length === 0;
  const hasAguardando = comandas.some(c => c.status === "aguardando_pagamento");
  const totalValor    = comandas.reduce((sum, c) => sum + c.total, 0);
  const maisAntiga    = comandas.length > 0
    ? comandas.reduce((a, b) => a.aberta_em < b.aberta_em ? a : b)
    : null;

  // ── Livre ──
  if (livre) {
    return (
      <button type="button" onClick={onAbrir} style={{
        display: "flex", flexDirection: "column", alignItems: "stretch",
        borderRadius: "var(--radius-lg)", padding: 0,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        cursor: "pointer", width: "100%", textAlign: "left",
        WebkitTapHighlightColor: "transparent", overflow: "hidden",
        transition: "border-color 120ms",
      }}>
        <div style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", lineHeight: 1.2 }}>
            {label}
          </span>
          {capacidade && (
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", display: "flex", alignItems: "center", gap: 3 }}>
              <IconPessoas />{capacidade} lugares
            </span>
          )}
        </div>
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "8px 14px",
          fontSize: 11, fontWeight: 600,
          color: "var(--fg-subtle)",
          letterSpacing: "0.02em",
        }}>
          + Abrir comanda
        </div>
      </button>
    );
  }

  // ── Ocupada ──
  const hasChamada = !!chamadaId;
  const bg = hasChamada
    ? "var(--danger-bg)"
    : hasAguardando
      ? "var(--warn-bg)"
      : "var(--bg-card)";
  const borderColor = hasChamada
    ? "var(--danger)"
    : hasAguardando
      ? "var(--warn)"
      : "var(--border)";

  return (
    <div
      className={hasChamada ? "mesa-chamada" : undefined}
      style={{
        background: bg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}
    >
      {/* Banner de chamada */}
      {hasChamada && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 14px",
          borderBottom: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
            🔔 Chamando atendimento
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAtender?.(); }}
            style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: "var(--radius-sm)",
              background: "var(--danger)", border: "none", color: "white",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          >
            Atendi ✓
          </button>
        </div>
      )}

      {/* Header da mesa */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>
            {label}
          </span>
          {maisAntiga && (
            <span style={{ fontSize: 10, color: "var(--fg-subtle)", display: "flex", alignItems: "center", gap: 3 }}>
              <IconClock />{tempoAberta(maisAntiga.aberta_em)}
            </span>
          )}
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--fg)", letterSpacing: "-0.5px" }}>
          {currency.format(totalValor)}
        </span>
      </div>

      {/* Comandas — link para cada uma */}
      {comandas.map((c) => {
        const querPagar = c.status === "aguardando_pagamento";
        return (
          <Link
            key={c.id}
            href={`/garcom/${c.id}`}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 16px", textDecoration: "none",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: querPagar ? "var(--warn)" : "var(--fg-subtle)",
            }}>
              {c.nome_cliente
                ? `${c.nome_cliente}${querPagar ? " — pagar" : ""}`
                : querPagar ? "Aguardando pagamento" : "Ver comanda"}
            </span>
            <span style={{ fontSize: 14, color: "var(--fg-subtle)" }}>›</span>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Grid principal ───────────────────────────────────────────────────────────

interface MesasGridProps {
  barId: string;
  initialMesas: MesaComStatus[];
  initialBalcao: Comanda | null;
}

export function MesasGrid({ barId, initialMesas, initialBalcao }: MesasGridProps) {
  const router = useRouter();
  const [mesas, setMesas]   = useState<MesaComStatus[]>(initialMesas);
  const [balcao, setBalcao] = useState<Comanda | null>(initialBalcao);
  // mesaId → chamadaId (para mesas com chamada pendente)
  const [chamadas, setChamadas] = useState<Map<string, string>>(new Map());
  // Tick a cada 60s para atualizar os tempos "há X min"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Modal de quantas pessoas (nova comanda)
  const [pendingAbrir, setPendingAbrir] = useState<{ mesaId: string | null; label: string } | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ── Realtime — comandas ───────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bartender_comandas_${barId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "comandas", filter: `bar_id=eq.${barId}` }, (payload) => {
        const atualizada = payload.new as Comanda;

        if (!atualizada.mesa_id) {
          // Balcão
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") {
            setBalcao(atualizada);
          } else {
            setBalcao(prev => prev?.id === atualizada.id ? null : prev);
          }
          return;
        }

        setMesas(prev => prev.map(m => {
          const idx = m.comandas.findIndex(c => c.id === atualizada.id);
          if (idx === -1) return m;
          // Se fechou/cancelou → remove do array
          if (atualizada.status === "paga" || atualizada.status === "cancelada") {
            return { ...m, comandas: m.comandas.filter(c => c.id !== atualizada.id) };
          }
          // Atualiza no array
          const novas = [...m.comandas];
          novas[idx] = atualizada;
          return { ...m, comandas: novas };
        }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comandas", filter: `bar_id=eq.${barId}` }, (payload) => {
        const nova = payload.new as Comanda;
        if (!nova.mesa_id) { setBalcao(nova); return; }
        setMesas(prev => prev.map(m =>
          m.mesa.id === nova.mesa_id
            ? { ...m, comandas: [...m.comandas, nova] }
            : m
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [barId]);

  // ── Realtime — chamadas ───────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    // Carrega chamadas pendentes do turno atual
    supabase
      .from("chamadas")
      .select("id, mesa_id")
      .eq("bar_id", barId)
      .eq("status", "pendente")
      .then(({ data }) => {
        if (!data) return;
        setChamadas(new Map(data.map((c: { id: string; mesa_id: string }) => [c.mesa_id, c.id])));
      });

    const channel = supabase
      .channel(`bartender_chamadas_${barId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chamadas", filter: `bar_id=eq.${barId}` }, (payload) => {
        const nova = payload.new as { id: string; mesa_id: string; status: string };
        if (nova.status === "pendente") {
          setChamadas(prev => new Map(prev).set(nova.mesa_id, nova.id));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chamadas", filter: `bar_id=eq.${barId}` }, (payload) => {
        const updated = payload.new as { id: string; mesa_id: string; status: string };
        if (updated.status === "atendida") {
          setChamadas(prev => {
            const next = new Map(prev);
            if (next.get(updated.mesa_id) === updated.id) next.delete(updated.mesa_id);
            return next;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [barId]);

  const handleAtenderChamada = (chamadaId: string, mesaId: string) => {
    setChamadas(prev => {
      const next = new Map(prev);
      next.delete(mesaId);
      return next;
    });
    startTransition(async () => { await atenderChamada(chamadaId); });
  };

  const handleConfirmarPessoas = async (n: number, nome?: string) => {
    if (!pendingAbrir) return;
    const { mesaId } = pendingAbrir;
    setPendingAbrir(null);
    setIsOpening(true);
    try {
      const result = await abrirComanda(mesaId, n > 0 ? n : undefined, undefined, nome);
      if (result && "id" in result) {
        window.location.href = `/garcom/${result.id}`;
      } else {
        const msg = (result && "error" in result) ? result.error : "Não foi possível abrir a comanda.";
        setOpenError(msg);
        setIsOpening(false);
      }
    } catch {
      setOpenError("Erro ao abrir comanda. Tente novamente.");
      setIsOpening(false);
    }
  };

  // ── Construir entradas ────────────────────────────────────────────────────
  type MesaEntry = {
    key: string;
    mesaId: string | null;
    label: string;
    comandas: Comanda[];
    capacidade?: number | null;
    chamadaId?: string;
    onAbrir?: () => void;
    onAtender?: () => void;
  };

  const todasEntradas: MesaEntry[] = [
    ...mesas.map(({ mesa, comandas }) => {
      const label = mesa.nome ?? `Mesa ${mesa.numero}`;
      const chamadaId = chamadas.get(mesa.id);
      return {
        key: mesa.id,
        mesaId: mesa.id,
        label,
        comandas,
        capacidade: mesa.capacidade,
        chamadaId,
        onAbrir: comandas.length === 0
          ? () => setPendingAbrir({ mesaId: mesa.id, label })
          : undefined,
        onAtender: chamadaId
          ? () => handleAtenderChamada(chamadaId, mesa.id)
          : undefined,
      };
    }),
    {
      key: "balcao",
      mesaId: null,
      label: "Balcão",
      comandas: balcao ? [balcao] : [],
      onAbrir: !balcao ? () => setPendingAbrir({ mesaId: null, label: "Balcão" }) : undefined,
    },
  ];

  const aguardando    = todasEntradas.filter(e => e.comandas.some(c => c.status === "aguardando_pagamento"));
  const abertas       = todasEntradas.filter(e => e.comandas.length > 0 && !e.comandas.some(c => c.status === "aguardando_pagamento"));
  const livres        = todasEntradas.filter(e => e.comandas.length === 0);
  const totalOcupadas = aguardando.length + abertas.length;

  const GRID_OCUPADAS: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  };

  const GRID_LIVRES: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
  };

  const SecLabel = ({ label, count }: { label: string; count: number }) => (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
      textTransform: "uppercase", margin: "0 0 12px",
      color: "var(--fg-subtle)",
    }}>
      {label}
      <span style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>{count}</span>
    </p>
  );

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "20px 20px 40px" }}>

      {/* Busca */}
      <div style={{ marginBottom: 20 }}>
        <ScanCartao />
      </div>

      {/* Header de status */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.3px" }}>
          {totalOcupadas > 0 ? `${totalOcupadas} ocupada${totalOcupadas > 1 ? "s" : ""}` : "Todas livres"}
        </h1>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {aguardando.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-sm)",
              background: "var(--warn-bg)", border: "1px solid var(--warn)", color: "var(--warn)",
            }}>
              {aguardando.length} aguardando pag.
            </span>
          )}
          {livres.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg-subtle)",
            }}>
              {livres.length} livre{livres.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {mesas.length === 0 && (
        <div style={{
          background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
          padding: "32px 20px", textAlign: "center", marginBottom: 20,
        }}>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>Nenhuma mesa cadastrada.</p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "6px 0 0", opacity: 0.7 }}>
            Configure as mesas em Dashboard → Mesas.
          </p>
        </div>
      )}

      {/* Keyframe de pulso para chamadas */}
      <style>{`
        @keyframes pulse-chamada {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          50%       { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.22); }
        }
        .mesa-chamada { animation: pulse-chamada 1.4s ease-in-out infinite; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {aguardando.length > 0 && (
          <section>
            <SecLabel label="Aguardando pagamento" count={aguardando.length} />
            <div style={GRID_OCUPADAS}>
              {aguardando.map(e => <MesaCard key={e.key} label={e.label} comandas={e.comandas} capacidade={e.capacidade} chamadaId={e.chamadaId} onAbrir={e.onAbrir} onAtender={e.onAtender} />)}
            </div>
          </section>
        )}
        {abertas.length > 0 && (
          <section>
            <SecLabel label="Abertas" count={abertas.length} />
            <div style={GRID_OCUPADAS}>
              {abertas.map(e => <MesaCard key={e.key} label={e.label} comandas={e.comandas} capacidade={e.capacidade} chamadaId={e.chamadaId} onAbrir={e.onAbrir} onAtender={e.onAtender} />)}
            </div>
          </section>
        )}
        {livres.length > 0 && (
          <section>
            <SecLabel label="Livres" count={livres.length} />
            <div style={GRID_LIVRES}>
              {livres.map(e => <MesaCard key={e.key} label={e.label} comandas={e.comandas} capacidade={e.capacidade} onAbrir={e.onAbrir} />)}
            </div>
          </section>
        )}
      </div>

      {/* Overlay: abrindo comanda */}
      {isOpening && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60 }} />
          <div style={{
            position: "fixed", inset: 0, zIndex: 61,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "28px 36px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "3px solid var(--border-strong)",
                borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite",
              }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                Abrindo comanda…
              </p>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {/* Banner de erro */}
      {openError && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }}
            onClick={() => setOpenError(null)} />
          <div style={{
            position: "fixed", inset: 0, zIndex: 61,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--danger)",
              borderRadius: 12, padding: "24px 28px", maxWidth: 360, width: "100%",
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)", margin: 0 }}>
                ⚠ Erro ao abrir comanda
              </p>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0, lineHeight: 1.5 }}>
                {openError}
              </p>
              <button
                onClick={() => setOpenError(null)}
                style={{
                  background: "var(--bg-inset)", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "10px", fontSize: 13, fontWeight: 600,
                  color: "var(--fg)", cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: quantas pessoas (nova comanda) */}
      {pendingAbrir && (
        <SeletorPessoas
          label={pendingAbrir.label}
          onConfirm={handleConfirmarPessoas}
          onClose={() => setPendingAbrir(null)}
          isPending={isOpening}
        />
      )}
    </div>
  );
}
