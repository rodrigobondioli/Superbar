"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { abrirComandasMesa } from "@/lib/bartender/actions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export type PessoaComanda = {
  id: string;
  nome_cliente: string | null;
  total: number;
  status: string;
  aberta_em: string;
};

export function MesaView({
  mesaId, label, comandasIniciais, nSugerido,
}: {
  barId: string;
  mesaId: string;
  label: string;
  comandasIniciais: PessoaComanda[];
  nSugerido: number;
}) {
  const router = useRouter();
  const temPessoas = comandasIniciais.length > 0;

  // Setup (mesa sem comandas): "quantas?" → slots pra nomear
  const [mode, setMode] = useState<"quantas" | "slots">(nSugerido > 0 ? "slots" : "quantas");
  const [slots, setSlots] = useState<string[]>(() => Array(Math.max(1, nSugerido || 1)).fill(""));
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Lista (mesa com comandas): adicionar mais uma pessoa
  const [addNome, setAddNome] = useState<string | null>(null); // null = form fechado

  const escolherQuantas = (n: number) => { setSlots(Array(n).fill("")); setMode("slots"); };

  const abrir = async (nomes: string[]) => {
    setSaving(true); setErro(null);
    const r = await abrirComandasMesa(mesaId, nomes);
    setSaving(false);
    if ("error" in r) { setErro(r.error); return; }
    setAddNome(null);
    router.refresh(); // recarrega → cai na lista com as comandas criadas
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <Link href="/garcom" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-muted)", textDecoration: "none", fontSize: 13 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Mesas
        </Link>
        <span style={{ color: "var(--fg-subtle)", fontSize: 13 }}>/</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>{label}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>

          {/* ── Lista de pessoas ── */}
          {temPessoas ? (
            <>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 14px" }}>
                {comandasIniciais.length} {comandasIniciais.length === 1 ? "pessoa" : "pessoas"} na mesa · toque em <strong style={{ color: "var(--fg)" }}>Pedir</strong> pra lançar o pedido de cada uma
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {comandasIniciais.map((c, i) => {
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

              {/* Adicionar pessoa */}
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
              {erro && <p style={{ fontSize: 13, color: "var(--danger)", marginTop: 10 }}>{erro}</p>}
            </>
          ) : mode === "quantas" ? (
            /* ── Quantas pessoas? ── */
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Quantas pessoas?</h1>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 20px" }}>Cada pessoa vira uma comanda. Dá pra ajustar depois.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => escolherQuantas(n)} className="hover:!border-[var(--accent)]"
                    style={{ height: 64, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--fg)", fontSize: 22, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={() => escolherQuantas(1)} style={{ width: "100%", padding: "13px", background: "none", border: "none", color: "var(--fg-muted)", fontSize: 14, cursor: "pointer" }}>
                Não sei ainda — começar com 1
              </button>
            </>
          ) : (
            /* ── Slots pra nomear e abrir ── */
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Quem está na mesa?</h1>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 18px" }}>Nome de cada pessoa (opcional). Abre uma comanda pra cada.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {slots.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 24, fontSize: 13, color: "var(--fg-subtle)", flexShrink: 0, textAlign: "right" }}>{i + 1}</span>
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
    </div>
  );
}
