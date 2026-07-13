"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { abrirComandaCliente, chamarAtendimento, buscarComandaPorTelefone, criarPedidoCliente, type ItemPedido } from "@/lib/mesa/actions";
import type { MesaPublica, ProdutoPublico } from "@/lib/mesa/queries";
import { MenuApp } from "@/components/menu/menu-app";
import type { Bar, Mesa, Categoria, Produto, Destaque } from "@/types/database";
import { currency } from "@/lib/format";

type Tab = "cardapio" | "conta";

type Estado =
  | { tipo: "identificacao" }
  | { tipo: "recuperacao" }
  | { tipo: "aberta"; comandaId: string; nomeCliente: string };

type ItemComanda = {
  id: string;
  nome: string;
  varianteNome: string | null;
  precoTotal: number;
};

const SESSION_KEY = "superbar_comanda";

// ─── Ícones inline ─────────────────────────────────────────────────────────────

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconMenu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
    <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>
  </svg>
);

// ─── Stepper de quantidade (auto-pedido) ──────────────────────────────────────

function Stepper({ qty, onAdd, onRemove }: { qty: number; onAdd: () => void; onRemove: () => void }) {
  const round: React.CSSProperties = {
    width: 32, height: 32, borderRadius: "var(--r-pill)", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 800, lineHeight: 1, WebkitTapHighlightColor: "transparent",
  };
  if (qty === 0) {
    return (
      <button onClick={onAdd} aria-label="Adicionar" style={{ ...round, background: "var(--accent)", color: "var(--accent-fg)" }}>+</button>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={onRemove} aria-label="Remover" style={{ ...round, background: "rgba(255,255,255,0.1)", color: "var(--fg)" }}>−</button>
      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--fg)", minWidth: 18, textAlign: "center" }}>{qty}</span>
      <button onClick={onAdd} aria-label="Adicionar" style={{ ...round, background: "var(--accent)", color: "var(--accent-fg)" }}>+</button>
    </div>
  );
}

// ─── Tela de identificação ────────────────────────────────────────────────────

const inpStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1.5px solid rgba(255,255,255,0.14)",
  borderRadius: 8, padding: "16px 18px",
  color: "var(--fg)", fontSize: 18, outline: "none",
  boxSizing: "border-box", width: "100%",
  transition: "border-color 150ms",
};

function TelaIdentificacao({
  mesa,
  onAberta,
  onRecuperar,
}: {
  mesa: MesaPublica;
  onAberta: (comandaId: string, nome: string, telefone?: string) => void;
  onRecuperar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const abrir = () => {
    if (!nome.trim() || isPending) return;
    setErro(null);
    startTransition(async () => {
      const tel = telefone.replace(/\D/g, "") || undefined;
      const result = await abrirComandaCliente(mesa.id, mesa.bar.id, nome.trim(), tel);
      if ("error" in result) { setErro(result.error); return; }
      onAberta(result.comandaId, nome.trim(), tel);
    });
  };

  const mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      padding: "0 24px", justifyContent: "center", maxWidth: 420, margin: "0 auto",
    }}>
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
          {mesa.bar.nome}
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--fg)", margin: 0, letterSpacing: "-0.5px" }}>
          {mesaLabel}
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "8px 0 0" }}>
          Abra sua comanda para começar.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-subtle)" }}>
          Como devemos identificar sua comanda?
        </label>
        <input
          value={nome}
          onChange={e => { setNome(e.target.value); setErro(null); }}
          onKeyDown={e => e.key === "Enter" && abrir()}
          placeholder="Ex: João, Ana..."
          aria-label="Nome na comanda"
          aria-invalid={!!erro}
          aria-describedby={erro ? "mesa-abrir-erro" : undefined}
          autoFocus
          autoComplete="given-name"
          style={{ ...inpStyle, border: erro ? "1.5px solid var(--danger)" : inpStyle.border as string }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-subtle)", marginTop: 4 }}>
          Telefone <span style={{ fontWeight: 400, opacity: 0.6 }}>(opcional — para recuperar sua comanda)</span>
        </label>
        <input
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          onKeyDown={e => e.key === "Enter" && abrir()}
          placeholder="(11) 9 9999-9999"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          style={inpStyle}
        />

        {erro && <p id="mesa-abrir-erro" role="alert" style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{erro}</p>}

        <button
          onClick={abrir}
          disabled={!nome.trim() || isPending}
          style={{
            padding: "18px", borderRadius: 8, border: "none",
            background: nome.trim() && !isPending ? "var(--accent)" : "rgba(255,255,255,0.08)",
            color: nome.trim() && !isPending ? "var(--accent-fg)" : "rgba(255,255,255,0.25)",
            fontSize: 16, fontWeight: 800,
            cursor: nome.trim() && !isPending ? "pointer" : "not-allowed",
            transition: "background 200ms, color 200ms",
            WebkitTapHighlightColor: "transparent",
            marginTop: 4,
          }}
        >
          {isPending ? "Abrindo..." : "Abrir minha comanda"}
        </button>

        <button
          onClick={onRecuperar}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--fg-subtle)", padding: "8px 0",
            textDecoration: "underline", textUnderlineOffset: 3,
          }}
        >
          Já tenho comanda aberta
        </button>
      </div>
    </div>
  );
}

// ─── Tela de recuperação ──────────────────────────────────────────────────────

function TelaRecuperacao({
  mesa,
  onAberta,
  onVoltar,
}: {
  mesa: MesaPublica;
  onAberta: (comandaId: string, nome: string) => void;
  onVoltar: () => void;
}) {
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const buscar = () => {
    if (!telefone.trim() || isPending) return;
    setErro(null);
    startTransition(async () => {
      const result = await buscarComandaPorTelefone(telefone, mesa.id, mesa.bar.id);
      if ("error" in result) { setErro(result.error); return; }
      onAberta(result.comandaId, result.nomeCliente);
    });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      padding: "0 24px", justifyContent: "center", maxWidth: 420, margin: "0 auto",
    }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <p style={{ fontSize: 28, margin: "0 0 12px" }}>🔍</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--fg)", margin: "0 0 8px" }}>
          Recuperar comanda
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>
          Digite o telefone que você usou ao abrir a comanda.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          value={telefone}
          onChange={e => { setTelefone(e.target.value); setErro(null); }}
          onKeyDown={e => e.key === "Enter" && buscar()}
          placeholder="(11) 9 9999-9999"
          aria-label="Telefone"
          aria-invalid={!!erro}
          aria-describedby={erro ? "mesa-buscar-erro" : undefined}
          type="tel"
          autoFocus
          autoComplete="tel"
          inputMode="tel"
          style={{ ...inpStyle, border: erro ? "1.5px solid var(--danger)" : inpStyle.border as string }}
        />

        {erro && <p id="mesa-buscar-erro" role="alert" style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{erro}</p>}

        <button
          onClick={buscar}
          disabled={!telefone.trim() || isPending}
          style={{
            padding: "18px", borderRadius: 8, border: "none",
            background: telefone.trim() && !isPending ? "var(--accent)" : "rgba(255,255,255,0.08)",
            color: telefone.trim() && !isPending ? "var(--accent-fg)" : "rgba(255,255,255,0.25)",
            fontSize: 16, fontWeight: 800,
            cursor: telefone.trim() && !isPending ? "pointer" : "not-allowed",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {isPending ? "Buscando..." : "Buscar minha comanda"}
        </button>

        <button
          onClick={onVoltar}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--fg-subtle)", padding: "8px 0",
            textDecoration: "underline", textUnderlineOffset: 3,
          }}
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}


// ─── Componente raiz ──────────────────────────────────────────────────────────

export function MesaApp({
  mesa,
  bar,
  mesaRow,
  cardapio,
  topPedidos = [],
  destaques = [],
  esgotados = [],
}: {
  mesa: MesaPublica;
  bar: Bar;
  mesaRow: Mesa;
  cardapio: (Categoria & { produtos: Produto[] })[];
  topPedidos?: string[];
  destaques?: Destaque[];
  esgotados?: string[];
}) {
  const [estado, setEstado] = useState<Estado>({ tipo: "identificacao" });

  // Restaura comanda da sessão (reload)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const { comandaId, mesaId, nomeCliente } = JSON.parse(saved);
      if (mesaId === mesa.id && comandaId && nomeCliente) {
        setEstado({ tipo: "aberta", comandaId, nomeCliente });
      }
    } catch {}
  }, [mesa.id]);

  const handleAberta = (comandaId: string, nomeCliente: string, telefone?: string) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        comandaId, mesaId: mesa.id, nomeCliente,
        ...(telefone ? { telefone } : {}),
      }));
    } catch {}
    setEstado({ tipo: "aberta", comandaId, nomeCliente });
  };

  if (estado.tipo === "identificacao") {
    return (
      <TelaIdentificacao
        mesa={mesa}
        onAberta={handleAberta}
        onRecuperar={() => setEstado({ tipo: "recuperacao" })}
      />
    );
  }

  if (estado.tipo === "recuperacao") {
    return (
      <TelaRecuperacao
        mesa={mesa}
        onAberta={(id, nome) => handleAberta(id, nome)}
        onVoltar={() => setEstado({ tipo: "identificacao" })}
      />
    );
  }

  return (
    <MenuApp
      bar={bar}
      mesa={mesaRow}
      cardapio={cardapio}
      topPedidos={topPedidos}
      destaques={destaques}
      esgotados={esgotados}
      comandaId={estado.comandaId}
      autoPedido={mesa.bar.autoPedido}
      initialNome={estado.nomeCliente}
    />
  );
}
