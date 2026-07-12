"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { submeterPedido, pedirConta } from "@/lib/menu/actions";
import { criarPedidoCliente } from "@/lib/mesa/actions";
import { createClient } from "@/lib/supabase/client";
import { chamarAtendimento } from "@/lib/mesa/actions";
import type { Bar, Mesa, Categoria, Produto, Destaque } from "@/types/database";
import { formatBRL } from "@/lib/format";

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
  | "consumacao"
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
// Overlay padrão sobre imagens (gradiente de baixo p/ cima). ~10% mais fraco que antes.
const IMG_OVERLAY = "linear-gradient(to top, color-mix(in srgb, var(--bg) 80%, transparent) 0%, color-mix(in srgb, var(--bg) 14%, transparent) 55%, transparent 100%)";

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

const fmt = formatBRL;

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
                background: IMG_OVERLAY,
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
  esgotados,
  onSelect,
  onBack,
  onSwitchCategoria,
  cartCount,
  onCart,
}: {
  categoria: CategoriaComProdutos;
  allCategorias: CategoriaComProdutos[];
  esgotados: Set<string>;
  onSelect: (p: Produto) => void;
  onBack: () => void;
  onSwitchCategoria: (cat: CategoriaComProdutos) => void;
  cartCount: number;
  onCart: () => void;
}) {
  const ativos = categoria.produtos.filter((p) => p.ativo);

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", fontFamily: FONT }}>

      {/* Header limpo (sem foto-hero redundante) */}
      <div style={{ flexShrink: 0, padding: "52px 16px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: "color-mix(in srgb, var(--fg) 6%, transparent)",
              border: "1px solid var(--border)", borderRadius: 999, padding: "8px 16px",
              color: "var(--fg)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
            }}
          >
            ← Voltar
          </button>
          {cartCount > 0 && (
            <button
              onClick={onCart}
              style={{ background: ACCENT, color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}
            >
              🛒 {cartCount}
            </button>
          )}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--fg)", margin: 0, letterSpacing: "-0.6px", lineHeight: 1.05 }}>
          {categoria.nome}
        </h1>
        <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "5px 0 0" }}>
          {ativos.length} {ativos.length === 1 ? "opção" : "opções"}
        </p>
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
                flexShrink: 0, padding: "8px 16px",
                borderRadius: 999,
                border: active ? "none" : "1px solid var(--border)",
                background: active ? ACCENT : "transparent",
                color: active ? "var(--accent-fg)" : "var(--fg-muted)",
                fontSize: 13, fontWeight: active ? 800 : 600,
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
        display: "flex", flexDirection: "column", gap: 10,
        padding: "6px 16px 60px",
      }}>
        {ativos.map((produto) => {
          const esg = esgotados.has(produto.id);
          return (
            <button
              key={produto.id}
              onClick={() => onSelect(produto)}
              style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                background: CARD2, borderRadius: 16, padding: 10, border: "none",
                cursor: "pointer", textAlign: "left", fontFamily: FONT, opacity: esg ? 0.55 : 1,
              }}
            >
              <div style={{ width: 78, height: 78, borderRadius: 16, flexShrink: 0, background: produto.imagem_url ? `url(${produto.imagem_url}) center/cover` : CARD, filter: esg ? "grayscale(1)" : "none" }} />
              <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px", lineHeight: 1.25 }}>
                  {produto.nome}
                </p>
                {esg ? (
                  <p style={{ margin: "5px 0 0", fontSize: 11, fontWeight: 800, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Esgotado</p>
                ) : produto.descricao && (
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {produto.descricao}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductDetailScreen({
  produto,
  categoriaNome,
  esgotado = false,
  onBack,
  onPedir,
  pedindo = false,
  pedidoErro,
  autoPedido = true,
}: {
  produto: Produto;
  categoriaNome?: string;
  esgotado?: boolean;
  onBack: () => void;
  onPedir: (produto: Produto, qty: number) => void;
  pedindo?: boolean;
  pedidoErro?: string | null;
  autoPedido?: boolean;
}) {
  const [qty, setQty] = useState(1);

  // Descrição no formato "(nota de sabor) ingredientes" → separa as duas partes.
  const desc = (produto.descricao ?? "").trim();
  const m = desc.match(/^\(([^)]+)\)\s*([\s\S]*)$/);
  const flavor = m ? m[1].trim() : null;
  const ingredientes = (m ? m[2] : desc).trim();
  // Quebra a nota de sabor em tags tipo hashtag (cítrico, azedo, amargo…)
  const flavorTags = flavor
    ? flavor.split(/,| e | · |\/|\+/i).map((s) => s.trim().replace(/^levemente\s+/i, "")).filter(Boolean)
    : [];

  const catN = (categoriaNome ?? "").toLowerCase();
  const semAlcool = catN.includes("mockt") || catN.includes("sem álc") || catN.includes("nao alc") || catN.includes("não alc") || catN.includes("alcoó") && (catN.includes("nao") || catN.includes("não"));
  const tag = catN.includes("autoral") ? "Autoral"
    : (catN.includes("classic") || catN.includes("coquetel")) ? "Clássico"
    : semAlcool ? "Sem álcool" : null;

  const stat = (label: string, value: string) => (
    <div key={label} style={{ flex: 1, minWidth: 0, background: CARD2, borderRadius: 16, padding: "12px 14px" }}>
      <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>{value}</p>
    </div>
  );
  const stats = [
    semAlcool ? stat("Teor", "Sem álcool") : null,   // "Alcoólico" é óbvio num bar — não vira chip
    produto.tempo_preparo ? stat("Preparo", `${produto.tempo_preparo} min`) : null,
    produto.calorias ? stat("Calorias", `${produto.calorias} kcal`) : null,
  ].filter(Boolean);

  return (
    <div style={{ height: "100%", background: BG, overflow: "auto", fontFamily: FONT }}>
      {/* Hero — funde no conteúdo */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 400, background: produto.imagem_url ? `url(${produto.imagem_url}) center/cover` : CARD2 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 2%, transparent 42%)" }} />
        <button
          onClick={onBack}
          aria-label="Voltar"
          style={{
            position: "absolute", top: 14, left: 12,
            background: "color-mix(in srgb, var(--bg) 55%, transparent)", backdropFilter: "blur(6px)",
            border: "1px solid var(--border)", borderRadius: 999,
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--fg)", fontSize: 19, cursor: "pointer", fontFamily: FONT,
          }}
        >
          ←
        </button>
      </div>

      {/* Content */}
      <div style={{ position: "relative", marginTop: -34, padding: "0 22px 170px" }}>
        {(tag || flavorTags.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {tag && <span style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent-bright)", fontSize: 11, fontWeight: 800, padding: "5px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>{tag}</span>}
            {flavorTags.map((t) => (
              <span key={t} style={{ background: CARD2, color: "var(--fg-muted)", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999 }}>#{t.toLowerCase()}</span>
            ))}
          </div>
        )}
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--fg)", margin: "0 0 14px", lineHeight: 1.02, letterSpacing: "-0.6px" }}>
          {produto.nome}
        </h1>

        {ingredientes && (
          <>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No copo</p>
            <p style={{ fontSize: 14.5, color: "var(--fg-muted)", margin: "0 0 22px", lineHeight: 1.7 }}>{ingredientes}</p>
          </>
        )}

        {stats.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>{stats}</div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "0 0 18px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preço</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "var(--fg)", margin: 0, letterSpacing: "-0.5px" }}>{fmt(produto.preco)}</p>
          </div>
          {autoPedido && !esgotado && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos" style={{ width: 40, height: 40, borderRadius: 999, background: CARD2, border: "none", color: "var(--fg)", fontSize: 21, cursor: qty > 1 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: qty > 1 ? 1 : 0.35, fontFamily: FONT }}>−</button>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", minWidth: 22, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Mais" style={{ width: 40, height: 40, borderRadius: 999, background: ACCENT, border: "none", color: "var(--accent-fg)", fontSize: 21, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>+</button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 20px 34px",
        background: `linear-gradient(to top, ${BG} 68%, transparent)`,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {pedidoErro && (
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--danger)", textAlign: "center" }}>{pedidoErro}</p>
        )}
        {esgotado ? (
          <div
            style={{
              padding: "17px", borderRadius: 999,
              background: CARD2, color: "var(--fg-subtle)",
              fontSize: 14, fontWeight: 800, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em",
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT,
            }}
          >
            Esgotado
          </div>
        ) : autoPedido ? (
          <button
            onClick={() => onPedir(produto, qty)}
            disabled={pedindo}
            style={{
              padding: "17px", borderRadius: 999,
              background: ACCENT, border: "none", color: "var(--accent-fg)",
              fontSize: 15, fontWeight: 900, cursor: pedindo ? "wait" : "pointer",
              letterSpacing: "-0.3px", fontFamily: FONT, opacity: pedindo ? 0.7 : 1,
            }}
          >
            {pedindo ? "Enviando…" : `Quero esse drink · ${fmt(produto.preco * qty)}`}
          </button>
        ) : (
          <div
            style={{
              padding: "17px", borderRadius: 999,
              background: CARD2, color: "var(--fg-muted)",
              fontSize: 14, fontWeight: 700, textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT,
            }}
          >
            Peça no balcão
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
                loading="lazy"
                decoding="async"
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
      transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms cubic-bezier(0.22, 1, 0.36, 1)",
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
            <p style={{ margin: 0, fontSize: 12, color: "var(--fg-subtle)" }}>{(() => { const h = new Date().getHours(); return h < 12 ? "Bom dia," : h < 18 ? "Boa tarde," : "Boa noite,"; })()}</p>
            <p style={{ margin: "1px 0 0", fontSize: 17, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.3px" }}>{cliente?.nome ?? "você"}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Mesa</p>
              <p style={{ margin: "1px 0 0", fontSize: 14, fontWeight: 700, color: "var(--fg-muted)" }}>{mesaLabel.replace(/\D/g, "") || mesaLabel}</p>
            </div>
            <button onClick={onCart} aria-label="Minha conta" title="Minha conta" style={{ background: CARD2, border: "none", borderRadius: 999, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg)", cursor: "pointer", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>
            </button>
          </div>
        </div>

        {/* Pedir de novo (último pedido) */}
        {ultimoProduto && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Da última vez</p>
            <button onClick={() => onSelectProduto(ultimoProduto)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: CARD2, borderRadius: 16, padding: 12, border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: ultimoProduto.imagem_url ? `url(${ultimoProduto.imagem_url}) center/cover` : CARD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>{ultimoProduto.imagem_url ? "" : "🍸"}</div>
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
                style={{ overflow: "hidden", borderRadius: 16, touchAction: "pan-y" }}>
                <div style={{ display: "flex", transform: `translateX(calc(${-cur * 100}% + ${heroDrag}px))`, transition: heroDragging ? "none" : "transform 360ms cubic-bezier(0.22, 0.61, 0.36, 1)", willChange: "transform" }}>
                  {heroItems.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { if (heroDragRef.current.moved) { heroDragRef.current.moved = false; return; } h.onClick(); }}
                      style={{ flex: "0 0 100%", position: "relative", minHeight: 240, border: "none", padding: 0, cursor: "pointer", background: h.imagem ? `url(${h.imagem}) center/cover` : CARD, display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "left" }}>
                      <div style={{ position: "absolute", inset: 0, background: IMG_OVERLAY }} />
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
                    <div style={{ position: "relative", width: "55%", flexShrink: 0, aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden", background: cover ? `url(${cover}) center/cover` : CARD2 }}>
                      <div style={{ position: "absolute", inset: 0, background: IMG_OVERLAY }} />
                    </div>
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

              <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px" }}>Categorias <span style={{ color: "var(--fg-subtle)", fontWeight: 700 }}>({grid.length})</span></p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {grid.map((cat) => {
                  const cover = cat.imagem_url ?? cat.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
                  return (
                    <button key={cat.id} onClick={() => onSelectCategoria(cat)} style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "none", padding: 0, background: cover ? `url(${cover}) center/cover` : CARD2 }}>
                      <div style={{ position: "absolute", inset: 0, background: IMG_OVERLAY }} />
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
          <div style={{ background: CARD2, borderRadius: 24, padding: "18px 16px", marginBottom: 24 }}>
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
                    {/* impeccable-disable-next-line side-tab -- seta CSS (triângulo border-hack), não aba de card */}
                    <div style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "7px solid var(--fg-subtle)" }} />
                    {/* impeccable-disable-next-line side-tab -- seta CSS (triângulo border-hack), não aba de card */}
                    <div style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "7px solid var(--fg-subtle)" }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "var(--bg)", borderRadius: 16, border: "1px solid var(--border)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 24%, #000 76%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0, #000 24%, #000 76%, transparent 100%)" }}>
                    <div ref={reelRef} style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
                      {Array.from({ length: N * copies }).map((_, i) => {
                        const p = pool[i % N];
                        return (
                          <div key={i} style={{ height: rowH, display: "flex", alignItems: "center", gap: 13, padding: "0 12px" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 16, background: p.imagem_url ? `url(${p.imagem_url}) center/cover` : CARD2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{p.imagem_url ? "" : "🍸"}</div>
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
                        style={{ width: "100%", textAlign: "left", padding: "13px 15px", border: "1px solid var(--border)", borderRadius: 16, background: "var(--bg)", color: "var(--fg)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginBottom: 8 }}>
                        {o}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--fg-subtle)" }}>Pra {(picks[0] ?? "").toLowerCase()}, {(picks[1] ?? "").toLowerCase()}:</p>
                    <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "var(--fg)" }}>A casa recomenda</p>
                    {recs.map((p) => (
                      <button key={p.id} onClick={() => onSelectProduto(p)} style={{ width: "100%", display: "flex", gap: 11, alignItems: "center", background: "var(--bg)", borderRadius: 16, padding: 12, marginBottom: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                        <div style={{ width: 42, height: 42, borderRadius: 8, background: p.imagem_url ? `url(${p.imagem_url}) center/cover` : CARD2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{p.imagem_url ? "" : "🍸"}</div>
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
                <button key={p.id} onClick={() => onSelectProduto(p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: CARD2, borderRadius: 16, padding: 12, border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: ACCENT, width: 22, flexShrink: 0, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: p.imagem_url ? `url(${p.imagem_url}) center/cover` : CARD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{p.imagem_url ? "" : "🍸"}</div>
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

// ─── CONSUMAÇÃO (conta corrente em tempo real) ────────────────────────────────
function ConsumacaoScreen({
  comandaId, nomeCliente, mesaLabel, barId, mesaId, justOrdered, pedidoErro, onSeguir,
}: {
  comandaId?: string;
  nomeCliente?: string | null;
  mesaLabel: string;
  barId: string;
  mesaId: string;
  justOrdered: boolean;
  pedidoErro?: string | null;
  onSeguir: () => void;
}) {
  const [itens, setItens] = useState<{ id: string; nome: string; varianteNome: string | null; precoTotal: number }[]>([]);
  const [chamando, setChamando] = useState(false);

  const carregar = useCallback(async () => {
    if (!comandaId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("comanda_items")
      .select("id, preco_total, variante_nome, produtos(nome)")
      .eq("comanda_id", comandaId)
      .eq("status", "ativo")
      .order("adicionado_em", { ascending: true });
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItens(data.map((i: any) => ({ id: i.id, nome: i.produtos?.nome ?? "Produto", varianteNome: i.variante_nome ?? null, precoTotal: i.preco_total })));
    }
  }, [comandaId]);

  useEffect(() => {
    carregar();
    if (!comandaId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`consumo_${comandaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comanda_items", filter: `comanda_id=eq.${comandaId}` }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [comandaId, carregar]);

  const chamar = async () => {
    if (chamando) return;
    setChamando(true);
    await chamarAtendimento(mesaId, barId);
    setTimeout(() => setChamando(false), 4000);
  };

  const total = itens.reduce((s, i) => s + i.precoTotal, 0);

  return (
    <div style={{ height: "100%", background: BG, display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ flexShrink: 0, padding: "52px 22px 16px" }}>
        <button onClick={onSeguir} aria-label="Voltar" style={{ background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "1px solid var(--border)", borderRadius: 999, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg)", fontSize: 19, cursor: "pointer", marginBottom: 14, fontFamily: FONT }}>←</button>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.5px" }}>Sua consumação</h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--fg-muted)" }}>
          {nomeCliente ? <><span style={{ fontWeight: 700, color: "var(--fg)" }}>{nomeCliente}</span> · {mesaLabel}</> : mesaLabel}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 120px" }}>
        {justOrdered && (
          <div style={{ background: "color-mix(in srgb, var(--ok) 16%, var(--bg))", border: "1px solid var(--ok)", color: "var(--ok)", borderRadius: 16, padding: "14px 16px", fontSize: 14, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            Pedido enviado — já foi pro bar!
          </div>
        )}
        {pedidoErro && !justOrdered && (
          <div style={{ background: "var(--bg-card-hi, #242426)", border: "1px solid var(--danger)", color: "var(--fg)", borderRadius: 16, padding: "12px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>{pedidoErro}</div>
        )}

        {itens.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 30, margin: "0 0 10px" }}>🍸</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Nada por aqui ainda</p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Seus pedidos aparecem aqui em tempo real.</p>
          </div>
        ) : (
          <>
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {itens.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--fg)" }}>{item.nome}{item.varianteNome && <span style={{ color: "var(--fg-subtle)" }}> — {item.varianteNome}</span>}</p>
                  <p style={{ margin: 0, marginLeft: 16, fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>{fmt(item.precoTotal)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>Total</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--fg)", letterSpacing: "-0.5px" }}>{fmt(total)}</p>
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", textAlign: "center", margin: "6px 0 0" }}>Para pagar, chame o garçom ou vá ao caixa.</p>
          </>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 20px 30px", background: `linear-gradient(to top, ${BG} 70%, transparent)`, display: "flex", gap: 10 }}>
        <button onClick={chamar} style={{ flex: 1, padding: "16px", borderRadius: 999, background: CARD2, border: "none", color: "var(--fg)", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>{chamando ? "Chamado ✓" : "Chamar garçom"}</button>
        <button onClick={onSeguir} style={{ flex: 1, padding: "16px", borderRadius: 999, background: ACCENT, border: "none", color: "var(--accent-fg)", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>Seguir pedindo</button>
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
  esgotados = [],
  comandaId,
  autoPedido = true,
  initialNome,
}: {
  bar: Bar;
  mesa: Mesa;
  cardapio: CategoriaComProdutos[];
  topPedidos?: string[];
  destaques?: Destaque[];
  esgotados?: string[];      // produto_ids esgotados pela ficha
  comandaId?: string;        // presente no fluxo do QR → grava no modelo real
  autoPedido?: boolean;      // false = navega mas não pede (só leitura)
  initialNome?: string;      // nome vindo da comanda aberta → pula splash/welcome
}) {
  const esgotadoSet = new Set(esgotados);
  const [screen, setScreen] = useState<Screen>(initialNome ? "home" : "splash");
  const [cliente, setCliente] = useState<ClienteLocal | null>(
    initialNome ? { nome: initialNome, visitas: 1, ultimaVisita: new Date().toISOString() } : null,
  );
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaComProdutos | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState(false);
  const [pedindo, setPedindo] = useState(false);
  const [pedidoErro, setPedidoErro] = useState<string | null>(null);
  const [justOrdered, setJustOrdered] = useState(false);

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

  // Pedido direto (sem carrinho): tocou "Quero esse drink" → já vai pro bar e
  // leva pra tela de consumação. Menos fricção.
  const handlePedir = async (produto: Produto, qty: number) => {
    if (cliente) {
      const updated = { ...cliente, ultimoProdutoId: produto.id };
      setCliente(updated);
      writeCliente(bar.slug, updated);
    }
    if (!comandaId) { setPedidoErro("Prévia — o pedido não é enviado aqui."); setScreen("consumacao"); return; }
    setPedindo(true); setPedidoErro(null);
    const r = await criarPedidoCliente(comandaId, bar.id, [{ produtoId: produto.id, varianteId: null, quantidade: qty }]);
    setPedindo(false);
    if ("error" in r) { setPedidoErro(r.error); return; }
    setJustOrdered(true);
    setScreen("consumacao");
    setTimeout(() => setJustOrdered(false), 3200);
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
          onCart={() => setScreen("consumacao")}
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
          onCart={() => setScreen("consumacao")}
          onPedirConta={() => setScreen("pedir-conta")}
        />
      )}
      {screen === "products" && selectedCategoria && (
        <ProductsScreen
          categoria={selectedCategoria}
          allCategorias={cardapio}
          esgotados={esgotadoSet}
          onSelect={(p) => { setSelectedProduto(p); setScreen("product-detail"); }}
          onBack={() => setScreen("home")}
          onSwitchCategoria={(cat) => setSelectedCategoria(cat)}
          cartCount={cartCount}
          onCart={() => setScreen("consumacao")}
        />
      )}
      {screen === "product-detail" && selectedProduto && (
        <ProductDetailScreen
          produto={selectedProduto}
          categoriaNome={cardapio.find((c) => c.id === selectedProduto.categoria_id)?.nome ?? selectedCategoria?.nome}
          esgotado={esgotadoSet.has(selectedProduto.id)}
          onBack={() => setScreen(selectedCategoria ? "products" : "categories")}
          onPedir={handlePedir}
          pedindo={pedindo}
          pedidoErro={pedidoErro}
          autoPedido={autoPedido}
        />
      )}
      {screen === "consumacao" && (
        <ConsumacaoScreen
          comandaId={comandaId}
          nomeCliente={cliente?.nome ?? null}
          mesaLabel={mesa.nome ?? `Mesa ${mesa.numero}`}
          barId={bar.id}
          mesaId={mesa.id}
          justOrdered={justOrdered}
          pedidoErro={pedidoErro}
          onSeguir={() => setScreen("home")}
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
