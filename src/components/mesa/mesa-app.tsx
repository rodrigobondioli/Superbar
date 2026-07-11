"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { abrirComandaCliente, chamarAtendimento, buscarComandaPorTelefone, criarPedidoCliente, type ItemPedido } from "@/lib/mesa/actions";
import type { MesaPublica, ProdutoPublico } from "@/lib/mesa/queries";
import { MenuApp } from "@/components/menu/menu-app";
import type { Bar, Mesa, Categoria, Produto, Destaque } from "@/types/database";

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

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
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
    width: 32, height: 32, borderRadius: 999, border: "none", cursor: "pointer",
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

        {erro && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{erro}</p>}

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
          type="tel"
          autoFocus
          autoComplete="tel"
          inputMode="tel"
          style={{ ...inpStyle, border: erro ? "1.5px solid var(--danger)" : inpStyle.border as string }}
        />

        {erro && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{erro}</p>}

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

// ─── Tela com comanda aberta ──────────────────────────────────────────────────

function TelaAberta({
  mesa,
  produtos,
  comandaId,
  nomeCliente,
}: {
  mesa: MesaPublica;
  produtos: ProdutoPublico[];
  comandaId: string;
  nomeCliente: string;
}) {
  const auto = mesa.bar.autoPedido;
  const [tab, setTab] = useState<Tab>(auto ? "cardapio" : "conta");
  const [itens, setItens] = useState<ItemComanda[]>([]);
  const [chamando, setChamando] = useState(false);
  const [chamadaPending, startChamada] = useTransition();

  // Carrinho do auto-pedido: chave `${produtoId}|${varianteId ?? ""}` → quantidade
  const [cart, setCart] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [pedidoErro, setPedidoErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  // Agrupa produtos por categoria
  const porCategoria = produtos.reduce<Record<string, ProdutoPublico[]>>((acc, p) => {
    if (!acc[p.categoriaNome]) acc[p.categoriaNome] = [];
    acc[p.categoriaNome].push(p);
    return acc;
  }, {});

  // Mapa de itens pedíveis (produto sem variante = 1 entrada; com variantes = 1 por variante)
  const itemInfo = new Map<string, { nome: string; preco: number; produtoId: string; varianteId: string | null }>();
  for (const p of produtos) {
    if (p.variantes.length === 0) {
      itemInfo.set(`${p.id}|`, { nome: p.nome, preco: p.preco, produtoId: p.id, varianteId: null });
    } else {
      for (const v of p.variantes) itemInfo.set(`${p.id}|${v.id}`, { nome: `${p.nome} · ${v.nome}`, preco: v.preco, produtoId: p.id, varianteId: v.id });
    }
  }
  const keyFor = (produtoId: string, varianteId: string | null) => `${produtoId}|${varianteId ?? ""}`;
  const addCart = (k: string) => { setPedidoErro(null); setCart(c => ({ ...c, [k]: (c[k] ?? 0) + 1 })); };
  const removeCart = (k: string) => setCart(c => { const n = (c[k] ?? 0) - 1; const next = { ...c }; if (n <= 0) delete next[k]; else next[k] = n; return next; });
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((s, [k, q]) => s + (itemInfo.get(k)?.preco ?? 0) * q, 0);

  const enviarPedido = () => {
    if (enviando || cartCount === 0) return;
    const payload: ItemPedido[] = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([k, q]) => { const info = itemInfo.get(k)!; return { produtoId: info.produtoId, varianteId: info.varianteId, quantidade: q }; });
    setEnviando(true); setPedidoErro(null);
    startChamada(async () => {
      const r = await criarPedidoCliente(comandaId, mesa.bar.id, payload);
      setEnviando(false);
      if ("error" in r) { setPedidoErro(r.error); return; }
      setCart({}); setEnviado(true); setTab("conta");
      setTimeout(() => setEnviado(false), 2600);
    });
  };

  // Carrega e assina itens em tempo real
  const carregarItens = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comanda_items")
      .select("id, preco_total, variante_nome, produtos(nome)")
      .eq("comanda_id", comandaId)
      .eq("status", "ativo")
      .order("adicionado_em", { ascending: true });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItens(data.map((item: any) => ({
        id: item.id,
        nome: item.produtos?.nome ?? "Produto",
        varianteNome: item.variante_nome ?? null,
        precoTotal: item.preco_total,
      })));
    }
  }, [comandaId]);

  useEffect(() => {
    carregarItens();
    const supabase = createClient();
    const channel = supabase
      .channel(`mesa_comanda_${comandaId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "comanda_items",
        filter: `comanda_id=eq.${comandaId}`,
      }, carregarItens)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comandaId, carregarItens]);

  const total = itens.reduce((sum, i) => sum + i.precoTotal, 0);
  const mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: "20px 20px 0",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 3px" }}>
                {mesa.bar.nome} · {mesaLabel}
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.2px" }}>
                {nomeCliente}
              </p>
            </div>
            {itens.length > 0 && (
              <p style={{ fontSize: 20, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: 0, letterSpacing: "-0.4px" }}>
                {currency.format(total)}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: -1 }}>
            {([
              { id: "cardapio" as Tab, label: "Cardápio", icon: <IconMenu /> },
              { id: "conta"    as Tab, label: `Minha conta${itens.length > 0 ? ` (${itens.length})` : ""}`, icon: <IconReceipt /> },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 16px 12px", border: "none", background: "transparent",
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  color: tab === t.id ? "var(--accent-bright)" : "var(--fg-subtle)",
                  borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "color 150ms",
                  WebkitTapHighlightColor: "transparent",
                  marginBottom: -1,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20 }}>

          {/* ── Aba: Cardápio ── */}
          {tab === "cardapio" && (
            <>
              {!mesa.bar.autoPedido && (
                <div style={{
                  padding: "14px 16px", borderRadius: 8, marginBottom: 20,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 13, color: "var(--fg-subtle)", textAlign: "center",
                }}>
                  Peça ao garçom ou no balcão.
                </div>
              )}

              {Object.entries(porCategoria).map(([categoria, prods]) => (
                <div key={categoria} style={{ marginBottom: 28 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "var(--fg-subtle)", margin: "0 0 10px",
                  }}>
                    {categoria}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {prods.map(p => {
                      const semVar = p.variantes.length === 0;
                      return (
                        <div key={p.id} style={{
                          padding: "14px 16px", borderRadius: 8,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          display: "flex", flexDirection: "column", gap: 10,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", margin: "0 0 3px" }}>{p.nome}</p>
                              {p.descricao && (
                                <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.4 }}>{p.descricao}</p>
                              )}
                            </div>
                            {semVar && (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0, whiteSpace: "nowrap" }}>
                                  {currency.format(p.preco)}
                                </p>
                                {auto && (
                                  <Stepper qty={cart[keyFor(p.id, null)] ?? 0} onAdd={() => addCart(keyFor(p.id, null))} onRemove={() => removeCart(keyFor(p.id, null))} />
                                )}
                              </div>
                            )}
                          </div>

                          {!semVar && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {p.variantes.map(v => {
                                const k = keyFor(p.id, v.id);
                                return (
                                  <div key={v.id} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                                    padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)",
                                  }}>
                                    <p style={{ fontSize: 13, color: "var(--fg)", margin: 0 }}>
                                      {v.nome} <span style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>· {currency.format(v.preco)}</span>
                                    </p>
                                    {auto && (
                                      <Stepper qty={cart[k] ?? 0} onAdd={() => addCart(k)} onRemove={() => removeCart(k)} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {Object.keys(porCategoria).length === 0 && (
                <p style={{ fontSize: 14, color: "var(--fg-subtle)", textAlign: "center", padding: "40px 0" }}>
                  Cardápio não disponível.
                </p>
              )}
            </>
          )}

          {/* ── Aba: Minha conta ── */}
          {tab === "conta" && (
            <>
              {itens.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <p style={{ fontSize: 32, margin: "0 0 12px" }}>🍹</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>
                    Sua comanda está vazia
                  </p>
                  <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
                    Os pedidos aparecem aqui em tempo real.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {itens.map(item => (
                      <div key={item.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 0", borderBottom: "1px solid var(--border)",
                      }}>
                        <p style={{ fontSize: 14, color: "var(--fg)", margin: 0 }}>
                          {item.nome}
                          {item.varianteNome && (
                            <span style={{ color: "var(--fg-subtle)" }}> — {item.varianteNome}</span>
                          )}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: 0, marginLeft: 16 }}>
                          {currency.format(item.precoTotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 0",
                  }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: 0 }}>Total</p>
                    <p style={{ fontSize: 26, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: 0, letterSpacing: "-0.5px" }}>
                      {currency.format(total)}
                    </p>
                  </div>

                  <p style={{ fontSize: 12, color: "var(--fg-subtle)", textAlign: "center", margin: "8px 0 0" }}>
                    Para pagar, dirija-se ao caixa.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barra flutuante inferior: envia pedido (auto) ou chama atendimento */}
      <div style={{
        position: "fixed", bottom: 24, left: 0, right: 0, zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "0 20px", pointerEvents: "none",
      }}>
        {pedidoErro && (
          <div style={{ pointerEvents: "auto", maxWidth: 480, width: "100%", boxSizing: "border-box", background: "var(--bg-card-hi, #242426)", border: "1px solid var(--danger)", color: "var(--fg)", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            {pedidoErro}
          </div>
        )}
        {enviado && cartCount === 0 && (
          <div style={{ pointerEvents: "auto", maxWidth: 480, width: "100%", boxSizing: "border-box", background: "color-mix(in srgb, var(--ok) 16%, var(--bg))", border: "1px solid var(--ok)", color: "var(--ok)", borderRadius: 8, padding: "12px 14px", fontSize: 14, fontWeight: 700, textAlign: "center" }}>
            Pedido enviado — já foi pro bar ✓
          </div>
        )}

        {auto && cartCount > 0 ? (
          <button
            onClick={enviarPedido}
            disabled={enviando}
            style={{
              pointerEvents: "auto", maxWidth: 480, width: "100%", boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "16px 22px", borderRadius: 999,
              background: "var(--accent)", color: "var(--accent-fg)", border: "none",
              fontSize: 15, fontWeight: 800, cursor: enviando ? "wait" : "pointer",
              boxShadow: "0 6px 28px rgba(0,0,0,0.5)", opacity: enviando ? 0.7 : 1,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span>{enviando ? "Enviando…" : `Enviar pedido · ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{currency.format(cartTotal)}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (chamando || chamadaPending) return;
              setChamando(true);
              startChamada(async () => {
                await chamarAtendimento(mesa.id, mesa.bar.id);
                setTimeout(() => setChamando(false), 4000);
              });
            }}
            style={{
              pointerEvents: "auto",
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 28px", borderRadius: 999,
              background: chamando ? "var(--fg-subtle)" : "var(--fg)",
              color: "var(--bg)",
              border: "none", fontSize: 15, fontWeight: 800,
              cursor: chamando ? "default" : "pointer",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              transition: "background 300ms",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <IconBell />
            {chamando ? "Atendimento chamado ✓" : "Chamar atendimento"}
          </button>
        )}
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
