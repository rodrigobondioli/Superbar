"use client";

import { useMemo, useState, useTransition } from "react";
import { Martini, PackageOpen, Search, X, ImageIcon, ShoppingCart, Minus, Plus } from "lucide-react";
import { criarPedido } from "@/lib/bartender/actions";
import type { CategoriaComProdutos } from "@/lib/bartender/queries";
import type { CartItem, ProdutoComVariantes, ProdutoVariante } from "@/types/database";
import { currency } from "@/lib/format";


// ─── Tipo interno do carrinho ─────────────────────────────────────────────────

interface CartEntry extends CartItem {
  display_nome: string;
}

type Cart = Map<string, CartEntry>; // key = produto_id:variante_id

function cartKey(produtoId: string, varianteId: string | null) {
  return `${produtoId}:${varianteId ?? ""}`;
}

function addToCart(cart: Cart, entry: Omit<CartEntry, "quantidade">): Cart {
  const key = cartKey(entry.produto_id, entry.variante_id);
  const existing = cart.get(key);
  const next = new Map(cart);
  next.set(key, { ...entry, quantidade: (existing?.quantidade ?? 0) + 1 });
  return next;
}

function changeQty(cart: Cart, key: string, delta: number): Cart {
  const next = new Map(cart);
  const entry = next.get(key);
  if (!entry) return next;
  const novaQty = entry.quantidade + delta;
  if (novaQty <= 0) next.delete(key);
  else next.set(key, { ...entry, quantidade: novaQty });
  return next;
}

function changeObs(cart: Cart, key: string, value: string): Cart {
  const next = new Map(cart);
  const entry = next.get(key);
  if (!entry) return next;
  next.set(key, { ...entry, observacao: value });
  return next;
}

// ─── Variant picker ───────────────────────────────────────────────────────────

function VariantePicker({
  produto,
  onEscolher,
  onClose,
}: {
  produto: ProdutoComVariantes;
  onEscolher: (v: ProdutoVariante) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.55)" }}
      />
      <div style={{
        position: "fixed", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)", zIndex: 50,
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 8, padding: 20, width: "min(360px, 90vw)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Escolha a variante
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: "3px 0 0" }}>
              {produto.nome}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "none", borderRadius: 8, color: "var(--fg-muted)", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {produto.produto_variantes.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => { onEscolher(v); onClose(); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "color-mix(in srgb, var(--fg) 5%, transparent)",
                border: "1px solid var(--border)", borderRadius: 8,
                padding: "10px 14px", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                background: v.imagem_url ? `url(${v.imagem_url}) center/cover` : "var(--bg-hover)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {!v.imagem_url && <ImageIcon style={{ width: 18, height: 18, color: "var(--fg-subtle)" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{v.nome}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-muted)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {currency.format(v.preco)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProdutoCard({
  produto,
  qtdNoCarrinho,
  onAdd,
  onPickVariante,
}: {
  produto: ProdutoComVariantes;
  qtdNoCarrinho: number;
  onAdd: () => void;
  onPickVariante: (p: ProdutoComVariantes) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const temVariantes = produto.produto_variantes.length > 0;

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => temVariantes ? onPickVariante(produto) : onAdd()}
      style={{
        width: "100%", display: "flex", flexDirection: "column", gap: 8,
        background: qtdNoCarrinho > 0
          ? "color-mix(in srgb, var(--accent) 14%, transparent)"
          : hovered
            ? "color-mix(in srgb, var(--fg) 7%, transparent)"
            : "color-mix(in srgb, var(--fg) 4%, transparent)",
        border: qtdNoCarrinho > 0
          ? "1px solid color-mix(in srgb, var(--accent-bright) 40%, transparent)"
          : "none",
        borderRadius: 16, padding: 12, textAlign: "left", cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s", position: "relative",
      }}
    >
      <div style={{
        aspectRatio: "1", width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, background: "var(--bg-card-hi)", overflow: "hidden", marginBottom: 8,
      }}>
        {produto.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.imagem_url} alt={produto.nome} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Martini style={{ width: 26, height: 26, color: "var(--fg-subtle)" }} strokeWidth={1.5} />
        )}
      </div>

      {temVariantes && (
        <div style={{ position: "absolute", top: 8, right: 8, background: "var(--accent-bright)", borderRadius: 8, padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>
          {produto.produto_variantes.length} opções
        </div>
      )}

      {qtdNoCarrinho > 0 && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "var(--accent-bright)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>
          {qtdNoCarrinho}
        </div>
      )}

      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {produto.nome}
        </p>
        <p style={{ fontSize: 15, fontWeight: 500, color: temVariantes ? "var(--accent)" : "var(--fg)", margin: "3px 0 0" }}>
          {temVariantes ? "→ escolher" : currency.format(produto.preco)}
        </p>
      </div>
    </button>
  );
}

// ─── Cart bar ─────────────────────────────────────────────────────────────────

function CartBar({
  cart,
  comandaId,
  onChangeQty,
  onChangeObs,
  onConfirm,
  onClear,
}: {
  cart: Cart;
  comandaId: string;
  onChangeQty: (key: string, delta: number) => void;
  onChangeObs: (key: string, value: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  const entries = [...cart.values()];
  const totalQty = entries.reduce((acc, e) => acc + e.quantidade, 0);
  const totalValor = entries.reduce((acc, e) => acc + e.preco * e.quantidade, 0);

  function confirmar() {
    startTransition(async () => {
      const res = await criarPedido(comandaId, entries);
      if ("error" in res) {
        setResultado(res.error);
        setTimeout(() => setResultado(null), 3000);
      } else {
        setResultado("✓ Pedido enviado!");
        setTimeout(() => { setResultado(null); onConfirm(); setExpanded(false); }, 1200);
      }
    });
  }

  if (cart.size === 0) return null;

  return (
    <>
      <style>{`
        @keyframes sb-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div className="right-0 md:right-[360px]" style={{ position: "fixed", bottom: 0, left: 0, zIndex: 60, animation: "sb-slide-up 0.2s ease-out" }}>

        {/* Itens expandidos */}
        {expanded && (
          <div style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", padding: "12px 16px 0", maxHeight: "40vh", overflowY: "auto" }}>
            {entries.map(e => {
              const key = cartKey(e.produto_id, e.variante_id);
              return (
                <div key={key} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--fg)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.display_nome}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button type="button" onClick={() => onChangeQty(key, -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--fg-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Minus style={{ width: 12, height: 12 }} />
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", width: 18, textAlign: "center", fontFamily: "var(--font-mono)" }}>{e.quantidade}</span>
                      <button type="button" onClick={() => onChangeQty(key, +1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--fg-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plus style={{ width: 12, height: 12 }} />
                      </button>
                      <span style={{ fontSize: 13, color: "var(--fg-muted)", width: 64, textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        {currency.format(e.preco * e.quantidade)}
                      </span>
                    </div>
                  </div>
                  <input
                    value={e.observacao ?? ""}
                    onChange={ev => onChangeObs(key, ev.target.value)}
                    placeholder="Observação (ex: sem gelo)"
                    style={{ width: "100%", marginTop: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "var(--fg)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Barra principal */}
        <div style={{
          background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", flexShrink: 0 }}
          >
            <ShoppingCart style={{ width: 16, height: 16, color: "var(--fg-muted)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
              {totalQty} {totalQty === 1 ? "item" : "itens"}
            </span>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{expanded ? "▼" : "▲"}</span>
          </button>

          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", marginRight: "auto" }}>
            {currency.format(totalValor)}
          </span>

          <button
            type="button"
            onClick={() => { onClear(); setExpanded(false); }}
            disabled={pending}
            style={{ background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--fg)", cursor: "pointer", fontSize: 15, fontWeight: 500, padding: "12px 24px", flexShrink: 0 }}
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={pending}
            style={{
              background: resultado?.startsWith("✓") ? "var(--ok)" : "var(--accent)",
              color: resultado?.startsWith("✓") ? "#fff" : "var(--accent-fg)",
              border: "none", borderRadius: 999, padding: "12px 24px", minHeight: 44,
              fontSize: 15, fontWeight: 500, cursor: pending ? "wait" : "pointer",
              opacity: pending ? 0.7 : 1, transition: "background 0.2s", flexShrink: 0,
            }}
          >
            {pending ? "Enviando..." : resultado ?? "Enviar pedido →"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main grid ────────────────────────────────────────────────────────────────

export function ProdutoGrid({ cardapio, comandaId, onEnviado }: { cardapio: CategoriaComProdutos[]; comandaId: string; onEnviado?: () => void }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(cardapio[0]?.categoria.id ?? "");
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [pickerProduto, setPickerProduto] = useState<ProdutoComVariantes | null>(null);
  const [cart, setCart] = useState<Cart>(new Map());

  const resultadoBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return cardapio.flatMap(g => g.produtos).filter(p => p.nome.toLowerCase().includes(termo));
  }, [busca, cardapio]);

  const produtosAtivos = buscaAtiva
    ? resultadoBusca
    : (cardapio.find(g => g.categoria.id === categoriaAtiva)?.produtos ?? []);

  function adicionarSemVariante(produto: ProdutoComVariantes) {
    setCart(prev => addToCart(prev, {
      produto_id: produto.id, variante_id: null, variante_nome: null,
      preco: produto.preco, display_nome: produto.nome,
    }));
  }

  function adicionarComVariante(produto: ProdutoComVariantes, v: ProdutoVariante) {
    setCart(prev => addToCart(prev, {
      produto_id: produto.id, variante_id: v.id, variante_nome: v.nome,
      preco: v.preco, display_nome: `${produto.nome} — ${v.nome}`,
    }));
  }

  function qtdNoCarrinho(produto: ProdutoComVariantes): number {
    let total = 0;
    for (const [k, v] of cart) {
      if (k.startsWith(`${produto.id}:`)) total += v.quantidade;
    }
    return total;
  }

  if (cardapio.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 24px", textAlign: "center", gap: 12 }}>
        <PackageOpen style={{ width: 40, height: 40, color: "var(--fg-subtle)" }} strokeWidth={1.5} />
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", margin: "0 0 4px" }}>Nenhum produto cadastrado</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Adicione produtos no cardápio para começar</p>
        </div>
        <a href="/dashboard/cardapio" style={{ marginTop: 8, display: "inline-block", padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", textDecoration: "none" }}>
          Ir para Cardápio →
        </a>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Category tabs + search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {!buscaAtiva ? (
            <>
              <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
                {cardapio.map(grupo => {
                  const active = categoriaAtiva === grupo.categoria.id;
                  return (
                    <button
                      key={grupo.categoria.id}
                      onClick={() => setCategoriaAtiva(grupo.categoria.id)}
                      style={{ fontSize: 13, fontWeight: active ? 600 : 500, padding: "8px 16px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s", background: active ? "var(--accent)" : "var(--bg-card)", border: active ? "1px solid var(--accent)" : "1px solid var(--border)", color: active ? "var(--accent-fg)" : "var(--fg-muted)" }}
                    >
                      {grupo.categoria.nome}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setBuscaAtiva(true)}
                style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: "none", background: "color-mix(in srgb, var(--fg) 6%, transparent)", color: "var(--fg-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Search style={{ width: 15, height: 15 }} />
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <Search style={{ width: 15, height: 15, color: "var(--fg-subtle)", flexShrink: 0 }} />
              <input
                autoFocus type="text" value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: "var(--fg)", colorScheme: "dark" } as React.CSSProperties}
              />
              <button
                onClick={() => { setBuscaAtiva(false); setBusca(""); }}
                style={{ background: "none", border: "none", color: "var(--fg-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}
        </div>

        {/* Product grid */}
        <div
          className="flex-1 overflow-y-auto px-5 pt-5"
          style={{ paddingBottom: cart.size > 0 ? "80px" : "20px" }}
        >
          {buscaAtiva && busca && resultadoBusca.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--fg-subtle)", textAlign: "center", paddingTop: 48 }}>
              Nenhum produto para &ldquo;{busca}&rdquo;
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {produtosAtivos.map(produto => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  qtdNoCarrinho={qtdNoCarrinho(produto)}
                  onAdd={() => adicionarSemVariante(produto)}
                  onPickVariante={setPickerProduto}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variant picker */}
      {pickerProduto && (
        <VariantePicker
          produto={pickerProduto}
          onEscolher={v => adicionarComVariante(pickerProduto, v)}
          onClose={() => setPickerProduto(null)}
        />
      )}

      {/* Cart bar */}
      <CartBar
        cart={cart}
        comandaId={comandaId}
        onChangeQty={(key, delta) => setCart(prev => changeQty(prev, key, delta))}
        onChangeObs={(key, value) => setCart(prev => changeObs(prev, key, value))}
        onConfirm={() => { setCart(new Map()); onEnviado?.(); }}
        onClear={() => setCart(new Map())}
      />
    </>
  );
}
