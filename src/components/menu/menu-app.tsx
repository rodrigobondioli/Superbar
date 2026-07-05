"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { submeterPedido, pedirConta } from "@/lib/menu/actions";
import { criarPedidoCliente } from "@/lib/mesa/actions";
import { chamarAtendimento } from "@/lib/mesa/actions";
import type { Bar, Mesa, Categoria, Produto, Destaque } from "@/types/database";

type CategoriaComProdutos = Categoria & { produtos: Produto[] };

type Screen =
  | "splash"
  | "welcome-new"
  | "welcome-back"
  | "home"
  | "categories"
  | "products"
  | "product-detail"
  | "cart"
  | "pedir-conta"
  | "conta-solicitada";

interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface ClienteLocal {
  nome: string;
  visitas: number;
  ultimaVisita: string;
  ultimoProdutoId?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = "var(--accent)";
const BG     = "var(--bg)";
const CARD   = "var(--bg-elevated)";
const CARD2  = "color-mix(in srgb, var(--fg) 8%, transparent)";
const FONT   = "var(--font-sans)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function storageKey(barSlug: string) {
  return `superbar_menu_${barSlug}`;
}

function readCliente(barSlug: string): ClienteLocal | null {
  try {
    const raw = localStorage.getItem(storageKey(barSlug));
    return raw ? (JSON.parse(raw) as ClienteLocal) : null;
  } catch {
    return null;
  }
}

function writeCliente(barSlug: string, data: ClienteLocal) {
  try {
    localStorage.setItem(storageKey(barSlug), JSON.stringify(data));
  } catch {}
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ordinal(n: number) {
  return `${n}ª`;
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────
// Timer via setTimeout (não RAF) — mais robusto em tabs em background e
// durante hydration. Progresso via CSS animation pura, sem estado JS.
function SplashScreen({ bar, onNext }: { bar: Bar; onNext: () => void }) {
  const DURATION = 2000;
  const onNextRef = useRef(onNext);

  useEffect(() => { onNextRef.current = onNext; });

  useEffect(() => {
    const id = setTimeout(() => { onNextRef.current(); }, DURATION);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      background: BG,
    }}>
      <style>{`
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>

      {/* Animated gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0a0a20 0%, #081508 25%, #160810 50%, #080f1a 75%, #0a0a20 100%)",
        backgroundSize: "400% 400%",
        animation: "gradShift 6s ease infinite",
      }} />

      {/* Subtle radial glow */}
      <div style={{
        position: "absolute",
        width: 320, height: 320,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 70%)`,
        top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", textAlign: "center", animation: "fadeUp 500ms 200ms both", padding: "0 32px" }}>
        <p style={{
          fontSize: 11, color: ACCENT, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.25em",
          margin: "0 0 18px", fontFamily: FONT,
        }}>
          Bem-vindo
        </p>
        <h1 style={{
          fontSize: 44, fontWeight: 900, color: "var(--fg)",
          margin: 0, lineHeight: 0.95,
          letterSpacing: "-1.5px",
          fontFamily: FONT,
        }}>
          {bar.nome}
        </h1>
        <p style={{
          fontSize: 14, color: "var(--fg-subtle)",
          margin: "18px 0 0", lineHeight: 1.6, fontFamily: FONT,
        }}>
          Mesa pronta. Cardápio a caminho.
        </p>
      </div>

      {/* Progress bar — CSS animation, sem estado JS */}
      <div style={{
        position: "absolute", bottom: 52, left: 48, right: 48,
        height: 2, background: "var(--border)", borderRadius: 2,
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: ACCENT,
          animation: `splashProgress ${DURATION}ms linear forwards`,
        }} />
      </div>
    </div>
  );
}

// ─── WELCOME NEW ──────────────────────────────────────────────────────────────
function WelcomeNewScreen({ bar, onConfirm }: { bar: Bar; onConfirm: (nome: string) => void }) {
  const [nome, setNome] = useState("");
  const valid = nome.trim().length > 0;

  return (
    <div style={{
      height: "100%", background: BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 28px", textAlign: "center",
      fontFamily: FONT,
    }}>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo redondo do bar */}
        <div style={{
          width: 88, height: 88, borderRadius: "50%", overflow: "hidden", marginBottom: 24,
          background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {bar.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={bar.logo_url} alt={bar.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>{bar.nome?.[0]?.toUpperCase() ?? "B"}</span>}
        </div>

        <p style={{ fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", margin: "0 0 14px" }}>
          {bar.nome}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--fg)", margin: "0 0 12px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
          Antes de começar,<br />como posso te chamar?
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.65 }}>
          Vou lembrar de você nas próximas visitas.
        </p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && onConfirm(nome.trim())}
            placeholder="Seu nome"
            style={{
              background: CARD2,
              border: `1.5px solid ${valid ? "var(--accent-bright)" : "var(--border)"}`,
              borderRadius: 8,
              padding: "18px 22px",
              fontSize: 18, fontWeight: 500,
              color: "var(--fg)", outline: "none",
              colorScheme: "dark", textAlign: "center",
              width: "100%", boxSizing: "border-box",
              transition: "border-color 200ms",
              fontFamily: FONT,
            }}
          />
          <button
            onClick={() => valid && onConfirm(nome.trim())}
            style={{
              background: valid ? ACCENT : "color-mix(in srgb, var(--fg) 5%, transparent)",
              color: valid ? "var(--accent-fg)" : "var(--fg-subtle)",
              border: "none", borderRadius: 999,
              padding: "16px 24px", fontSize: 15, fontWeight: 600,
              cursor: valid ? "pointer" : "default",
              transition: "all 250ms", fontFamily: FONT,
            }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── CATEGORIES ───────────────────────────────────────────────────────────────
function CategoriesScreen({
  cardapio,
  onSelect,
  cartCount,
  onCart,
  onPedirConta,
}: {
  cardapio: CategoriaComProdutos[];
  onSelect: (cat: CategoriaComProdutos) => void;
  cartCount: number;
  onCart: () => void;
  onPedirConta: () => void;
}) {
  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: "60px 24px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--fg)", margin: 0, lineHeight: 1.1, letterSpacing: "-0.6px" }}>
          Qual vai ser a<br />boa de hoje?
        </h1>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              background: ACCENT, color: "var(--accent-fg)", border: "none", borderRadius: 8,
              padding: "10px 18px", fontSize: 13, fontWeight: 800,
              cursor: "pointer", flexShrink: 0, marginTop: 4,
              display: "flex", alignItems: "center", gap: 6, fontFamily: FONT,
            }}
          >
            🛒 {cartCount}
          </button>
        )}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflow: "hidden", padding: "0 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {cardapio.map((cat) => {
          const coverImg = cat.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              style={{
                flex: 1, position: "relative", borderRadius: 8,
                overflow: "hidden", border: "none", cursor: "pointer",
                textAlign: "left", padding: 0, background: CARD2,
              }}
            >
              {coverImg && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${coverImg})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                }} />
              )}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 30%, transparent) 55%, transparent 100%)",
              }} />
              <div style={{
                position: "relative", height: "100%",
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", padding: "16px 18px",
              }}>
                <div>
                  <span style={{ fontSize: 21, fontWeight: 800, color: "var(--fg)", display: "block", letterSpacing: "-0.4px" }}>
                    {cat.nome}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 3, display: "block" }}>
                    {cat.produtos.length} {cat.produtos.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: ACCENT, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fechar conta — rodapé discreto */}
      <div style={{ padding: "14px 20px 40px", textAlign: "center", flexShrink: 0 }}>
        <button
          onClick={onPedirConta}
          style={{
            background: "none", border: "none",
            color: "var(--fg-subtle)",
            fontSize: 13, cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            fontFamily: FONT,
            transition: "color 200ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-subtle)"; }}
        >
          Pronto? Fechar a conta
        </button>
      </div>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
function ProductsScreen({
  categoria,
  allCategorias,
  onSelect,
  onBack,
  onSwitchCategoria,
  cartCount,
  onCart,
}: {
  categoria: CategoriaComProdutos;
  allCategorias: CategoriaComProdutos[];
  onSelect: (p: Produto) => void;
  onBack: () => void;
  onSwitchCategoria: (cat: CategoriaComProdutos) => void;
  cartCount: number;
  onCart: () => void;
}) {
  const ativos = categoria.produtos.filter((p) => p.ativo);
  const heroCover = ativos.find((p) => p.imagem_url)?.imagem_url ?? null;

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", fontFamily: FONT }}>

      {/* Hero */}
      <div style={{ position: "relative", height: 210, flexShrink: 0, overflow: "hidden" }}>
        {heroCover ? (
          <img
            src={heroCover}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            alt=""
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: CARD2 }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 45%, transparent) 55%, transparent 100%)",
        }} />
        <button
          onClick={onBack}
          style={{
            position: "absolute", top: 54, left: 16,
            background: "color-mix(in srgb, var(--bg) 70%, transparent)", backdropFilter: "none",
            border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px",
            color: "var(--fg)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: FONT,
          }}
        >
          ← Voltar
        </button>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              position: "absolute", top: 54, right: 16,
              background: ACCENT, color: "var(--accent-fg)",
              border: "none", borderRadius: 8, padding: "8px 18px",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT,
            }}
          >
            🛒 {cartCount}
          </button>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--fg)", margin: 0, letterSpacing: "-0.8px", lineHeight: 1 }}>
            {categoria.nome}
          </h1>
          <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "5px 0 0" }}>
            {ativos.length} {ativos.length === 1 ? "opção" : "opções"}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto",
        padding: "14px 16px",
        flexShrink: 0, scrollbarWidth: "none",
      }}>
        {allCategorias.map((cat) => {
          const active = cat.id === categoria.id;
          return (
            <button
              key={cat.id}
              onClick={() => !active && onSwitchCategoria(cat)}
              style={{
                flexShrink: 0, padding: "7px 16px",
                borderRadius: 4,
                border: active ? "none" : "1px solid var(--border)",
                background: active ? ACCENT : "color-mix(in srgb, var(--fg) 4%, transparent)",
                color: active ? "var(--accent-fg)" : "var(--fg-subtle)",
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: active ? "default" : "pointer",
                whiteSpace: "nowrap", fontFamily: FONT,
              }}
            >
              {cat.nome}
            </button>
          );
        })}
      </div>

      {/* 2-column grid */}
      <div style={{
        flex: 1, overflow: "auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10, padding: "2px 16px 60px",
        alignContent: "start",
      }}>
        {ativos.map((produto) => (
          <button
            key={produto.id}
            onClick={() => onSelect(produto)}
            style={{
              background: CARD, border: "1px solid var(--border)", borderRadius: 8,
              overflow: "hidden", cursor: "pointer",
              textAlign: "left", padding: 0,
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", paddingBottom: "72%" }}>
              {produto.imagem_url ? (
                <img
                  src={produto.imagem_url}
                  onError={(e) => {
                    const parent = (e.currentTarget as HTMLImageElement).parentElement;
                    if (parent) parent.style.background = CARD2;
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover", display: "block",
                  }}
                  alt={produto.nome}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: CARD2 }} />
              )}
            </div>
            <div style={{ padding: "11px 13px 14px", flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: "0 0 5px", lineHeight: 1.3 }}>
                {produto.nome}
              </p>
              <p style={{ fontSize: 14, fontWeight: 800, color: ACCENT, margin: 0 }}>
                {fmt(produto.preco)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductDetailScreen({
  produto,
  onBack,
  onAdd,
  cartCount,
  onCart,
  autoPedido = true,
}: {
  produto: Produto;
  onBack: () => void;
  onAdd: (produto: Produto, qty: number) => void;
  cartCount: number;
  onCart: () => void;
  autoPedido?: boolean;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", overflow: "auto", fontFamily: FONT }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 340, flexShrink: 0 }}>
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            alt={produto.nome}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: CARD2 }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 20%, transparent) 60%, transparent 100%)",
        }} />
        <button
          onClick={onBack}
          style={{
            position: "absolute", top: 52, left: 20,
            background: "color-mix(in srgb, var(--bg) 70%, transparent)",
            border: "1px solid var(--border)", borderRadius: 8, padding: "9px 16px",
            color: "var(--fg)", fontSize: 13, cursor: "pointer", fontFamily: FONT,
          }}
        >
          ← Voltar
        </button>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              position: "absolute", top: 52, right: 20,
              background: ACCENT, border: "none", borderRadius: 8,
              padding: "9px 16px", color: "var(--accent-fg)",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT,
            }}
          >
            🛒 {cartCount}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 24px 160px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--fg)", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-0.5px" }}>
          {produto.nome}
        </h1>
        {produto.descricao && (
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 20px", lineHeight: 1.7 }}>
            {produto.descricao}
          </p>
        )}
        <p style={{ fontSize: 30, fontWeight: 900, color: "var(--fg)", margin: "0 0 32px", letterSpacing: "-0.5px" }}>
          {fmt(produto.preco)}
        </p>

        {/* Qty picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>Quantidade</span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 42, height: 42, borderRadius: 8,
                background: CARD2, border: "none", color: "var(--fg)", fontSize: 22,
                cursor: qty > 1 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: qty > 1 ? 1 : 0.3, fontFamily: FONT,
              }}
            >−</button>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", minWidth: 28, textAlign: "center" }}>{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{
                width: 42, height: 42, borderRadius: 8,
                background: ACCENT, border: "none", color: "var(--accent-fg)", fontSize: 22,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT,
              }}
            >+</button>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 20px 40px",
        background: `linear-gradient(to top, ${BG} 70%, transparent)`,
        display: "flex", gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: "17px", borderRadius: 8,
            background: CARD, border: "none",
            color: "var(--fg-muted)",
            fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          }}
        >
          Voltar
        </button>
        {autoPedido ? (
          <button
            onClick={() => onAdd(produto, qty)}
            style={{
              flex: 2.5, padding: "17px", borderRadius: 8,
              background: ACCENT, border: "none", color: "var(--accent-fg)",
              fontSize: 15, fontWeight: 900, cursor: "pointer",
              letterSpacing: "-0.3px", fontFamily: FONT,
            }}
          >
            Pedir agora · {fmt(produto.preco * qty)}
          </button>
        ) : (
          <div
            style={{
              flex: 2.5, padding: "17px", borderRadius: 8,
              background: CARD, color: "var(--fg-muted)",
              fontSize: 14, fontWeight: 700, textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT,
            }}
          >
            Peça ao garçom
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CART ─────────────────────────────────────────────────────────────────────
function CartScreen({
  cliente,
  cart,
  bar,
  mesa,
  comandaId,
  onBack,
  onPedidoEnviado,
}: {
  cliente: ClienteLocal | null;
  cart: CartItem[];
  bar: Bar;
  mesa: Mesa;
  comandaId?: string;
  onBack: () => void;
  onPedidoEnviado: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);
  const mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;

  const handleEnviar = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (comandaId) {
        // Fluxo real do QR: grava no modelo verdadeiro (pedido + comanda_items → fila do bar)
        const r = await criarPedidoCliente(
          comandaId,
          bar.id,
          cart.map((i) => ({ produtoId: i.produto.id, varianteId: null, quantidade: i.quantidade })),
        );
        if ("error" in r) throw new Error(r.error);
      } else {
        // Rotas sem comanda (prévia): mantém o caminho legado por enquanto
        await submeterPedido({
          barId: bar.id,
          mesaId: mesa.id,
          nomeCliente: cliente?.nome ?? null,
          itens: cart.map((i) => ({
            produto_id: i.produto.id,
            nome: i.produto.nome,
            preco: i.produto.preco,
            quantidade: i.quantidade,
          })),
        });
      }
      setSuccess(true);
      setTimeout(() => onPedidoEnviado(), 2800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar pedido.");
      setSubmitting(false);
    }
  };

  // ── Tela de sucesso ──
  if (success) {
    return (
      <div style={{
        height: "100%", background: BG,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 40px", textAlign: "center", fontFamily: FONT,
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 8,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 38, marginBottom: 28,
        }}>
          ✓
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--fg)", margin: "0 0 12px", letterSpacing: "-0.5px" }}>
          Pedido enviado!
        </h2>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.7 }}>
          O bartender já recebeu.<br />
          Relaxa que vem aí.
        </p>
        <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 40 }}>
          {mesaLabel} · {fmt(total)}
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: "52px 24px 24px", flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--fg-subtle)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 22, display: "block", fontFamily: FONT }}
        >
          ← Continuar pedindo
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 8,
            background: ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 21, fontWeight: 900, color: "var(--accent-fg)", flexShrink: 0,
          }}>
            {cliente?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)", margin: 0 }}>
              Olá, {cliente?.nome ?? "você"}
            </p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "3px 0 0" }}>
              {cliente && cliente.visitas > 1
                ? `${ordinal(cliente.visitas)} visita · ${mesaLabel}`
                : mesaLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px" }}>
        <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 18px", fontWeight: 600 }}>
          Sua consumação
        </p>
        {cart.map((item) => (
          <div key={item.produto.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            {item.produto.imagem_url ? (
              <img
                src={item.produto.imagem_url}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                alt={item.produto.nome}
              />
            ) : (
              <div style={{ width: 54, height: 54, borderRadius: 8, background: CARD2, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0, lineHeight: 1.3 }}>
                {item.quantidade > 1 && (
                  <span style={{ color: ACCENT, fontWeight: 800, marginRight: 6 }}>{item.quantidade}×</span>
                )}
                {item.produto.nome}
              </p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", margin: 0, flexShrink: 0 }}>
              {fmt(item.produto.preco * item.quantidade)}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px 44px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 14, color: "var(--fg-subtle)" }}>Total a pagar</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.8px" }}>{fmt(total)}</span>
        </div>
        {error && (
          <p style={{ fontSize: 12, color: "var(--danger)", textAlign: "center", margin: "0 0 12px" }}>
            {error}
          </p>
        )}
        <button
          onClick={handleEnviar}
          disabled={submitting}
          style={{
            width: "100%", padding: "20px", borderRadius: 8,
            background: submitting ? "color-mix(in srgb, var(--accent) 50%, transparent)" : ACCENT,
            border: "none", color: "var(--accent-fg)",
            fontSize: 16, fontWeight: 900,
            cursor: submitting ? "default" : "pointer",
            letterSpacing: "-0.3px", fontFamily: FONT,
            transition: "background 200ms",
          }}
        >
          {submitting ? "Enviando..." : "Fazer pedido →"}
        </button>
        <p style={{ fontSize: 11, color: "var(--fg-subtle)", textAlign: "center", margin: "14px 0 0" }}>
          O bartender recebe o pedido na hora
        </p>
      </div>
    </div>
  );
}

// ─── PEDIR CONTA ─────────────────────────────────────────────────────────────

function PedirContaScreen({
  bar,
  mesa,
  onConfirm,
  onBack,
}: {
  bar: Bar;
  mesa: Mesa;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;

  const handleConfirm = () => {
    startTransition(async () => {
      await pedirConta(bar.id, mesa.id);
      onConfirm();
    });
  };

  return (
    <div style={{
      height: "100%", background: BG, fontFamily: FONT,
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 28px 52px",
    }}>
      <div>
        <p style={{ fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", margin: "0 0 22px" }}>
          {mesaLabel}
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--fg)", margin: "0 0 16px", lineHeight: 1.05, letterSpacing: "-0.8px" }}>
          Fechar a conta?
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-muted)", margin: 0, lineHeight: 1.7 }}>
          Ao confirmar, o garçom vai até você para finalizar o pagamento.
          Você não poderá mais fazer pedidos nesta mesa.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          style={{
            padding: "20px", borderRadius: 8,
            background: isPending ? "color-mix(in srgb, var(--accent) 50%, transparent)" : ACCENT,
            border: "none", color: "var(--accent-fg)",
            fontSize: 16, fontWeight: 900,
            cursor: isPending ? "default" : "pointer",
            letterSpacing: "-0.3px", fontFamily: FONT,
            transition: "background 200ms",
          }}
        >
          {isPending ? "Enviando..." : "Confirmar — fechar conta →"}
        </button>
        <button
          onClick={onBack}
          disabled={isPending}
          style={{
            padding: "18px", borderRadius: 8,
            background: CARD, border: "none",
            color: "var(--fg-muted)",
            fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT,
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── CONTA SOLICITADA ─────────────────────────────────────────────────────────

function ContaSolicitadaScreen({ mesa }: { mesa: Mesa }) {
  const mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;

  return (
    <div style={{
      height: "100%", background: BG, fontFamily: FONT,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 40px", textAlign: "center",
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: 8,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 42, marginBottom: 32,
      }}>
        🧾
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 900, color: "var(--fg)", margin: "0 0 14px", letterSpacing: "-0.6px", lineHeight: 1.1 }}>
        Conta solicitada!
      </h2>
      <p style={{ fontSize: 15, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.7 }}>
        Seu garçom vai até você<br />em instantes para finalizar.
      </p>
      <p style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 40 }}>
        {mesaLabel}
      </p>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 56, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : -16}px)`,
      opacity: visible ? 1 : 0,
      transition: "all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      background: ACCENT, color: "var(--accent-fg)",
      padding: "10px 22px", borderRadius: 8,
      fontSize: 13, fontWeight: 800,
      zIndex: 200, pointerEvents: "none",
      whiteSpace: "nowrap", fontFamily: FONT,
    }}>
      🔥 Adicionado!
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const VIBE_STEPS: { q: string; o: string[] }[] = [
  { q: "O que a noite pede?", o: ["Algo pra abrir", "Meu clássico de confiança", "Quero descobrir algo novo", "Sem álcool, no capricho"] },
  { q: "Que perfil combina com você?", o: ["Cítrico e refrescante", "Amargo e sofisticado", "Doce e aveludado", "Seco e direto"] },
  { q: "Quão forte você quer?", o: ["Leve, pra conversar", "No ponto", "Encorpado, pra sentir"] },
];

const VIBE_KW: Record<string, string[]> = {
  "citrico e refrescante": ["limao", "citric", "gin", "tonica", "mule", "margarita", "lima", "laranja", "refrescante", "spritz", "mojito", "aperol"],
  "amargo e sofisticado": ["negroni", "campari", "aperol", "amaro", "bitter", "boulevardier", "americano", "fernet"],
  "doce e aveludado": ["doce", "morango", "maracuja", "fruta", "licor", "mel", "chocolate", "cassis", "pina", "espresso"],
  "seco e direto": ["martini", "seco", "dry", "negroni", "whisky", "gin", "old fashioned", "manhattan"],
};

function sugerirPorVibe(picks: string[], ativos: Produto[], cardapio: CategoriaComProdutos[]): Produto[] {
  const catN = new Map(cardapio.map((c) => [c.id, norm(c.nome)]));
  const semAlcool = norm(picks[0] ?? "").includes("sem alcool");
  let pool = ativos.filter((p) => {
    const n = catN.get(p.categoria_id ?? "") ?? "";
    if (n.includes("petisco") || n.includes("comida") || n.includes("porcao")) return false; // nunca comida
    const naoAlc = n.includes("nao alco") || n.includes("sem alco");
    return semAlcool ? naoAlc : !naoAlc;
  });
  if (pool.length === 0) pool = ativos;
  const kw = VIBE_KW[norm(picks[1] ?? "")] ?? [];
  const scored = pool.map((p) => {
    const hay = norm(`${p.nome} ${p.descricao ?? ""}`);
    const score = kw.reduce((acc, k) => acc + (hay.includes(k) ? 1 : 0), 0);
    return { p, score };
  });
  const comMatch = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.p);
  const resto = pool.filter((p) => !comMatch.includes(p));
  return [...comMatch, ...resto].slice(0, 2);
}

function HomeScreen({
  cliente, mesaLabel, barId, mesaId, cardapio, allProdutos, ultimoProduto, topPedidos, destaques, cartCount, onCart, onSelectCategoria, onSelectProduto,
}: {
  cliente: ClienteLocal | null;
  mesaLabel: string;
  barId: string;
  mesaId: string;
  cardapio: CategoriaComProdutos[];
  allProdutos: Produto[];
  ultimoProduto: Produto | null;
  topPedidos: string[];
  destaques: Destaque[];
  cartCount: number;
  onCart: () => void;
  onSelectCategoria: (cat: CategoriaComProdutos) => void;
  onSelectProduto: (p: Produto) => void;
}) {
  const ativos = allProdutos.filter((p) => p.ativo);
  const catNome = new Map(cardapio.map((c) => [c.id, norm(c.nome)]));
  const badgeDrink = (p: Produto): string => {
    const n = catNome.get(p.categoria_id ?? "") ?? "";
    return n.includes("autoral") ? "Autoral" : n.includes("classic") ? "Clássico" : "Sugestão";
  };
  const ehAlcoolico = (p: Produto): boolean => {
    const n = catNome.get(p.categoria_id ?? "") ?? "";
    if (n.includes("petisco") || n.includes("comida") || n.includes("porcao")) return false;
    if (n.includes("nao alco") || n.includes("sem alco")) return false;
    return true;
  };
  const pool = ativos.filter(ehAlcoolico).slice(0, 12);
  const sugestoes = ativos.filter((p) => p.id !== ultimoProduto?.id);
  const featBase = sugestoes.filter((p) => p.imagem_url).length >= 2 ? sugestoes.filter((p) => p.imagem_url) : sugestoes;
  const featured = featBase.slice(0, 6);
  // Hero = banners de destaque (se o dono criou); senão, cai nos drinks com foto.
  const heroItems: { imagem: string | null; titulo: string; subtitulo: string | null; badge: string; onClick: () => void }[] =
    destaques.length > 0
      ? destaques.map((d) => ({
          imagem: d.imagem_url, titulo: d.titulo, subtitulo: d.subtitulo, badge: "Destaque",
          onClick: () => { const p = d.produto_id ? ativos.find((x) => x.id === d.produto_id) : null; if (p) onSelectProduto(p); },
        }))
      : featured.map((p) => ({
          imagem: p.imagem_url, titulo: p.nome, subtitulo: p.descricao, badge: badgeDrink(p),
          onClick: () => onSelectProduto(p),
        }));
  const topDrinks = topPedidos
    .map((id) => ativos.find((p) => p.id === id))
    .filter((p): p is Produto => !!p)
    .slice(0, 5);
  const N = pool.length;
  const rowH = 64;
  const copies = 24;
  const MAX_GIROS = 2;

  const [mode, setMode] = useState<"surp" | "guia">("guia");
  const reelRef = useRef<HTMLDivElement>(null);
  const heroDragRef = useRef({ x: 0, moved: false });
  const idxRef = useRef(N * Math.floor(copies / 2));
  const [spinning, setSpinning] = useState(false);
  const [resultado, setResultado] = useState<Produto | null>(null);
  const [spinsUsed, setSpinsUsed] = useState(0);
  const [chamando, setChamando] = useState(false);
  const [chamado, setChamado] = useState(false);
  const [chamarErro, setChamarErro] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroDrag, setHeroDrag] = useState(0);      // deslocamento em px enquanto arrasta
  const [heroDragging, setHeroDragging] = useState(false);

  // Carrossel automático quando há 2+ destaques (rota a cada 4.5s) — pausa no arraste
  useEffect(() => {
    if (heroItems.length <= 1 || heroDragging) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroItems.length), 4500);
    return () => clearInterval(t);
  }, [heroItems.length, heroDragging]);

  useEffect(() => {
    if (reelRef.current && N > 0) {
      idxRef.current = N * Math.floor(copies / 2);
      reelRef.current.style.transform = `translateY(${rowH * (1 - idxRef.current)}px)`;
    }
  }, [N]);

  function spin() {
    if (spinning || spinsUsed >= MAX_GIROS || N === 0 || !reelRef.current) return;
    setSpinning(true); setResultado(null);
    const k = Math.floor(Math.random() * N);
    const delta = N * 5 + ((((k - (idxRef.current % N)) % N) + N) % N);
    const ni = idxRef.current + delta;
    reelRef.current.style.transition = "transform 3.2s cubic-bezier(.12,.7,.2,1)";
    reelRef.current.style.transform = `translateY(${rowH * (1 - ni)}px)`;
    setTimeout(() => {
      setResultado(pool[k]);
      setSpinsUsed((s) => s + 1);
      const safe = (ni % N) + N * Math.floor(copies / 2);
      if (reelRef.current) {
        reelRef.current.style.transition = "none";
        reelRef.current.style.transform = `translateY(${rowH * (1 - safe)}px)`;
        void reelRef.current.offsetWidth;
      }
      idxRef.current = safe;
      setSpinning(false);
    }, 3300);
  }

  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const recs = step >= VIBE_STEPS.length ? sugerirPorVibe(picks, ativos, cardapio) : [];

  const seg = (label: string, on: boolean, onClick: () => void) => (
    <div onClick={onClick} style={{
      flex: 1, textAlign: "center", padding: "9px", borderRadius: 999,
      fontSize: 13, fontWeight: 700, cursor: "pointer",
      color: on ? "var(--accent-fg)" : "var(--fg-subtle)",
      background: on ? ACCENT : "transparent", transition: "all 150ms",
    }}>{label}</div>
  );

  return (
    <div style={{ height: "100%", background: BG, overflow: "auto", fontFamily: FONT }}>
      <div style={{ padding: "56px 18px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, fontWeight: 800, fontSize: 17 }}>
            {cliente?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--fg-subtle)" }}>Boa noite,</p>
            <p style={{ margin: "1px 0 0", fontSize: 17, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.3px" }}>{cliente?.nome ?? "você"}</p>
          </div>
          {cartCount > 0
            ? <button onClick={onCart} style={{ background: ACCENT, color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>🛒 {cartCount}</button>
            : <div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Mesa</p><p style={{ margin: "1px 0 0", fontSize: 14, fontWeight: 700, color: "var(--fg-muted)" }}>{mesaLabel.replace(/\D/g, "") || mesaLabel}</p></div>}
        </div>

        {/* Pedir de novo (último pedido) */}
        {ultimoProduto && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Da última vez</p>
            <button onClick={() => onSelectProduto(ultimoProduto)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: CARD2, borderRadius: 16, padding: 12, border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: ultimoProduto.imagem_url ? `url(${ultimoProduto.imagem_url}) center/cover` : CARD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>{ultimoProduto.imagem_url ? "" : "🍸"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ultimoProduto.nome}</p>
                {ultimoProduto.descricao && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--fg-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ultimoProduto.descricao}</p>}
              </div>
              <span style={{ background: ACCENT, color: "var(--accent-fg)", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>De novo →</span>
            </button>
          </div>
        )}

        {/* Em destaque — banners (carrossel automático + arrasta quando há 2+) */}
        {heroItems.length > 0 && (() => {
          const cur = heroIdx % heroItems.length;
          const multi = heroItems.length > 1;
          return (
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>{destaques.length === 0 && ultimoProduto ? "Você pode gostar" : "Em destaque"}</p>
              <div
                onTouchStart={(e) => { if (!multi) return; heroDragRef.current = { x: e.touches[0].clientX, moved: false }; setHeroDragging(true); }}
                onTouchMove={(e) => {
                  if (!multi || !heroDragging) return;
                  const dx = e.touches[0].clientX - heroDragRef.current.x;
                  if (Math.abs(dx) > 6) heroDragRef.current.moved = true;
                  // resistência nas bordas (não há slide antes do 1º / depois do último)
                  const atStart = cur === 0 && dx > 0;
                  const atEnd = cur === heroItems.length - 1 && dx < 0;
                  setHeroDrag(atStart || atEnd ? dx * 0.35 : dx);
                }}
                onTouchEnd={(e) => {
                  if (!multi) return;
                  const dx = e.changedTouches[0].clientX - heroDragRef.current.x;
                  setHeroDragging(false); setHeroDrag(0);
                  if (Math.abs(dx) > 48) setHeroIdx((i) => (i + (dx < 0 ? 1 : heroItems.length - 1)) % heroItems.length);
                }}
                style={{ overflow: "hidden", borderRadius: 20, touchAction: "pan-y" }}>
                <div style={{ display: "flex", transform: `translateX(calc(${-cur * 100}% + ${heroDrag}px))`, transition: heroDragging ? "none" : "transform 360ms cubic-bezier(0.22, 0.61, 0.36, 1)", willChange: "transform" }}>
                  {heroItems.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { if (heroDragRef.current.moved) { heroDragRef.current.moved = false; return; } h.onClick(); }}
                      style={{ flex: "0 0 100%", position: "relative", minHeight: 240, border: "none", padding: 0, cursor: "pointer", background: h.imagem ? `url(${h.imagem}) center/cover` : CARD, display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "left" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 10%, color-mix(in srgb, var(--bg) 35%, transparent) 52%, transparent 82%)" }} />
                      <span style={{ position: "absolute", top: 14, left: 14, background: ACCENT, color: "var(--accent-fg)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "5px 11px", borderRadius: 999 }}>{h.badge}</span>
                      <div style={{ position: "relative", padding: 16 }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.5px", lineHeight: 1.1 }}>{h.titulo}</p>
                        {h.subtitulo && <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.45 }}>{h.subtitulo}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {multi && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
                  {heroItems.map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Destaque ${i + 1}`} style={{ width: i === cur ? 20 : 6, height: 6, borderRadius: 999, background: i === cur ? ACCENT : "var(--border-strong)", border: "none", cursor: "pointer", transition: "all 200ms", padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Categorias — Especial do Dia sai da grade e vira banner */}
        {cardapio.length > 0 && (() => {
          const especial = cardapio.find((c) => c.nome.toLowerCase().includes("especial"));
          const grid = especial ? cardapio.filter((c) => c.id !== especial.id) : cardapio;
          return (
            <>
              {especial && (() => {
                const cover = especial.imagem_url ?? especial.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
                const item = especial.produtos[0] ?? null;
                return (
                  <div
                    onClick={() => item ? onSelectProduto(item) : onSelectCategoria(especial)}
                    style={{ display: "flex", gap: 14, alignItems: "stretch", width: "100%", cursor: "pointer", textAlign: "left", marginBottom: 22 }}
                  >
                    <div style={{ width: "55%", flexShrink: 0, aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden", background: cover ? `url(${cover}) center/cover` : CARD2 }} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.1em" }}>Especial do dia</p>
                      <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.4px", lineHeight: 1.15 }}>{item ? item.nome : especial.nome}</p>
                      {item?.descricao && (
                        <p style={{ margin: "0 0 4px", fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>{item.descricao}</p>
                      )}
                      {item && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectProduto(item); }}
                          style={{ alignSelf: "flex-start", background: ACCENT, color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}
                        >
                          Provar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>Categorias</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {grid.map((cat) => {
                  const cover = cat.imagem_url ?? cat.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
                  return (
                    <button key={cat.id} onClick={() => onSelectCategoria(cat)} style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "none", padding: 0, background: cover ? `url(${cover}) center/cover` : CARD2 }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 20%, transparent) 55%, transparent 100%)" }} />
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 14px", textAlign: "left" }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>{cat.nome}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--fg-muted)" }}>{cat.produtos.length} {cat.produtos.length === 1 ? "opção" : "opções"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ height: 24 }} />
            </>
          );
        })()}

        {/* Hub de decisão */}
        {N > 0 && (
          <div style={{ background: CARD2, borderRadius: 22, padding: "18px 16px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.4px", textAlign: "center" }}>Não sabe o que beber?</p>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--fg-subtle)", textAlign: "center" }}>{mode === "surp" ? "Dois giros e a casa decide por você." : "Três perguntas. A casa acha o seu drink."}</p>
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 999, padding: 4, marginBottom: 16 }}>
              {seg("Me guie", mode === "guia", () => setMode("guia"))}
              {seg("Surpreenda-me", mode === "surp", () => setMode("surp"))}
            </div>

            {mode === "surp" ? (
              <>
                {/* fichas de giro */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  {Array.from({ length: MAX_GIROS }).map((_, i) => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < spinsUsed ? "var(--border-strong)" : ACCENT }} />
                  ))}
                  <span style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginLeft: 2 }}>
                    {MAX_GIROS - spinsUsed > 0 ? `${MAX_GIROS - spinsUsed} ${MAX_GIROS - spinsUsed === 1 ? "giro" : "giros"}` : "sem giros"}
                  </span>
                </div>
                <div style={{ position: "relative", height: 192 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: 64, height: 64, borderTop: "1px solid var(--border-strong)", borderBottom: "1px solid var(--border-strong)", pointerEvents: "none", zIndex: 2 }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "7px solid var(--fg-subtle)" }} />
                    <div style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "7px solid var(--fg-subtle)" }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "var(--bg)", borderRadius: 14, border: "1px solid var(--border)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 24%, #000 76%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0, #000 24%, #000 76%, transparent 100%)" }}>
                    <div ref={reelRef} style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
                      {Array.from({ length: N * copies }).map((_, i) => {
                        const p = pool[i % N];
                        return (
                          <div key={i} style={{ height: rowH, display: "flex", alignItems: "center", gap: 13, padding: "0 12px" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: p.imagem_url ? `url(${p.imagem_url}) center/cover` : CARD2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{p.imagem_url ? "" : "🍸"}</div>
                            <span style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-subtle)" }}>{fmt(p.preco)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ minHeight: 22, margin: "14px 0 14px", textAlign: "center" }}>
                  {resultado
                    ? <><p style={{ margin: 0, fontSize: 12, color: "var(--fg-subtle)" }}>a casa arriscou</p><p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: ACCENT, letterSpacing: "-0.3px" }}>{resultado.nome}</p></>
                    : <p style={{ margin: 0, fontSize: 12, color: "var(--fg-subtle)" }}>a linha laranja é a sua sorte</p>}
                </div>
                {spinsUsed < MAX_GIROS && (
                  <button onClick={spin} disabled={spinning} style={{ width: "100%", padding: 14, border: "none", borderRadius: 999, background: ACCENT, color: "var(--accent-fg)", fontSize: 15, fontWeight: 800, cursor: spinning ? "wait" : "pointer", fontFamily: FONT, letterSpacing: "-0.2px" }}>
                    {spinning ? "Girando…" : spinsUsed === 0 ? "Girar" : "Usar o último giro"}
                  </button>
                )}
                {resultado && !spinning && (
                  <button onClick={() => onSelectProduto(resultado)} style={{ width: "100%", marginTop: 9, padding: 13, border: "1px solid var(--border-strong)", borderRadius: 999, background: "transparent", color: "var(--fg)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                    Pedir {resultado.nome} →
                  </button>
                )}
              </>
            ) : (
              <div>
                {step < VIBE_STEPS.length ? (
                  <>
                    <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px", textAlign: "center" }}>{VIBE_STEPS[step].q}</p>
                    {VIBE_STEPS[step].o.map((o) => (
                      <button key={o} onClick={() => { setPicks((prev) => { const n = [...prev]; n[step] = o; return n; }); setStep(step + 1); }}
                        style={{ width: "100%", textAlign: "left", padding: "13px 15px", border: "1px solid var(--border)", borderRadius: 13, background: "var(--bg)", color: "var(--fg)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginBottom: 8 }}>
                        {o}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--fg-subtle)" }}>Pra {(picks[0] ?? "").toLowerCase()}, {(picks[1] ?? "").toLowerCase()}:</p>
                    <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "var(--fg)" }}>A casa recomenda</p>
                    {recs.map((p) => (
                      <button key={p.id} onClick={() => onSelectProduto(p)} style={{ width: "100%", display: "flex", gap: 11, alignItems: "center", background: "var(--bg)", borderRadius: 13, padding: 12, marginBottom: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: p.imagem_url ? `url(${p.imagem_url}) center/cover` : CARD2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{p.imagem_url ? "" : "🍸"}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--fg)" }}>{p.nome}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--fg-subtle)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descricao ?? "sugestão da casa"}</p>
                        </div>
                      </button>
                    ))}
                    <button onClick={() => { setStep(0); setPicks([]); }} style={{ width: "100%", textAlign: "center", padding: 10, background: "none", border: "none", color: ACCENT, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Recomeçar</button>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 16 }}>
                  {[0, 1, 2].map((d) => <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: d <= step ? ACCENT : "var(--border-strong)" }} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top 5 mais pedidos (dado real das vendas) */}
        {topDrinks.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>Os mais pedidos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topDrinks.map((p, i) => (
                <button key={p.id} onClick={() => onSelectProduto(p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: CARD2, borderRadius: 14, padding: 12, border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: ACCENT, width: 22, flexShrink: 0, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: p.imagem_url ? `url(${p.imagem_url}) center/cover` : CARD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{p.imagem_url ? "" : "🍸"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</p>
                    {p.descricao && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--fg-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descricao}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chamar o garçom (ação real → chamadas) */}
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--fg-subtle)", textAlign: "center" }}>Tá com dúvida ou precisa de algo?</p>
        <button
          onClick={() => {
            if (chamando || chamado) return;
            setChamando(true); setChamarErro(null);
            chamarAtendimento(mesaId, barId).then((r) => {
              setChamando(false);
              if ("ok" in r) setChamado(true);
              else setChamarErro(r.error);
            });
          }}
          disabled={chamando}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 16, borderRadius: 999, border: "none", background: chamado ? "color-mix(in srgb, var(--ok) 14%, transparent)" : ACCENT, color: chamado ? "var(--ok)" : "var(--accent-fg)", fontSize: 15, fontWeight: 700, cursor: chamando ? "wait" : "pointer", fontFamily: FONT, opacity: chamando ? 0.7 : 1, transition: "opacity 160ms" }}
        >
          {chamado ? (
            <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Garçom a caminho</>
          ) : chamando ? "Chamando…" : (
            <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg> Chamar o garçom</>
          )}
        </button>
        {chamarErro && <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--fg-subtle)", textAlign: "center" }}>{chamarErro}</p>}

      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function MenuApp({
  bar,
  mesa,
  cardapio,
  topPedidos = [],
  destaques = [],
  comandaId,
  autoPedido = true,
  initialNome,
}: {
  bar: Bar;
  mesa: Mesa;
  cardapio: CategoriaComProdutos[];
  topPedidos?: string[];
  destaques?: Destaque[];
  comandaId?: string;        // presente no fluxo do QR → grava no modelo real
  autoPedido?: boolean;      // false = navega mas não pede (só leitura)
  initialNome?: string;      // nome vindo da comanda aberta → pula splash/welcome
}) {
  const [screen, setScreen] = useState<Screen>(initialNome ? "home" : "splash");
  const [cliente, setCliente] = useState<ClienteLocal | null>(
    initialNome ? { nome: initialNome, visitas: 1, ultimaVisita: new Date().toISOString() } : null,
  );
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaComProdutos | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState(false);

  const allProdutos = cardapio.flatMap((c) => c.produtos);

  useEffect(() => {
    if (initialNome) return;               // no QR o nome já veio da comanda
    const stored = readCliente(bar.slug);
    if (stored) setCliente(stored);
  }, [bar.slug, initialNome]);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const handleSplashNext = useCallback(() => {
    if (cliente) {
      const updated = { ...cliente, visitas: cliente.visitas + 1, ultimaVisita: new Date().toISOString() };
      setCliente(updated);
      writeCliente(bar.slug, updated);
      setScreen("home");
    } else {
      setScreen("welcome-new");
    }
  }, [cliente, bar.slug]);

  const handleNomeConfirm = (nome: string) => {
    const novo: ClienteLocal = { nome, visitas: 1, ultimaVisita: new Date().toISOString() };
    setCliente(novo);
    writeCliente(bar.slug, novo);
    setScreen("home");
  };

  const handleAddToCart = (produto: Produto, qty: number) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.produto.id === produto.id);
      if (exists) return prev.map((i) => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + qty } : i);
      return [...prev, { produto, quantidade: qty }];
    });
    if (cliente) {
      const updated = { ...cliente, ultimoProdutoId: produto.id };
      setCliente(updated);
      writeCliente(bar.slug, updated);
    }
    showToast();
    setScreen("products");
  };

  const cartCount = cart.reduce((acc, i) => acc + i.quantidade, 0);

  const ultimoProduto = cliente?.ultimoProdutoId
    ? (allProdutos.find((p) => p.id === cliente.ultimoProdutoId) ?? null)
    : null;

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", fontFamily: FONT }}>
      <Toast visible={toast} />

      {screen === "splash" && (
        <SplashScreen bar={bar} onNext={handleSplashNext} />
      )}
      {screen === "welcome-new" && (
        <WelcomeNewScreen bar={bar} onConfirm={handleNomeConfirm} />
      )}
      {screen === "home" && (
        <HomeScreen
          cliente={cliente}
          mesaLabel={mesa.nome ?? `Mesa ${mesa.numero}`}
          barId={bar.id}
          mesaId={mesa.id}
          cardapio={cardapio}
          allProdutos={allProdutos}
          ultimoProduto={ultimoProduto}
          topPedidos={topPedidos}
          destaques={destaques}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
          onSelectCategoria={(cat) => { setSelectedCategoria(cat); setScreen("products"); }}
          onSelectProduto={(p) => {
            setSelectedProduto(p);
            const cat = cardapio.find((c) => c.id === p.categoria_id);
            if (cat) setSelectedCategoria(cat);
            setScreen("product-detail");
          }}
        />
      )}
      {screen === "categories" && (
        <CategoriesScreen
          cardapio={cardapio}
          onSelect={(cat) => { setSelectedCategoria(cat); setScreen("products"); }}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
          onPedirConta={() => setScreen("pedir-conta")}
        />
      )}
      {screen === "products" && selectedCategoria && (
        <ProductsScreen
          categoria={selectedCategoria}
          allCategorias={cardapio}
          onSelect={(p) => { setSelectedProduto(p); setScreen("product-detail"); }}
          onBack={() => setScreen("home")}
          onSwitchCategoria={(cat) => setSelectedCategoria(cat)}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
        />
      )}
      {screen === "product-detail" && selectedProduto && (
        <ProductDetailScreen
          produto={selectedProduto}
          onBack={() => setScreen(selectedCategoria ? "products" : "categories")}
          onAdd={handleAddToCart}
          cartCount={cartCount}
          onCart={() => setScreen("cart")}
          autoPedido={autoPedido}
        />
      )}
      {screen === "cart" && (
        <CartScreen
          cliente={cliente}
          cart={cart}
          bar={bar}
          mesa={mesa}
          comandaId={comandaId}
          onBack={() => setScreen(selectedCategoria ? "products" : "categories")}
          onPedidoEnviado={() => {
            setCart([]);
            setScreen("home");
          }}
        />
      )}
      {screen === "pedir-conta" && (
        <PedirContaScreen
          bar={bar}
          mesa={mesa}
          onConfirm={() => setScreen("conta-solicitada")}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "conta-solicitada" && (
        <ContaSolicitadaScreen mesa={mesa} />
      )}
    </div>
  );
}
