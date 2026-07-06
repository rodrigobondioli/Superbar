"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { abrirComandasMesa, listarComandasMesa, enviarComandasCaixa, type PessoaComandaLite } from "@/lib/bartender/actions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Drawer lateral da mesa — centro do garçom: montar as pessoas e só depois pedir.
 *  Busca as comandas por server action (robusto, não depende do realtime). */
export function MesaDrawer({
  open, onClose, mesaId, label, onEnviadas,
}: {
  open: boolean;
  onClose: () => void;
  mesaId: string | null;
  label: string;
  /** Avisa a grade quais comandas foram enviadas pro caixa (pra sair de "Abertas" na hora, sem depender do realtime). */
  onEnviadas?: (ids: string[]) => void;
}) {
  const [comandas, setComandas] = useState<PessoaComandaLite[]>([]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<"quantas" | "slots">("quantas");
  const [slots, setSlots]       = useState<string[]>([""]);
  const [saving, setSaving]     = useState(false);
  const [erro, setErro]         = useState<string | null>(null);
  const [addNome, setAddNome]   = useState<string | null>(null);

  useEffect(() => {
    if (!open || !mesaId) return;
    let active = true;
    setLoading(true);
    setMode("quantas"); setSlots([""]); setAddNome(null); setErro(null);
    listarComandasMesa(mesaId).then(cs => {
      if (!active) return;
      setComandas(cs);
      setLoading(false);
    });
    return () => { active = false; };
  }, [open, mesaId]);

  const recarregar = async () => { if (mesaId) setComandas(await listarComandasMesa(mesaId)); };

  const abrir = async (nomes: string[]) => {
    if (!mesaId) return;
    setSaving(true); setErro(null);
    const r = await abrirComandasMesa(mesaId, nomes);
    setSaving(false);
    if ("error" in r) { setErro(r.error); return; }
    setAddNome(null);
    await recarregar();
  };

  const [enviando, setEnviando] = useState(false);
  const [fechando, setFechando] = useState(false);           // modo "fechar conta"
  const [selFechar, setSelFechar] = useState<Set<string>>(new Set());

  const temPessoas = comandas.length > 0;
  const abertas = comandas.filter(c => c.status === "aberta");

  const abrirFechar = () => { setSelFechar(new Set(abertas.map(c => c.id))); setFechando(true); };
  const toggleFechar = (id: string) => setSelFechar(prev => {
    const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s;
  });
  const enviarCaixa = async (ids: string[]) => {
    if (ids.length === 0 || enviando) return;
    setEnviando(true); setErro(null);
    const r = await enviarComandasCaixa(ids);
    setEnviando(false);
    if ("error" in r) { setErro(r.error); return; }
    setFechando(false);
    onEnviadas?.(ids);
    await recarregar();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s ease" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Mesa ${label}`}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 81,
          width: "min(94vw, 460px)",
          background: "var(--bg)", borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: open ? "-16px 0 40px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0, paddingTop: "calc(16px + env(safe-area-inset-top))" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Mesa</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: 0 }}>{label}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--fg-muted)", cursor: "pointer" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "var(--fg-subtle)", gap: 8, fontSize: 13 }}>
              <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Carregando…
            </div>
          ) : temPessoas ? (
            /* ── Lista de pessoas ── */
            <>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 14px" }}>
                {comandas.length} {comandas.length === 1 ? "pessoa" : "pessoas"} · toque em <strong style={{ color: "var(--fg)" }}>Pedir</strong> pra lançar o pedido de cada uma
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {comandas.map((c, i) => {
                  const nome = c.nome_cliente ?? `Pessoa ${i + 1}`;
                  const pagando = c.status === "aguardando_pagamento";
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "var(--bg-card-hi)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--fg-muted)" }}>
                        {nome.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</div>
                        <div style={{ fontSize: 12, color: pagando ? "var(--warn)" : "var(--fg-subtle)", marginTop: 2 }}>
                          {pagando ? "Conta enviada ao caixa" : currency.format(c.total)}
                        </div>
                      </div>
                      {!pagando && (
                        <Link href={`/garcom/${c.id}`} className="hover:brightness-110"
                          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "var(--accent-fg)", borderRadius: 999, padding: "9px 18px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                          Pedir
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {addNome === null ? (
                <button onClick={() => setAddNome("")} className="hover:!text-[var(--accent)]"
                  style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 14, fontWeight: 600, padding: "6px 0" }}>
                  <Plus style={{ width: 16, height: 16 }} /> Adicionar pessoa
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <input
                    value={addNome}
                    onChange={e => setAddNome(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !saving && abrir([addNome])}
                    placeholder="Nome (opcional)"
                    autoFocus
                    style={{ flex: 1, boxSizing: "border-box", background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", color: "var(--fg)", fontSize: 16, outline: "none" }}
                  />
                  <button onClick={() => abrir([addNome])} disabled={saving} className="hover:brightness-110"
                    style={{ flexShrink: 0, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 8, padding: "0 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    {saving ? "…" : "Abrir"}
                  </button>
                  <button onClick={() => setAddNome(null)} style={{ flexShrink: 0, background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "0 14px", color: "var(--fg-muted)", cursor: "pointer" }}>✕</button>
                </div>
              )}

              {/* ── Fechar conta — separado, no final ── */}
              {abertas.length >= 1 && (
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border-strong)" }}>
                  {!fechando ? (
                    <button onClick={abrirFechar} className="hover:brightness-110"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--fg)", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      Fechar conta · enviar pro caixa
                    </button>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 12px" }}>
                        Marque quem está <strong style={{ color: "var(--fg)" }}>fechando</strong> (quem fica segue aberto):
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {abertas.map(c => {
                          const marcada = selFechar.has(c.id);
                          const nome = c.nome_cliente ?? "Sem nome";
                          return (
                            <button key={c.id} onClick={() => toggleFechar(c.id)}
                              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
                                background: marcada ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--bg-card)",
                                border: `1px solid ${marcada ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border)"}`,
                                borderRadius: 12, padding: "11px 14px" }}>
                              <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                background: marcada ? "var(--accent)" : "transparent", border: marcada ? "none" : "1.5px solid var(--border-strong)",
                                color: "var(--accent-fg)", fontSize: 13, fontWeight: 800 }}>{marcada ? "✓" : ""}</span>
                              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</span>
                              <span style={{ fontSize: 13, color: "var(--fg-muted)", fontWeight: 600 }}>{currency.format(c.total)}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button onClick={() => setFechando(false)} style={{ flexShrink: 0, background: "none", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 18px", color: "var(--fg-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => enviarCaixa([...selFechar])} disabled={enviando || selFechar.size === 0} className="hover:brightness-110"
                          style={{ flex: 1, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: selFechar.size === 0 ? 0.5 : 1 }}>
                          {enviando ? "Enviando…" : `Enviar pro caixa (${selFechar.size})`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {erro && <p style={{ fontSize: 13, color: "var(--danger)", marginTop: 10 }}>{erro}</p>}
            </>
          ) : mode === "quantas" ? (
            /* ── Quantas pessoas? ── */
            <>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Quantas pessoas?</h3>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 18px" }}>Cada pessoa vira uma comanda. Dá pra ajustar depois.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => { setSlots(Array(n).fill("")); setMode("slots"); }} className="hover:!border-[var(--accent)]"
                    style={{ height: 60, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg)", fontSize: 20, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={() => { setSlots([""]); setMode("slots"); }} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "var(--fg-muted)", fontSize: 14, cursor: "pointer" }}>
                Não sei ainda — começar com 1
              </button>
            </>
          ) : (
            /* ── Slots pra nomear e abrir ── */
            <>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Quem está na mesa?</h3>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 16px" }}>Nome de cada pessoa (opcional). Abre uma comanda pra cada.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {slots.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 20, fontSize: 13, color: "var(--fg-subtle)", flexShrink: 0, textAlign: "right" }}>{i + 1}</span>
                    <input
                      value={s}
                      onChange={e => setSlots(prev => prev.map((v, k) => k === i ? e.target.value : v))}
                      placeholder={`Pessoa ${i + 1}`}
                      autoFocus={i === 0}
                      style={{ flex: 1, boxSizing: "border-box", background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", color: "var(--fg)", fontSize: 16, outline: "none" }}
                    />
                    {slots.length > 1 && (
                      <button onClick={() => setSlots(prev => prev.filter((_, k) => k !== i))} aria-label="Remover"
                        style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--fg-subtle)", padding: 6, display: "flex" }}>
                        <Trash2 style={{ width: 15, height: 15 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setSlots(prev => [...prev, ""])} className="hover:!text-[var(--accent)]"
                style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 14, fontWeight: 600, padding: "4px 0" }}>
                <Plus style={{ width: 15, height: 15 }} /> Mais uma pessoa
              </button>
              {erro && <p style={{ fontSize: 13, color: "var(--danger)", margin: "12px 0 0" }}>{erro}</p>}
              <button onClick={() => abrir(slots)} disabled={saving} className="hover:brightness-110"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 20, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                {saving ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Abrindo…</> : "Abrir comandas"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
