"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Receipt, LayoutGrid, Clock, Package } from "lucide-react";
import { CaixaTela } from "./caixa-tela";
import { AppHeader } from "@/components/ui/app-header";
import { abrirTurno, fecharTurno } from "@/lib/dashboard/turno-actions";
import { registrarPagamento } from "@/lib/caixa/actions";
import { imprimirConta } from "@/lib/caixa/print-conta";
import { createClient } from "@/lib/supabase/client";
import type { ComandaPendente, CaixaInsights } from "@/lib/caixa/queries";
import type { MesaComStatus } from "@/lib/bartender/queries";
import type { AlertaEstoque } from "@/lib/dashboard/queries";
import type { Comanda, PagamentoMetodo, Turno } from "@/types/database";

type Tab = "comandas" | "mesas" | "turno" | "estoque";

const TABS: { id: Tab; label: string; Icon: React.FC<{ style?: React.CSSProperties }> }[] = [
  { id: "comandas", label: "Comandas", Icon: ({ style }) => <Receipt style={style} strokeWidth={1.75} /> },
  { id: "mesas",    label: "Mesas",    Icon: ({ style }) => <LayoutGrid style={style} strokeWidth={1.75} /> },
  { id: "turno",    label: "Turno",    Icon: ({ style }) => <Clock style={style} strokeWidth={1.75} /> },
  { id: "estoque",  label: "Estoque",  Icon: ({ style }) => <Package style={style} strokeWidth={1.75} /> },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Ícones ───────────────────────────────────────────────────────────────────

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconPrint = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IconClock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

function tempoAbertaCaixa(abertaEm: string) {
  const diff = Math.floor((Date.now() - new Date(abertaEm).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60); const m = diff % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

// ─── Sheet: Pagamento de uma comanda ─────────────────────────────────────────

type ItemAgrupado = { key: string; nome: string; qtd: number; total: number };

function ComandaPagamentoSheet({
  comanda, mesaLabel, barNome, onClose, onPago,
}: {
  comanda: Comanda;
  mesaLabel: string;
  barNome: string;
  onClose: () => void;
  onPago: () => void;
}) {
  const [itens, setItens]             = useState<ItemAgrupado[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [incluirServico, setIncluirServico] = useState(true);
  const [isPending, startTransition]  = useTransition();
  const [pago, setPago]               = useState(false);
  const [metodoPago, setMetodoPago]   = useState<PagamentoMetodo | null>(null);

  const servicoValor = Math.round(comanda.total * 0.10 * 100) / 100;
  const totalFinal   = comanda.total + (incluirServico ? servicoValor : 0);

  // Carrega itens via Supabase client
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase
      .from("comanda_items")
      .select("produto_id, preco_total, variante_nome, produtos(nome)")
      .eq("comanda_id", comanda.id)
      .eq("status", "ativo")
      .order("adicionado_em", { ascending: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any[] | null }) => {
        if (!mounted) return;
        const mapa = new Map<string, ItemAgrupado>();
        for (const item of data ?? []) {
          const k = `${item.produto_id}::${item.variante_nome ?? ""}`;
          const nomeBase = item.produtos?.nome ?? "Produto";
          const nome = item.variante_nome ? `${nomeBase} — ${item.variante_nome}` : nomeBase;
          const existing = mapa.get(k) ?? { key: k, nome, qtd: 0, total: 0 };
          existing.qtd  += 1;
          existing.total += item.preco_total;
          mapa.set(k, existing);
        }
        setItens([...mapa.values()]);
        setCarregando(false);
      });
    return () => { mounted = false; };
  }, [comanda.id]);

  const pagar = (metodo: PagamentoMetodo) => {
    startTransition(async () => {
      const motivo = metodo === "cortesia" ? "Cortesia" : undefined;
      await registrarPagamento(comanda.id, metodo, incluirServico && metodo !== "cortesia", motivo);
      setMetodoPago(metodo);
      setPago(true);
    });
  };

  const imprimir = () => {
    imprimirConta({
      barNome,
      mesa: `${mesaLabel}${comanda.nome_cliente ? ` — ${comanda.nome_cliente}` : ""}`,
      abertaEm: comanda.aberta_em,
      itens: itens.map(it => ({ nome: it.nome, quantidade: it.qtd, preco_total: it.total })),
      subtotal: comanda.total,
      incluirServico: incluirServico && metodoPago !== "cortesia",
      servicoPct: 10,
      servicoValor,
      totalFinal: pago ? totalFinal : totalFinal,
    });
  };

  const [copiado, setCopiado] = useState(false);

  const compartilhar = async () => {
    const nomeMesa = `${mesaLabel}${nomePessoa ? ` — ${nomePessoa}` : ""}`;
    const linhasItens = itens
      .map(it => `${it.qtd}× ${it.nome}  ${currency.format(it.total)}`)
      .join("\n");
    const comServico = incluirServico && metodoPago !== "cortesia";
    const texto = [
      `🍹 *${barNome}*`,
      `📋 ${nomeMesa}`,
      ``,
      linhasItens,
      ``,
      comServico ? `Subtotal: ${currency.format(comanda.total)}` : null,
      comServico ? `Serviço (10%): ${currency.format(servicoValor)}` : null,
      `*Total: ${currency.format(totalFinal)}*`,
    ].filter(l => l !== null).join("\n");

    if ("share" in navigator) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch {
        // usuário cancelou — não faz nada
        return;
      }
    }
    // fallback: copia para clipboard
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const METODOS: { id: PagamentoMetodo; label: string }[] = [
    { id: "pix",      label: "Pix" },
    { id: "dinheiro", label: "Dinheiro" },
    { id: "credito",  label: "Crédito" },
    { id: "debito",   label: "Débito" },
    { id: "cortesia", label: "Cortesia" },
  ];

  const nomePessoa = comanda.nome_cliente ?? comanda.identificador ?? null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61,
        background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
        borderRadius: "12px 12px 0 0",
        maxHeight: "90dvh", display: "flex", flexDirection: "column",
      }}>
        {/* Handle + Header */}
        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "0 auto 16px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>
                {mesaLabel}
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", margin: 0 }}>
                {nomePessoa ?? "Conta"}
              </h2>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                <IconClock />{tempoAbertaCaixa(comanda.aberta_em)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={compartilhar} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8,
                background: copiado ? "color-mix(in srgb, var(--ok) 15%, transparent)" : "rgba(255,255,255,0.06)",
                border: copiado ? "1px solid color-mix(in srgb, var(--ok) 35%, transparent)" : "1px solid rgba(255,255,255,0.1)",
                color: copiado ? "var(--ok)" : "var(--fg-subtle)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 200ms",
              }}>
                {copiado ? "✓ Copiado" : "↗ Compartilhar"}
              </button>
              <button onClick={imprimir} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--fg-subtle)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                <IconPrint /> Imprimir
              </button>
              <button onClick={onClose} style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%", cursor: "pointer", color: "var(--fg-subtle)",
              }}>
                <IconX />
              </button>
            </div>
          </div>
        </div>

        {/* Itens (scrollável) */}
        <div style={{ overflowY: "auto", padding: "0 20px", flex: 1 }}>
          {carregando ? (
            <p style={{ color: "var(--fg-subtle)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              Carregando itens...
            </p>
          ) : itens.length === 0 ? (
            <p style={{ color: "var(--fg-subtle)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              Nenhum item nesta comanda.
            </p>
          ) : (
            <div style={{ borderTop: "1px solid var(--border)", marginBottom: 4 }}>
              {itens.map(it => (
                <div key={it.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 14, color: "var(--fg)" }}>
                    <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", marginRight: 6 }}>{it.qtd}×</span>
                    {it.nome}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", marginLeft: 12 }}>
                    {currency.format(it.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totais + pagamento */}
        <div style={{ padding: "12px 20px 36px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
          {/* Serviço toggle */}
          {!pago && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: "8px 0" }}>
              <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>Serviço 10%</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                  {currency.format(servicoValor)}
                </span>
                <button
                  onClick={() => setIncluirServico(v => !v)}
                  style={{
                    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: incluirServico ? "var(--accent)" : "rgba(255,255,255,0.12)",
                    position: "relative", transition: "background 200ms",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                    background: "white", transition: "left 200ms",
                    left: incluirServico ? 21 : 3,
                  }} />
                </button>
              </div>
            </div>
          )}

          {/* Total */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0", marginBottom: 16,
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>
              {pago ? "Pago" : "Total"}
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
              {currency.format(totalFinal)}
            </span>
          </div>

          {pago ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                padding: "14px 16px", borderRadius: 10, textAlign: "center",
                background: "color-mix(in srgb, var(--ok) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
                color: "var(--ok)", fontSize: 15, fontWeight: 700,
              }}>
                ✓ Pago via {metodoPago === "pix" ? "Pix" : metodoPago === "dinheiro" ? "Dinheiro" :
                  metodoPago === "credito" ? "Crédito" : metodoPago === "debito" ? "Débito" : "Cortesia"}
              </div>
              <button onClick={onPago} style={{
                padding: "14px", borderRadius: 10, border: "none",
                background: "var(--accent)", color: "var(--accent-fg)",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>
                Fechar
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {METODOS.map(m => (
                <button
                  key={m.id}
                  onClick={() => !isPending && pagar(m.id)}
                  disabled={isPending}
                  style={{
                    padding: "14px 8px", borderRadius: 10, border: "none",
                    background: m.id === "cortesia"
                      ? "rgba(255,255,255,0.05)"
                      : "var(--accent)",
                    color: m.id === "cortesia" ? "var(--fg-subtle)" : "var(--accent-fg)",
                    fontSize: 14, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.6 : 1,
                    gridColumn: m.id === "cortesia" ? "span 2" : undefined,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {isPending ? "..." : m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tab: Mesas ───────────────────────────────────────────────────────────────

function TabMesas({ mesas, barNome }: { mesas: MesaComStatus[]; barNome: string }) {
  const router = useRouter();
  const [pagamentoAberto, setPagamentoAberto] = useState<{ comanda: Comanda; mesaLabel: string } | null>(null);

  const livreCount      = mesas.filter(m => m.comandas.length === 0).length;
  const aguardandoCount = mesas.filter(m => m.comandas.some(c => c.status === "aguardando_pagamento")).length;
  const totalOcupadas   = mesas.filter(m => m.comandas.length > 0).length;

  const ocupadas = mesas.filter(m => m.comandas.length > 0);
  const livres   = mesas.filter(m => m.comandas.length === 0);

  return (
    <div style={{ padding: "20px 20px 32px", overflowY: "auto", height: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px" }}>
          Mesas
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "-0.3px" }}>
            {totalOcupadas > 0 ? `${totalOcupadas} ocupada${totalOcupadas > 1 ? "s" : ""}` : "Todas livres"}
          </p>
          {aguardandoCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
              background: "color-mix(in srgb, #9333EA 18%, transparent)",
              border: "1px solid color-mix(in srgb, #9333EA 35%, transparent)",
              color: "color-mix(in srgb, #C084FC 90%, white)",
            }}>
              {aguardandoCount} aguardando
            </span>
          )}
          {livreCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.35)",
            }}>
              {livreCount} livre{livreCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Mesas ocupadas — cards expandidos com lista de pessoas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: livres.length > 0 ? 24 : 0 }}>
        {ocupadas.map((mesaStatus) => {
          const { mesa, comandas } = mesaStatus;
          const mesaLabel     = mesa.nome ?? `Mesa ${mesa.numero}`;
          const hasAguardando = comandas.some(c => c.status === "aguardando_pagamento");
          const totalValor    = comandas.reduce((sum, c) => sum + c.total, 0);
          const maisAntiga    = comandas.reduce((a, b) => a.aberta_em < b.aberta_em ? a : b);

          const bg = hasAguardando
            ? "color-mix(in srgb, #9333EA 12%, transparent)"
            : "color-mix(in srgb, #8B5CF6 8%, transparent)";
          const border = hasAguardando
            ? "1.5px solid color-mix(in srgb, #9333EA 35%, transparent)"
            : "1px solid color-mix(in srgb, #8B5CF6 18%, transparent)";

          return (
            <div key={mesa.id} style={{ background: bg, border, borderRadius: 10, overflow: "hidden" }}>
              {/* Cabeçalho da mesa */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--fg)" }}>{mesaLabel}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 3 }}>
                    <IconClock />{tempoAbertaCaixa(maisAntiga.aberta_em)}
                  </span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--fg)", letterSpacing: "-0.4px" }}>
                  {currency.format(totalValor)}
                </span>
              </div>

              {/* Linha por pessoa */}
              {comandas.map((c, i) => {
                const label     = c.nome_cliente ?? c.identificador ?? `Comanda ${i + 1}`;
                const querPagar = c.status === "aguardando_pagamento";
                return (
                  <button
                    key={c.id}
                    onClick={() => setPagamentoAberto({ comanda: c, mesaLabel })}
                    style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 16px", border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: "transparent", cursor: "pointer", textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{label}</span>
                      {querPagar && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: "color-mix(in srgb, #9333EA 25%, transparent)",
                          color: "#C084FC", textTransform: "uppercase" as const, letterSpacing: "0.06em",
                        }}>
                          Pagar
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
                        {currency.format(c.total)}
                      </span>
                      <span style={{ color: "var(--fg-subtle)" }}><IconChevron /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Mesas livres — compactas */}
      {livres.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
            Livres · {livres.length}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
            {livres.map(({ mesa }) => (
              <div key={mesa.id} style={{
                padding: "10px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                textAlign: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.25)" }}>
                  {mesa.nome ?? mesa.numero}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sheet de pagamento */}
      {pagamentoAberto && (
        <ComandaPagamentoSheet
          comanda={pagamentoAberto.comanda}
          mesaLabel={pagamentoAberto.mesaLabel}
          barNome={barNome}
          onClose={() => setPagamentoAberto(null)}
          onPago={() => {
            setPagamentoAberto(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Tab: Turno ──────────────────────────────────────────────────────────────

function TabTurno({ turno, barNome }: { turno: Turno | null; barNome: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const abrir = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await abrirTurno();
      if (r?.error) setMsg({ tipo: "erro", texto: r.error });
      else setMsg({ tipo: "ok", texto: "Turno aberto com sucesso." });
    });
  };

  const fechar = () => {
    if (!turno) return;
    setMsg(null);
    startTransition(async () => {
      const r = await fecharTurno(turno.id);
      if (r?.error) setMsg({ tipo: "erro", texto: r.error });
      else setMsg({ tipo: "ok", texto: "Turno encerrado." });
    });
  };

  const duracao = turno ? (() => {
    const mins = Math.floor((Date.now() - new Date(turno.created_at).getTime()) / 60000);
    return mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ""}`;
  })() : null;

  return (
    <div style={{ padding: "20px 20px 32px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status */}
      <div style={{
        padding: "20px", borderRadius: 10,
        background: turno ? "color-mix(in srgb, var(--ok) 10%, transparent)" : "color-mix(in srgb, var(--fg) 5%, transparent)",
        border: `1px solid ${turno ? "color-mix(in srgb, var(--ok) 25%, transparent)" : "var(--border)"}`,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>
          {barNome}
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: turno ? "var(--ok)" : "var(--fg-subtle)", margin: 0, fontFamily: "var(--font-mono)" }}>
          {turno ? `● Turno aberto` : "○ Nenhum turno"}
        </p>
        {turno && duracao && (
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "6px 0 0" }}>em andamento há {duracao}</p>
        )}
      </div>

      {/* Stats do turno */}
      {turno && (
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Faturado",  value: currency.format(turno.total_vendas) },
            { label: "Comandas",  value: String(turno.total_comandas) },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, padding: "14px 16px",
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              borderRadius: 8, border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem */}
      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: msg.tipo === "ok" ? "var(--ok-bg)" : "var(--danger-bg)",
          color: msg.tipo === "ok" ? "var(--ok)" : "var(--danger)",
          fontSize: 14, fontWeight: 600,
        }}>
          {msg.texto}
        </div>
      )}

      {/* Ação */}
      {turno ? (
        <button
          onClick={fechar}
          disabled={isPending}
          style={{
            padding: "18px", borderRadius: 8, border: "none",
            background: "color-mix(in srgb, var(--danger) 12%, transparent)",
            color: "var(--danger)", fontSize: 16, fontWeight: 700,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1, transition: "opacity 150ms",
          }}
        >
          {isPending ? "Encerrando..." : "Encerrar turno"}
        </button>
      ) : (
        <button
          onClick={abrir}
          disabled={isPending}
          style={{
            padding: "18px", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "var(--accent-fg)",
            fontSize: 16, fontWeight: 700,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1, transition: "opacity 150ms",
          }}
        >
          {isPending ? "Abrindo..." : "Abrir turno"}
        </button>
      )}
    </div>
  );
}

// ─── Tab: Estoque ────────────────────────────────────────────────────────────

function TabEstoque({ alertas }: { alertas: AlertaEstoque[] }) {
  if (alertas.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
        <p style={{ fontSize: 32, margin: 0 }}>✓</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Estoque ok</p>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Nenhum insumo abaixo do mínimo.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 32px", overflowY: "auto", height: "100%" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>
        {alertas.length} insumo{alertas.length > 1 ? "s" : ""} abaixo do mínimo
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alertas.map(a => (
          <div key={a.produtoNome} style={{
            padding: "14px 16px", borderRadius: 8,
            background: "var(--danger-bg)",
            border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{a.produtoNome}</p>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--danger)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {a.quantidadeAtual}
              </p>
              <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: "2px 0 0" }}>mín. {a.quantidadeMinima}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export function CaixaShell({
  comandas, insights, mesas, turno, alertas, barNome, barId, turnoId,
}: {
  comandas: ComandaPendente[];
  insights: CaixaInsights;
  mesas: MesaComStatus[];
  turno: Turno | null;
  alertas: AlertaEstoque[];
  barNome: string;
  barId: string;
  turnoId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("comandas");

  const badges: Partial<Record<Tab, number>> = {
    comandas: comandas.length || undefined,
    estoque:  alertas.length  || undefined,
  };

  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--bg)", color: "var(--fg)" }}>

      {/* ── Sidebar de navegação (lg+) ── */}
      <nav
        className="hidden lg:flex"
        style={{
          width: 88, flexShrink: 0,
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          paddingTop: 16, paddingBottom: 16,
          gap: 4,
        }}
      >
        {/* Logo / nome */}
        <p style={{
          fontSize: 10, fontWeight: 700, color: "var(--fg-subtle)",
          textTransform: "uppercase", letterSpacing: "0.14em",
          textAlign: "center", margin: "0 0 16px", padding: "0 8px",
        }}>
          {barNome.split(" ")[0]}
        </p>

        {TABS.map(({ id, label, Icon }) => {
          const ativo = tab === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 6, padding: "14px 8px",
                margin: "0 8px", borderRadius: 10, border: "none",
                background: ativo ? "var(--accent)" : "transparent",
                color: ativo ? "var(--accent-fg)" : "var(--fg-subtle)",
                cursor: "pointer", position: "relative",
                transition: "background 150ms, color 150ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon style={{ width: 24, height: 24 }} />
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </span>
              {badge ? (
                <span style={{
                  position: "absolute", top: 8, right: 8,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: ativo ? "rgba(255,255,255,0.25)" : "var(--danger)",
                  color: "#fff", fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px",
                }}>
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* ── Conteúdo ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header mobile */}
        <div className="lg:hidden flex-shrink-0">
          <AppHeader barNome={barNome} roleLabel="Caixa" />
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {tab === "comandas" && turnoId ? (
            <CaixaTela
              comandas={comandas}
              insights={insights}
              barNome={barNome}
              barId={barId}
              turnoId={turnoId}
              embedded
            />
          ) : tab === "comandas" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ fontSize: 14, color: "var(--fg-subtle)" }}>Abra um turno para ver as comandas.</p>
            </div>
          ) : tab === "mesas" && turnoId ? (
            <TabMesas mesas={mesas} barNome={barNome} />
          ) : tab === "mesas" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ fontSize: 14, color: "var(--fg-subtle)" }}>Abra um turno para ver as mesas.</p>
            </div>
          ) : tab === "turno" ? (
            <TabTurno turno={turno} barNome={barNome} />
          ) : (
            <TabEstoque alertas={alertas} />
          )}
        </div>

        {/* ── Bottom nav (mobile) ── */}
        <nav
          className="lg:hidden"
          style={{
            display: "flex", flexShrink: 0,
            borderTop: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const ativo = tab === id;
            const badge = badges[id];
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 5, padding: "12px 4px 14px",
                  border: "none", background: "transparent",
                  color: ativo ? "var(--accent-bright)" : "var(--fg-subtle)",
                  cursor: "pointer", position: "relative",
                  WebkitTapHighlightColor: "transparent",
                  transition: "color 150ms",
                }}
              >
                <Icon style={{ width: 22, height: 22 }} />
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </span>
                {badge ? (
                  <span style={{
                    position: "absolute", top: 8, right: "calc(50% - 20px)",
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: "var(--danger)", color: "#fff",
                    fontSize: 9, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                  }}>
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
