"use client";

import { useMemo, useState, useTransition } from "react";
import { Martini, PackageOpen, Search, X, ImageIcon } from "lucide-react";
import { adicionarItem } from "@/lib/bartender/actions";
import type { CategoriaComProdutos } from "@/lib/bartender/queries";
import type { ProdutoComVariantes, ProdutoVariante } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Variant picker overlay ────────────────────────────────────────────────────
function VariantePicker({
  produto,
  comandaId,
  onClose,
}: {
  produto: ProdutoComVariantes;
  comandaId: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function escolher(v: ProdutoVariante) {
    startTransition(async () => {
      await adicionarItem(produto.id, comandaId, v.id, v.nome);
      onClose();
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.55)",
        }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 20,
        width: "min(360px, 90vw)",
      }}>
        {/* Header */}
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
            style={{
              background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "none", borderRadius: 4,
              color: "var(--fg-muted)", cursor: "pointer", padding: 6,
              display: "flex", alignItems: "center",
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Variante cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {produto.produto_variantes.map(v => (
            <button
              key={v.id}
              type="button"
              disabled={pending}
              onClick={() => escolher(v)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "color-mix(in srgb, var(--fg) 5%, transparent)",
                border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 14px",
                cursor: pending ? "wait" : "pointer",
                textAlign: "left",
                transition: "background 0.12s",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {/* Foto */}
              <div style={{
                width: 48, height: 48, borderRadius: 4, flexShrink: 0,
                background: v.imagem_url
                  ? `url(${v.imagem_url}) center/cover`
                  : "var(--bg-inset)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {!v.imagem_url && <ImageIcon style={{ width: 18, height: 18, color: "var(--fg-subtle)" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{v.nome}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-muted)", margin: 0, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
                {currency.format(v.preco)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Product card ──────────────────────────────────────────────────────────────
function ProdutoCard({
  produto,
  comandaId,
  onPickVariante,
}: {
  produto: ProdutoComVariantes;
  comandaId: string;
  onPickVariante: (p: ProdutoComVariantes) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pending, startTransition] = useTransition();
  const temVariantes = produto.produto_variantes.length > 0;

  function handleClick() {
    if (temVariantes) {
      onPickVariante(produto);
    } else {
      startTransition(async () => {
        await adicionarItem(produto.id, comandaId);
      });
    }
  }

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      disabled={pending}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: hovered
          ? "color-mix(in srgb, var(--fg) 7%, transparent)"
          : "color-mix(in srgb, var(--fg) 4%, transparent)",
        border: "none",
        borderRadius: 8,
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
        transition: "background 0.15s",
        position: "relative",
      }}
    >
      <div style={{
        aspectRatio: "1",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        background: "var(--bg-inset)",
        overflow: "hidden",
        marginBottom: 4,
      }}>
        {produto.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.imagem_url} alt={produto.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Martini style={{ width: 26, height: 26, color: "var(--fg-subtle)" }} strokeWidth={1.5} />
        )}
      </div>

      {/* Badge de variantes */}
      {temVariantes && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "color-mix(in srgb, var(--accent-bright) 75%, transparent)",
          borderRadius: 4, padding: "2px 6px",
          fontSize: 9, fontWeight: 700, color: "var(--accent-bright)",
        }}>
          {produto.produto_variantes.length} vars
        </div>
      )}

      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {produto.nome}
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
          {temVariantes ? "→ escolher" : currency.format(produto.preco)}
        </p>
      </div>
    </button>
  );
}

// ─── Main grid ────────────────────────────────────────────────────────────────
export function ProdutoGrid({ cardapio, comandaId }: { cardapio: CategoriaComProdutos[]; comandaId: string }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(cardapio[0]?.categoria.id ?? "");
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [pickerProduto, setPickerProduto] = useState<ProdutoComVariantes | null>(null);

  const resultadoBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return cardapio.flatMap(g => g.produtos).filter(p => p.nome.toLowerCase().includes(termo));
  }, [busca, cardapio]);

  const produtosAtivos = buscaAtiva
    ? resultadoBusca
    : (cardapio.find(g => g.categoria.id === categoriaAtiva)?.produtos ?? []);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (cardapio.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px 24px",
        textAlign: "center",
        gap: 12,
      }}>
        <PackageOpen style={{ width: 40, height: 40, color: "var(--fg-subtle)" }} strokeWidth={1.5} />
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", margin: "0 0 4px" }}>
            Nenhum produto cadastrado
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
            Adicione produtos no cardápio para começar
          </p>
        </div>
        <a
          href="/dashboard/cardapio"
          style={{
            marginTop: 8,
            display: "inline-block",
            padding: "8px 16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--fg-muted)",
            textDecoration: "none",
          }}
        >
          Ir para Cardápio →
        </a>
      </div>
    );
  }

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Category tabs + search toggle ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 24px",
        height: 52,
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {!buscaAtiva ? (
          <>
            <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
              {cardapio.map(grupo => {
                const active = categoriaAtiva === grupo.categoria.id;
                return (
                  <button
                    key={grupo.categoria.id}
                    onClick={() => setCategoriaAtiva(grupo.categoria.id)}
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      padding: "6px 14px",
                      borderRadius: 4,
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "var(--accent-fg)" : "var(--fg-muted)",
                    }}
                  >
                    {grupo.categoria.nome}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setBuscaAtiva(true)}
              style={{
                flexShrink: 0,
                width: 34,
                height: 34,
                borderRadius: 4,
                border: "none",
                background: "color-mix(in srgb, var(--fg) 6%, transparent)",
                color: "var(--fg-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search style={{ width: 15, height: 15 }} />
            </button>
          </>
        ) : (
          /* Inline search input */
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <Search style={{ width: 15, height: 15, color: "var(--fg-subtle)", flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "var(--fg)",
                colorScheme: "dark",
              } as React.CSSProperties}
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

      {/* ── Product grid ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {buscaAtiva && busca && resultadoBusca.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", textAlign: "center", paddingTop: 48 }}>
            Nenhum produto para &ldquo;{busca}&rdquo;
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}>
            {produtosAtivos.map(produto => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                comandaId={comandaId}
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
        comandaId={comandaId}
        onClose={() => setPickerProduto(null)}
      />
    )}
    </>
  );
}
