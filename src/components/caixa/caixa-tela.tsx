"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { registrarPagamentosMesa } from "@/lib/caixa/actions";
import { imprimirConta } from "@/lib/caixa/print-conta";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/ui/app-header";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { ComandaPendente, CaixaInsights } from "@/lib/caixa/queries";
import type { PagamentoMetodo } from "@/types/database";
import { METODO_LABEL } from "@/lib/caixa/constants";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function calcTempo(ts: string) {
  const min = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  const texto = min < 1 ? "agora" : min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}min` : ""}`;
  const urgente = min >= 10 && min < 120;
  return { texto, urgente };
}

// ─── Agrupamento por mesa ─────────────────────────────────────────────────────

interface MesaGroup {
  key: string;
  mesa: string;
  comandas: ComandaPendente[];
  total: number;
  totalPessoas: number | null;
  garcom_nome: string | null;
  garcom_foto: string | null;
  tempoBase: string;
}

function agruparPorMesa(comandas: ComandaPendente[]): MesaGroup[] {
  const mapa = new Map<string, MesaGroup>();
  for (const c of comandas) {
    const key = c.mesa_id ?? c.mesa;
    const existing = mapa.get(key);
    if (!existing) {
      mapa.set(key, {
        key, mesa: c.mesa,
        comandas: [c],
        total: c.total,
        totalPessoas: c.total_pessoas,
        garcom_nome: c.garcom_nome,
        garcom_foto: c.garcom_foto,
        tempoBase: c.fechada_em ?? c.aberta_em,
      });
    } else {
      existing.comandas.push(c);
      existing.total += c.total;
      if (!existing.garcom_nome && c.garcom_nome) {
        existing.garcom_nome = c.garcom_nome;
        existing.garcom_foto = c.garcom_foto;
      }
      if (new Date(c.fechada_em ?? c.aberta_em) < new Date(existing.tempoBase)) {
        existing.tempoBase = c.fechada_em ?? c.aberta_em;
      }
    }
  }
  return Array.from(mapa.values());
}

// ─── InsightsBar ─────────────────────────────────────────────────────────────

function InsightsBar({ insights, pendentes }: { insights: CaixaInsights; pendentes: number }) {
  return (
    <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 0, flexShrink: 0 }}>
      {([
        { label: "Faturado", value: currency.format(insights.totalTurno), big: true },
        { label: "Pagas",    value: String(insights.comandasPagas) },
        { label: "Ticket",   value: currency.format(insights.ticketMedio) },
        ...(pendentes > 0 ? [{ label: "Fila", value: String(pendentes), warn: true }] : []),
      ] as { label: string; value: string; big?: boolean; warn?: boolean }[]).map((s, i) => (
        <div key={s.label} style={{ flex: i === 0 ? 2 : 1, paddingLeft: i > 0 ? 16 : 0, marginLeft: i > 0 ? 16 : 0, borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>{s.label}</p>
          <p style={{ fontSize: s.big ? 19 : 15, fontWeight: 800, margin: 0, lineHeight: 1, color: s.warn ? "var(--warn)" : s.big ? "var(--fg)" : "var(--fg-muted)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MesaCard ─────────────────────────────────────────────────────────────────

function MesaCard({ group, selected, pago, onSelect }: {
  group: MesaGroup; selected: boolean; pago: boolean; onSelect: () => void;
}) {
  const { texto, urgente } = calcTempo(group.tempoBase);

  if (pago) {
    return (
      <button onClick={onSelect} className="[-webkit-tap-highlight-color:transparent]" style={{
        aspectRatio: "1", borderRadius: 12, border: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--ok) 6%, transparent)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 12, opacity: 0.5,
      }}>
        <span style={{ fontSize: 20, color: "var(--ok)" }}>✓</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", marginTop: 4 }}>{group.mesa}</span>
      </button>
    );
  }

  return (
    <button onClick={onSelect} className="[-webkit-tap-highlight-color:transparent]" style={{
      aspectRatio: "1", borderRadius: 12,
      border: "1px solid var(--border)",
      boxShadow: selected ? "0 0 0 2px var(--accent)" : "none",
      background: "var(--bg-elevated)",
      display: "flex", flexDirection: "column",
      padding: "14px 14px 12px",
      cursor: "pointer", textAlign: "left",
      transition: "box-shadow 120ms",
    }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.2px", lineHeight: 1.2, flex: 1 }}>{group.mesa}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: urgente ? "var(--danger)" : "var(--fg-subtle)", marginBottom: 6 }}>{texto}</span>
      <span style={{ fontSize: 17, fontWeight: 900, color: selected ? "var(--accent)" : "var(--fg)", letterSpacing: "-0.5px", lineHeight: 1, display: "block", marginBottom: 6 }}>{currency.format(group.total)}</span>
      <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>{group.comandas.length} {group.comandas.length === 1 ? "pessoa" : "pessoas"}</span>
    </button>
  );
}

// ─── CortesiaModal ────────────────────────────────────────────────────────────

const MOTIVOS_RAPIDOS = ["VIP / cliente especial", "Erro do preparo", "Aniversariante", "Parceiro / influencer", "Brinde da casa"];

function CortesiaModal({ mesaNome, onConfirm, onClose }: {
  mesaNome: string; onConfirm: (m: string) => void; onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const valid = motivo.trim().length > 0;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 70 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderRadius: "12px 12px 0 0", padding: "24px 24px 44px", zIndex: 71 }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 4px" }}>Cortesia — {mesaNome}</p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px" }}>Qual o motivo?</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MOTIVOS_RAPIDOS.map(m => (
            <button key={m} onClick={() => setMotivo(m)} className="[-webkit-tap-highlight-color:transparent]" style={{
              padding: "7px 14px", borderRadius: 6,
              border: `1px solid ${motivo === m ? "var(--accent)" : "var(--border)"}`,
              background: motivo === m ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
              color: motivo === m ? "var(--accent)" : "var(--fg-muted)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>{m}</button>
          ))}
        </div>
        <input value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ou escreva o motivo..."
          style={{
            width: "100%", boxSizing: "border-box",
            background: "var(--bg-hover)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "13px 16px", fontSize: 14, color: "var(--fg)",
            outline: "none", marginBottom: 16,
            colorScheme: "dark" as React.CSSProperties["colorScheme"],
          }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="op-secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="op" className="flex-[2]" disabled={!valid} onClick={() => valid && onConfirm(motivo.trim())}>
            Confirmar cortesia
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── DetailPanel ─────────────────────────────────────────────────────────────

function DetailPanel({ group, barNome, taxaServicoPct, onPago, onClose }: {
  group: MesaGroup; barNome: string; taxaServicoPct: number;
  onPago: (metodo: PagamentoMetodo) => void; onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [pago, setPago]               = useState(false);
  const [metodoPago, setMetodoPago]   = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showCortesia, setShowCortesia] = useState(false);
  const [cartaoAberto, setCartaoAberto] = useState(false);
  const [incluirServico, setIncluirServico] = useState(taxaServicoPct > 0);
  const [expandida, setExpandida]     = useState<string | null>(null);

  const subtotal     = group.total;
  const servicoValor = Math.round(subtotal * (taxaServicoPct / 100) * 100) / 100;
  const totalFinal   = incluirServico ? subtotal + servicoValor : subtotal;

  const pagar = (metodo: PagamentoMetodo, motivo?: string) => {
    setError(null);
    startTransition(async () => {
      const ids = group.comandas.map(c => c.id);
      const result = await registrarPagamentosMesa(ids, metodo, metodo !== "cortesia" && incluirServico, motivo);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMetodoPago(metodo === "cortesia" ? `Cortesia${motivo ? ` — ${motivo}` : ""}` : METODO_LABEL[metodo]);
        setPago(true);
        onPago(metodo);
      }
    });
  };

  const handleImprimir = () => {
    const todosItens = group.comandas.flatMap(c => c.itens);
    imprimirConta({
      barNome, mesa: group.mesa, abertaEm: group.tempoBase,
      itens: todosItens.map(it => ({ nome: it.nome, quantidade: it.quantidade, preco_total: it.preco_total })),
      subtotal, incluirServico, servicoPct: taxaServicoPct, servicoValor, totalFinal,
    });
  };

  const { texto: tempo } = calcTempo(group.tempoBase);

  if (pago) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 48, lineHeight: 1, color: "var(--ok)" }}>✓</span>
        <p style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", margin: "8px 0 0" }}>{group.mesa}</p>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "2px 0 0" }}>Pago via {metodoPago}</p>
        <p style={{ fontSize: 36, fontWeight: 900, color: "var(--fg)", margin: "12px 0 0", letterSpacing: "-1px" }}>{currency.format(totalFinal)}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "0 0 3px" }}>{tempo} aguardando</p>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--fg)", margin: 0, letterSpacing: "-0.4px" }}>{group.mesa}</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={handleImprimir} style={{ width: 34, height: 34, padding: 0 }}>🖨</Button>
            <Button variant="secondary" size="sm" onClick={onClose} style={{ width: 34, height: 34, padding: 0 }}>✕</Button>
          </div>
        </div>
        {group.garcom_nome && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            {group.garcom_foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.garcom_foto} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--fg-subtle)" }}>
                {group.garcom_nome.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{group.garcom_nome}</span>
          </div>
        )}
      </div>

      {/* Lista de pessoas */}
      <div>
        {group.comandas.map((comanda, idx) => {
          const nome = comanda.nome_cliente ?? `Pessoa ${idx + 1}`;
          const aberto = expandida === comanda.id;
          return (
            <div key={comanda.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setExpandida(aberto ? null : comanda.id)} className="[-webkit-tap-highlight-color:transparent]"
                style={{ width: "100%", display: "flex", alignItems: "center", padding: "12px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-muted)" }}>
                  {nome.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{nome}</span>
                <span style={{ fontSize: 13, color: "var(--fg-muted)", fontWeight: 600 }}>{currency.format(comanda.total)}</span>
                <span style={{ fontSize: 10, color: "var(--fg-subtle)", marginLeft: 4 }}>{aberto ? "▲" : "▼"}</span>
              </button>
              {aberto && comanda.itens.length > 0 && (
                <div style={{ padding: "0 20px 10px 56px" }}>
                  {comanda.itens.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{it.quantidade}× {it.nome}</span>
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{currency.format(it.preco_total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Totais + pagamento */}
      <div style={{ padding: "16px 20px 28px", borderTop: "1px solid var(--border)" }}>

        {taxaServicoPct > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle checked={incluirServico} onChange={setIncluirServico} />
              <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Serviço {taxaServicoPct}%</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{currency.format(servicoValor)}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)" }}>Total</span>
          <span style={{ fontSize: 32, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.8px" }}>{currency.format(totalFinal)}</span>
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--danger)", margin: "0 0 10px" }}>{error}</p>}

        {cartaoAberto ? (
          <div style={{ display: "flex", gap: 8 }}>
            {(["debito", "credito"] as PagamentoMetodo[]).map(key => (
              <Button key={key} variant="op" className="flex-1" disabled={isPending} onClick={() => { pagar(key); setCartaoAberto(false); }}>
                {key === "debito" ? "Débito" : "Crédito"}
              </Button>
            ))}
            <Button variant="op-secondary" onClick={() => setCartaoAberto(false)} style={{ width: 52, flexShrink: 0, padding: 0 }}>✕</Button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button variant="op" className="w-full" disabled={isPending} onClick={() => pagar("pix")}>Pix</Button>
            <Button variant="op" className="w-full" disabled={isPending} onClick={() => pagar("dinheiro")}>Dinheiro</Button>
            <Button variant="op" className="w-full" disabled={isPending} onClick={() => setCartaoAberto(true)}>Cartão</Button>
            <Button variant="op" className="w-full" disabled={isPending} onClick={() => setShowCortesia(true)}>Cortesia</Button>
          </div>
        )}
      </div>

      {showCortesia && (
        <CortesiaModal
          mesaNome={group.mesa}
          onConfirm={motivo => { setShowCortesia(false); pagar("cortesia", motivo); }}
          onClose={() => setShowCortesia(false)}
        />
      )}
    </div>
  );
}

// ─── Notificação ─────────────────────────────────────────────────────────────

function notificarNovaMesa() {
  try {
    const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch { /* ignore */ }
  try { navigator.vibrate?.([150, 60, 150]); } catch { /* ignore */ }
}

// ─── CaixaTela ────────────────────────────────────────────────────────────────

export function CaixaTela({
  comandas, insights, barNome, barId, turnoId, embedded = false, taxaServicoPct = 10,
}: {
  comandas: ComandaPendente[];
  insights: CaixaInsights;
  barNome: string;
  barId: string;
  turnoId: string;
  embedded?: boolean;
  taxaServicoPct?: number;
}) {
  const [listaAtual,    setListaAtual]    = useState(comandas);
  const [insightsAtual, setInsightsAtual] = useState(insights);
  const [pagos,         setPagos]         = useState(new Set<string>());
  const [selecionada,   setSelecionada]   = useState<string | null>(null);

  const grupos = agruparPorMesa(listaAtual.filter(c => !pagos.has(c.mesa_id ?? c.mesa)));

  const fetchComandas = useCallback(async () => {
    const supabase = createClient();
    const { data: raw } = await supabase
      .from("comandas")
      .select("id, total, aberta_em, fechada_em, mesa_id, nome_cliente, total_pessoas, mesas(numero, nome)")
      .eq("bar_id", barId)
      .eq("status", "aguardando_pagamento")
      .order("fechada_em", { ascending: true })
      .returns<{
        id: string; total: number; aberta_em: string; fechada_em: string | null;
        mesa_id: string | null; nome_cliente: string | null; total_pessoas: number | null;
        mesas: { numero: number; nome: string | null } | null;
      }[]>();

    if (!raw?.length) { setListaAtual([]); return; }

    const ids = raw.map(c => c.id);
    const { data: itensRaw } = await supabase
      .from("comanda_items")
      .select("comanda_id, quantidade, preco_total, variante_nome, produtos(nome)")
      .in("comanda_id", ids).eq("status", "ativo")
      .returns<{ comanda_id: string; quantidade: number; preco_total: number; variante_nome: string | null; produtos: { nome: string } | null }[]>();

    const itensPorComanda = new Map<string, ComandaPendente["itens"]>();
    for (const item of itensRaw ?? []) {
      if (!item.produtos) continue;
      const nome = item.variante_nome ? `${item.produtos.nome} — ${item.variante_nome}` : item.produtos.nome;
      const lista = itensPorComanda.get(item.comanda_id) ?? [];
      lista.push({ nome, quantidade: item.quantidade, preco_total: item.preco_total });
      itensPorComanda.set(item.comanda_id, lista);
    }

    const novaLista: ComandaPendente[] = raw.map(c => ({
      id: c.id, total: c.total, aberta_em: c.aberta_em, fechada_em: c.fechada_em ?? null,
      mesa_id: c.mesa_id,
      mesa: c.mesas ? (c.mesas.nome ?? `Mesa ${c.mesas.numero}`) : "Balcão",
      nome_cliente: c.nome_cliente ?? null,
      total_pessoas: c.total_pessoas ?? null,
      garcom_nome: null, garcom_foto: null,
      itens: itensPorComanda.get(c.id) ?? [],
    }));

    setListaAtual(prev => {
      const garcomPorId = new Map(prev.map(c => [c.id, { garcom_nome: c.garcom_nome, garcom_foto: c.garcom_foto }]));
      const comGarcom = novaLista.map(c => {
        const g = garcomPorId.get(c.id);
        return g ? { ...c, garcom_nome: g.garcom_nome, garcom_foto: g.garcom_foto } : c;
      });
      const idsAntigos = new Set(prev.map(c => c.id));
      if (comGarcom.some(c => !idsAntigos.has(c.id))) notificarNovaMesa();
      return comGarcom;
    });
  }, [barId]);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase.channel("caixa-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "comandas", filter: `bar_id=eq.${barId}` }, () => fetchComandas())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [barId, fetchComandas]);

  const handlePago = useCallback((group: MesaGroup, metodo: PagamentoMetodo) => {
    const mesaKey = group.key;
    const totalMesa = group.total;
    setInsightsAtual(prev => {
      const novoTotal = prev.totalTurno + totalMesa;
      const novaQtd   = prev.comandasPagas + group.comandas.length;
      const metodosAtuais = [...prev.porMetodo];
      const idx = metodosAtuais.findIndex(m => m.metodo === metodo);
      if (idx >= 0) {
        metodosAtuais[idx] = { ...metodosAtuais[idx], total: metodosAtuais[idx].total + totalMesa, quantidade: metodosAtuais[idx].quantidade + group.comandas.length };
      } else {
        metodosAtuais.push({ metodo, total: totalMesa, quantidade: group.comandas.length });
      }
      return { totalTurno: novoTotal, comandasPagas: novaQtd, ticketMedio: novaQtd > 0 ? novoTotal / novaQtd : 0, porMetodo: metodosAtuais };
    });
    setPagos(prev => new Set([...prev, mesaKey]));
    setTimeout(() => {
      setListaAtual(prev => prev.filter(c => (c.mesa_id ?? c.mesa) !== mesaKey));
      setPagos(prev => { const s = new Set(prev); s.delete(mesaKey); return s; });
      setSelecionada(prev => prev === mesaKey ? null : prev);
    }, 1400);
  }, []);

  const grupoSelecionado = grupos.find(g => g.key === selecionada) ?? null;
  const vazio = grupos.length === 0 && pagos.size === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", ...(embedded ? { height: "100%", overflow: "hidden" } : { minHeight: "100dvh" }) }}>
      {!embedded && <AppHeader barNome={barNome} roleLabel="Caixa" />}
      <InsightsBar insights={insightsAtual} pendentes={grupos.length} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Painel esquerdo */}
        <div style={{ flex: grupoSelecionado ? "0 0 50%" : "1", overflowY: "auto", borderRight: grupoSelecionado ? "1px solid var(--border)" : "none", padding: "16px" }}
          className={grupoSelecionado ? "hidden md:block" : ""}>
          {vazio ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200, gap: 8 }}>
              <p style={{ fontSize: 28, margin: 0 }}>✓</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Nada pendente</p>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Todas as comandas foram pagas.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {grupos.map(g => (
                <MesaCard key={g.key} group={g} selected={selecionada === g.key} pago={pagos.has(g.key)}
                  onSelect={() => setSelecionada(prev => prev === g.key ? null : g.key)} />
              ))}
            </div>
          )}
        </div>

        {/* Painel direito */}
        {grupoSelecionado ? (
          <div className="hidden md:block" style={{ flex: "0 0 50%", overflowY: "auto" }}>
            <DetailPanel key={grupoSelecionado.key} group={grupoSelecionado} barNome={barNome}
              taxaServicoPct={taxaServicoPct}
              onPago={metodo => handlePago(grupoSelecionado, metodo)}
              onClose={() => setSelecionada(null)} />
          </div>
        ) : !vazio ? (
          <div className="hidden md:flex" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", opacity: 0.4 }}>Selecione uma mesa para ver os detalhes</p>
          </div>
        ) : null}
      </div>

      {/* Bottom sheet — mobile */}
      {grupoSelecionado && (
        <div className="md:hidden">
          <div onClick={() => setSelecionada(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61, background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderRadius: "12px 12px 0 0", maxHeight: "92dvh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "12px auto 0", flexShrink: 0 }} />
            <DetailPanel key={grupoSelecionado.key} group={grupoSelecionado} barNome={barNome}
              taxaServicoPct={taxaServicoPct}
              onPago={metodo => handlePago(grupoSelecionado, metodo)}
              onClose={() => setSelecionada(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
