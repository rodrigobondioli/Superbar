"use client";

import { useMemo, useState, useTransition } from "react";
import { Martini, Search, X, ImageIcon } from "lucide-react";
import { adicionarItem } from "@/lib/bartender/actions";
import type { CategoriaComProdutos } from "@/lib/bartender/queries";
import type { Categoria, ProdutoComVariantes, ProdutoVariante } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Demo data injected when real cardapio is empty ───────────────────────────
const C = (id: string, nome: string, ordem: number): Categoria =>
  ({ id, bar_id: "demo", nome, ordem, ativo: true, created_at: "" });

const P = (id: string, cat: string, nome: string, preco: number): ProdutoComVariantes =>
  ({ id, bar_id: "demo", categoria_id: cat, nome, preco, descricao: null, custo: null, imagem_url: null, ativo: true, controla_estoque: false, created_at: "", updated_at: "", produto_variantes: [] });

const DEMO_CARDAPIO: CategoriaComProdutos[] = [
  { categoria: C("c1", "Drinques", 1), produtos: [
    P("p1","c1","Caipirinha",28), P("p2","c1","Gin Tônica",32), P("p3","c1","Negroni",38),
    P("p4","c1","Aperol Spritz",35), P("p5","c1","Mojito",30), P("p6","c1","Dry Martini",42),
    P("p7","c1","Whisky Sour",40), P("p8","c1","Cosmopolitan",36),
  ]},
  { categoria: C("c2", "Cervejas", 2), produtos: [
    P("p9","c2","Chopp 500ml",18), P("p10","c2","Heineken LN",14), P("p11","c2","Corona Extra",16),
    P("p12","c2","Stella Artois",15), P("p13","c2","Budweiser",13), P("p14","c2","Amstel",13),
  ]},
  { categoria: C("c3", "Vinhos", 3), produtos: [
    P("p15","c3","Tinto Taça",28), P("p16","c3","Branco Taça",26),
    P("p17","c3","Rosé Taça",27), P("p18","c3","Espumante Taça",32),
  ]},
  { categoria: C("c4", "Destilados", 4), produtos: [
    P("p19","c4","Whisky Dose",35), P("p20","c4","Rum Dose",28), P("p21","c4","Vodka Dose",25),
    P("p22","c4","Tequila Dose",30), P("p23","c4","Cachaça Dose",18),
  ]},
  { categoria: C("c5", "Petiscos", 5), produtos: [
    P("p24","c5","Batata Frita",35), P("p25","c5","Onion Rings",32), P("p26","c5","Tábua Frios",68),
    P("p27","c5","Croquete x4",28), P("p28","c5","Bruschetta",30),
  ]},
  { categoria: C("c6", "Sem Álcool", 6), produtos: [
    P("p29","c6","Limonada",16), P("p30","c6","Água s/ gás",8), P("p31","c6","Água c/ gás",9),
    P("p32","c6","Refrigerante",10), P("p33","c6","Suco Natural",18),
  ]},
];

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
  const data = cardapio.length > 0 ? cardapio : DEMO_CARDAPIO;

  const [categoriaAtiva, setCategoriaAtiva] = useState(data[0]?.categoria.id ?? "");
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [pickerProduto, setPickerProduto] = useState<ProdutoComVariantes | null>(null);

  const resultadoBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return data.flatMap(g => g.produtos).filter(p => p.nome.toLowerCase().includes(termo));
  }, [busca, data]);

  const produtosAtivos = buscaAtiva
    ? resultadoBusca
    : (data.find(g => g.categoria.id === categoriaAtiva)?.produtos ?? []);

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
              {data.map(grupo => {
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
