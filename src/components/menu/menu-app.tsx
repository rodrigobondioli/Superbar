"use client";

import { useState, useEffect } from "react";
import { submeterPedido } from "@/lib/menu/actions";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

type CategoriaComProdutos = Categoria & { produtos: Produto[] };

type Screen =
  | "splash"
  | "welcome-new"
  | "welcome-back"
  | "categories"
  | "products"
  | "product-detail"
  | "cart";

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
const ACCENT = "#260078";
const BG     = "#0c0c0c";
const CARD   = "#181818";
const CARD2  = "#222222";
const FONT   = "var(--font-geist, -apple-system, 'Helvetica Neue', sans-serif)";

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
function SplashScreen({ bar, onNext }: { bar: Bar; onNext: () => void }) {
  const DURATION = 2800;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const p = Math.min((Date.now() - start) / DURATION, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onNext();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onNext]);

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
          fontSize: 44, fontWeight: 900, color: "white",
          margin: 0, lineHeight: 0.95,
          letterSpacing: "-1.5px",
          fontFamily: FONT,
        }}>
          {bar.nome}
        </h1>
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.35)",
          margin: "18px 0 0", lineHeight: 1.6, fontFamily: FONT,
        }}>
          Mesa pronta. Cardápio a caminho.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 52, left: 48, right: 48,
        height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 99,
      }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: ACCENT,
          width: `${progress * 100}%`,
          transition: "width 60ms linear",
          boxShadow: `0 0 10px ${ACCENT}66`,
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
      padding: "72px 28px 52px",
      justifyContent: "space-between",
      fontFamily: FONT,
    }}>
      <div>
        <p style={{ fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", margin: "0 0 22px" }}>
          {bar.nome}
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
          Antes de começar,<br />como posso te chamar?
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.65 }}>
          Vou lembrar de você nas próximas visitas.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valid && onConfirm(nome.trim())}
          placeholder="Seu nome"
          style={{
            background: CARD2,
            border: `1.5px solid ${valid ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 16,
            padding: "20px 22px",
            fontSize: 20, fontWeight: 500,
            color: "white", outline: "none",
            colorScheme: "dark",
            width: "100%", boxSizing: "border-box",
            transition: "border-color 200ms",
            fontFamily: FONT,
          }}
        />
        <button
          onClick={() => valid && onConfirm(nome.trim())}
          style={{
            background: valid ? ACCENT : "rgba(255,255,255,0.05)",
            color: valid ? "white" : "rgba(255,255,255,0.18)",
            border: "none", borderRadius: 16,
            padding: "20px", fontSize: 16, fontWeight: 800,
            cursor: valid ? "pointer" : "default",
            transition: "all 250ms",
            letterSpacing: "-0.3px", fontFamily: FONT,
          }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ─── WELCOME BACK ─────────────────────────────────────────────────────────────
function WelcomeBackScreen({
  cliente,
  ultimoProduto,
  allProdutos,
  onContinue,
  onRepeat,
}: {
  cliente: ClienteLocal;
  ultimoProduto: Produto | null;
  allProdutos: Produto[];
  onContinue: () => void;
  onRepeat: (produto: Produto) => void;
}) {
  const sugestoes = allProdutos
    .filter((p) => p.ativo && p.imagem_url && p.id !== ultimoProduto?.id)
    .slice(0, 4);

  return (
    <div style={{
      height: "100%", background: BG,
      display: "flex", flexDirection: "column",
      overflow: "auto", fontFamily: FONT,
    }}>
      {/* Greeting */}
      <div style={{ padding: "68px 28px 32px" }}>
        <p style={{ fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", margin: "0 0 18px" }}>
          De volta!
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "white", margin: "0 0 10px", lineHeight: 1.0, letterSpacing: "-0.8px" }}>
          Boa noite,<br />{cliente.nome} 🥃
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
          {cliente.visitas <= 1
            ? "Primeira vez aqui. Que bom ter você!"
            : `${ordinal(cliente.visitas)} visita — você faz parte da família.`}
        </p>
      </div>

      {/* Last order */}
      {ultimoProduto && (
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", margin: "0 0 10px 2px", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
            Da última vez
          </p>
          <div style={{
            background: CARD, borderRadius: 20, overflow: "hidden",
            display: "flex", alignItems: "stretch",
            border: "1px solid rgba(200,255,0,0.1)",
          }}>
            <div style={{ flex: 1, padding: "18px 16px 18px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 4px", lineHeight: 1.2 }}>{ultimoProduto.nome}</p>
              <p style={{ fontSize: 15, color: ACCENT, margin: "0 0 16px", fontWeight: 800 }}>{fmt(ultimoProduto.preco)}</p>
              <button
                onClick={() => onRepeat(ultimoProduto)}
                style={{
                  background: ACCENT, color: "white", border: "none",
                  borderRadius: 10, padding: "9px 16px",
                  fontSize: 13, fontWeight: 800, cursor: "pointer",
                  alignSelf: "flex-start", fontFamily: FONT,
                }}
              >
                De novo →
              </button>
            </div>
            {ultimoProduto.imagem_url && (
              <div style={{ width: 110, flexShrink: 0 }}>
                <img
                  src={ultimoProduto.imagem_url}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  alt={ultimoProduto.nome}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sugestões */}
      {sugestoes.length > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", margin: "0 0 10px 2px", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
            Você pode gostar
          </p>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {sugestoes.map((p) => (
              <button
                key={p.id}
                onClick={() => onRepeat(p)}
                style={{
                  flexShrink: 0, width: 130,
                  background: CARD, border: "none",
                  borderRadius: 16, overflow: "hidden",
                  cursor: "pointer", textAlign: "left", padding: 0,
                }}
              >
                {p.imagem_url && (
                  <img
                    src={p.imagem_url}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    style={{ width: "100%", height: 88, objectFit: "cover", display: "block" }}
                    alt={p.nome}
                  />
                )}
                <div style={{ padding: "10px 12px 13px" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "white", margin: "0 0 3px", lineHeight: 1.3, fontFamily: FONT }}>{p.nome}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: ACCENT, margin: 0, fontFamily: FONT }}>{fmt(p.preco)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "8px 20px 52px", marginTop: "auto" }}>
        <button
          onClick={onContinue}
          style={{
            width: "100%", background: ACCENT, color: "white",
            border: "none", borderRadius: 16, padding: "20px",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            letterSpacing: "-0.3px", fontFamily: FONT,
          }}
        >
          Ver cardápio completo →
        </button>
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
}: {
  cardapio: CategoriaComProdutos[];
  onSelect: (cat: CategoriaComProdutos) => void;
  cartCount: number;
  onCart: () => void;
}) {
  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: "60px 24px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.1, letterSpacing: "-0.6px" }}>
          Qual vai ser a<br />boa de hoje?
        </h1>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              background: ACCENT, color: "white", border: "none", borderRadius: 99,
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
      <div style={{ flex: 1, overflow: "hidden", padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        {cardapio.map((cat) => {
          const coverImg = cat.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              style={{
                flex: 1, position: "relative", borderRadius: 22,
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
                background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
              }} />
              <div style={{
                position: "relative", height: "100%",
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", padding: "16px 18px",
              }}>
                <div>
                  <span style={{ fontSize: 21, fontWeight: 800, color: "white", display: "block", letterSpacing: "-0.4px" }}>
                    {cat.nome}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3, display: "block" }}>
                    {cat.produtos.length} {cat.produtos.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
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
          background: "linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.45) 55%, rgba(12,12,12,0.15) 100%)",
        }} />
        <button
          onClick={onBack}
          style={{
            position: "absolute", top: 54, left: 16,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
            border: "none", borderRadius: 99, padding: "8px 16px",
            color: "white", fontSize: 13, fontWeight: 500,
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
              background: ACCENT, color: "white",
              border: "none", borderRadius: 99, padding: "8px 18px",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT,
            }}
          >
            🛒 {cartCount}
          </button>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.8px", lineHeight: 1 }}>
            {categoria.nome}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "5px 0 0" }}>
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
                borderRadius: 99,
                border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
                background: active ? ACCENT : "rgba(255,255,255,0.04)",
                color: active ? "white" : "rgba(255,255,255,0.5)",
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
              background: CARD, border: "none", borderRadius: 18,
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
              <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: "0 0 5px", lineHeight: 1.3 }}>
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
}: {
  produto: Produto;
  onBack: () => void;
  onAdd: (produto: Produto, qty: number) => void;
  cartCount: number;
  onCart: () => void;
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
          background: "linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.2) 60%, transparent)",
        }} />
        <button
          onClick={onBack}
          style={{
            position: "absolute", top: 52, left: 20,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
            border: "none", borderRadius: 99, padding: "9px 16px",
            color: "white", fontSize: 13, cursor: "pointer", fontFamily: FONT,
          }}
        >
          ← Voltar
        </button>
        {cartCount > 0 && (
          <button
            onClick={onCart}
            style={{
              position: "absolute", top: 52, right: 20,
              background: ACCENT, border: "none", borderRadius: 99,
              padding: "9px 16px", color: "white",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT,
            }}
          >
            🛒 {cartCount}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 24px 160px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-0.5px" }}>
          {produto.nome}
        </h1>
        {produto.descricao && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.7 }}>
            {produto.descricao}
          </p>
        )}
        <p style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "0 0 32px", letterSpacing: "-0.5px" }}>
          {fmt(produto.preco)}
        </p>

        {/* Qty picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Quantidade</span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 42, height: 42, borderRadius: "50%",
                background: CARD2, border: "none", color: "white", fontSize: 22,
                cursor: qty > 1 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: qty > 1 ? 1 : 0.3, fontFamily: FONT,
              }}
            >−</button>
            <span style={{ fontSize: 22, fontWeight: 800, color: "white", minWidth: 28, textAlign: "center" }}>{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{
                width: 42, height: 42, borderRadius: "50%",
                background: ACCENT, border: "none", color: "white", fontSize: 22,
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
            flex: 1, padding: "17px", borderRadius: 16,
            background: CARD, border: "none",
            color: "rgba(255,255,255,0.55)",
            fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          }}
        >
          Voltar
        </button>
        <button
          onClick={() => onAdd(produto, qty)}
          style={{
            flex: 2.5, padding: "17px", borderRadius: 16,
            background: ACCENT, border: "none", color: "white",
            fontSize: 15, fontWeight: 900, cursor: "pointer",
            letterSpacing: "-0.3px", fontFamily: FONT,
          }}
        >
          Pedir agora · {fmt(produto.preco * qty)}
        </button>
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
  onBack,
  onPedidoEnviado,
}: {
  cliente: ClienteLocal | null;
  cart: CartItem[];
  bar: Bar;
  mesa: Mesa;
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
          width: 88, height: 88, borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
          border: `2px solid ${ACCENT}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 38, marginBottom: 28,
        }}>
          ✓
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", margin: "0 0 12px", letterSpacing: "-0.5px" }}>
          Pedido enviado!
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.7 }}>
          O bartender já recebeu.<br />
          Relaxa que vem aí.
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 40 }}>
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
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 22, display: "block", fontFamily: FONT }}
        >
          ← Continuar pedindo
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ACCENT}, #80e000)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 21, fontWeight: 900, color: "white", flexShrink: 0,
          }}>
            {cliente?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
              Olá, {cliente?.nome ?? "você"}
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>
              {cliente && cliente.visitas > 1
                ? `${ordinal(cliente.visitas)} visita · ${mesaLabel}`
                : mesaLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 18px", fontWeight: 600 }}>
          Sua consumação
        </p>
        {cart.map((item) => (
          <div key={item.produto.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            {item.produto.imagem_url ? (
              <img
                src={item.produto.imagem_url}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                style={{ width: 54, height: 54, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                alt={item.produto.nome}
              />
            ) : (
              <div style={{ width: 54, height: 54, borderRadius: 12, background: CARD2, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0, lineHeight: 1.3 }}>
                {item.quantidade > 1 && (
                  <span style={{ color: ACCENT, fontWeight: 800, marginRight: 6 }}>{item.quantidade}×</span>
                )}
                {item.produto.nome}
              </p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0, flexShrink: 0 }}>
              {fmt(item.produto.preco * item.quantidade)}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px 44px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Total a pagar</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.8px" }}>{fmt(total)}</span>
        </div>
        {error && (
          <p style={{ fontSize: 12, color: "#ff6b6b", textAlign: "center", margin: "0 0 12px" }}>
            {error}
          </p>
        )}
        <button
          onClick={handleEnviar}
          disabled={submitting}
          style={{
            width: "100%", padding: "20px", borderRadius: 16,
            background: submitting ? "rgba(38,0,120,0.50)" : ACCENT,
            border: "none", color: "white",
            fontSize: 16, fontWeight: 900,
            cursor: submitting ? "default" : "pointer",
            letterSpacing: "-0.3px", fontFamily: FONT,
            transition: "background 200ms",
          }}
        >
          {submitting ? "Enviando..." : "Fazer pedido →"}
        </button>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center", margin: "14px 0 0" }}>
          O bartender recebe o pedido na hora
        </p>
      </div>
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
      background: ACCENT, color: "white",
      padding: "10px 22px", borderRadius: 99,
      fontSize: 13, fontWeight: 800,
      zIndex: 200, pointerEvents: "none",
      whiteSpace: "nowrap", fontFamily: FONT,
    }}>
      🔥 Adicionado!
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function MenuApp({
  bar,
  mesa,
  cardapio,
}: {
  bar: Bar;
  mesa: Mesa;
  cardapio: CategoriaComProdutos[];
}) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [cliente, setCliente] = useState<ClienteLocal | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaComProdutos | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState(false);

  const allProdutos = cardapio.flatMap((c) => c.produtos);

  useEffect(() => {
    const stored = readCliente(bar.slug);
    if (stored) setCliente(stored);
  }, [bar.slug]);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const handleSplashNext = () => {
    if (cliente) {
      const updated = { ...cliente, visitas: cliente.visitas + 1, ultimaVisita: new Date().toISOString() };
      setCliente(updated);
      writeCliente(bar.slug, updated);
      setScreen("welcome-back");
    } else {
      setScreen("welcome-new");
    }
  };

  const handleNomeConfirm = (nome: string) => {
    const novo: ClienteLocal = { nome, visitas: 1, ultimaVisita: new Date().toISOString() };
    setCliente(novo);
    writeCliente(bar.slug, novo);
    setScreen("categories");
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
      {screen === "welcome-back" && cliente && (
        <WelcomeBackScreen
          cliente={cliente}
          ultimoProduto={ultimoProduto}
          allProdutos={allProdutos}
          onContinue={() => setScreen("categories")}
          onRepeat={(p) => {
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
        />
      )}
      {screen === "products" && selectedCategoria && (
        <ProductsScreen
          categoria={selectedCategoria}
          allCategorias={cardapio}
          onSelect={(p) => { setSelectedProduto(p); setScreen("product-detail"); }}
          onBack={() => setScreen("categories")}
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
        />
      )}
      {screen === "cart" && (
        <CartScreen
          cliente={cliente}
          cart={cart}
          bar={bar}
          mesa={mesa}
          onBack={() => setScreen(selectedCategoria ? "products" : "categories")}
          onPedidoEnviado={() => {
            setCart([]);
            setScreen("categories");
          }}
        />
      )}
    </div>
  );
}
