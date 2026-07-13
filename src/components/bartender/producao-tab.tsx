"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { iniciarPedido, marcarPronto, entregarPedido, cancelarPedido } from "@/lib/bartender/actions";

// ─── Alerta sonoro / háptico ──────────────────────────────────────────────────

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    play(880, 0, 0.08);
    play(660, 0.12, 0.10);
    setTimeout(() => ctx.close(), 500);
  } catch {
    /* AudioContext indisponível — ignora */
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([80, 40, 120]);
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ItemDoPedido {
  produto_id: string;
  quantidade: number;
  produto_nome: string;
  observacao: string | null;
}

interface PedidoCard {
  id: string;
  status: "recebido" | "preparando";
  criado_em: string;
  mesa_label: string;
  pessoa: string;
  itens: ItemDoPedido[];
}

interface InsumoLinha { nome: string; quantidade: number; unidade: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? ` ${diff % 60}min` : ""}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function comandaInfo(p: any): { pessoa: string; mesa_label: string } {
  const c = p?.comandas as {
    nome_cliente: string | null;
    identificador: string | null;
    mesas: { numero: number; nome: string | null } | null;
  } | null;
  const mesa = c?.mesas;
  const mesa_label = mesa ? (mesa.nome ?? `Mesa ${mesa.numero}`) : "Balcão";
  const pessoa = c?.nome_cliente
    ?? (c?.identificador && c.identificador.trim() ? `Comanda ${c.identificador.slice(-4)}` : mesa_label);
  return { pessoa, mesa_label };
}

function agregarItens(raw: ItemDoPedido[]): ItemDoPedido[] {
  const map = new Map<string, ItemDoPedido>();
  for (const it of raw) {
    const ex = map.get(it.produto_nome);
    if (ex) { ex.quantidade += it.quantidade; if (!ex.observacao && it.observacao) ex.observacao = it.observacao; }
    else map.set(it.produto_nome, { ...it });
  }
  return [...map.values()];
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

const SELECT_PEDIDO = `
  id, status, criado_em,
  comandas ( nome_cliente, identificador, mesas ( numero, nome ) )
`;

async function itensDoPedido(ids: string[]): Promise<Map<string, ItemDoPedido[]>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comanda_items")
    .select("pedido_id, quantidade, produto_id, observacao, produtos ( nome )")
    .in("pedido_id", ids)
    .eq("status", "ativo");
  const byPedido = new Map<string, ItemDoPedido[]>();
  for (const it of data ?? []) {
    const pid = it.pedido_id as string;
    const lista = byPedido.get(pid) ?? [];
    lista.push({
      produto_id: it.produto_id as string,
      quantidade: it.quantidade as number,
      produto_nome: (it.produtos as unknown as { nome: string } | null)?.nome ?? "Produto",
      observacao: (it.observacao as string | null) ?? null,
    });
    byPedido.set(pid, lista);
  }
  for (const [k, v] of byPedido) byPedido.set(k, agregarItens(v));
  return byPedido;
}

async function fetchPedidos(barId: string, turnoId: string): Promise<PedidoCard[]> {
  const supabase = createClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .in("status", ["recebido", "preparando"])
    .order("criado_em", { ascending: true });
  if (!pedidos?.length) return [];
  const itensMap = await itensDoPedido(pedidos.map(p => p.id));
  return pedidos.map(p => {
    const { pessoa, mesa_label } = comandaInfo(p);
    return { id: p.id, status: p.status as "recebido" | "preparando", criado_em: p.criado_em, mesa_label, pessoa, itens: itensMap.get(p.id) ?? [] };
  });
}

async function fetchPedidoById(pedidoId: string): Promise<PedidoCard | null> {
  const supabase = createClient();
  const { data: p } = await supabase.from("pedidos").select(SELECT_PEDIDO).eq("id", pedidoId).single();
  if (!p) return null;
  const itensMap = await itensDoPedido([pedidoId]);
  const { pessoa, mesa_label } = comandaInfo(p);
  return { id: p.id, status: p.status as "recebido" | "preparando", criado_em: p.criado_em, mesa_label, pessoa, itens: itensMap.get(pedidoId) ?? [] };
}

async function fetchFicha(barId: string, produtoId: string): Promise<InsumoLinha[] | null> {
  const supabase = createClient();
  const res = await supabase
    .from("receitas")
    .select("quantidade, ingredientes ( nome, unidade )")
    .eq("bar_id", barId)
    .eq("produto_id", produtoId);
  const data = res.data as unknown as { quantidade: number; ingredientes: { nome: string; unidade: string } | null }[] | null;
  if (!data?.length) return null;
  const linhas = data
    .filter(r => r.ingredientes)
    .map(r => ({ nome: r.ingredientes!.nome, quantidade: r.quantidade, unidade: r.ingredientes!.unidade }));
  return linhas.length ? linhas : null;
}

interface FeitoCard { id: string; pessoa: string; mesa_label: string; itens: ItemDoPedido[]; estado: "pronto" | "entregue"; }

async function fetchFeitos(barId: string, turnoId: string): Promise<FeitoCard[]> {
  const supabase = createClient();
  const { data: peds } = await supabase
    .from("pedidos")
    .select("id, status, comandas ( nome_cliente, identificador, mesas ( numero, nome ) )")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .in("status", ["pronto", "entregue"])
    .order("criado_em", { ascending: false })
    .limit(50);
  if (!peds?.length) return [];
  const itensMap = await itensDoPedido(peds.map(p => p.id));
  return peds.map(p => {
    const { pessoa, mesa_label } = comandaInfo(p);
    return { id: p.id, pessoa, mesa_label, itens: itensMap.get(p.id) ?? [], estado: p.status as "pronto" | "entregue" };
  });
}

// ─── Card da fila ─────────────────────────────────────────────────────────────

function FilaCard({ pedido, isNew, active, onClick }: {
  pedido: PedidoCard; isNew: boolean; active: boolean; onClick: () => void;
}) {
  const semNome = pedido.pessoa === pedido.mesa_label;
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${active ? "var(--border-strong)" : isNew ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "var(--border)"}`,
        borderRadius: 16, padding: 16, cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "border-color 200ms",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pedido.pessoa}</span>
      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{semNome ? `há ${tempo(pedido.criado_em)}` : `${pedido.mesa_label} · há ${tempo(pedido.criado_em)}`}</span>
      <div style={{ height: 1, background: "var(--border-strong)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {pedido.itens.map((it, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              <span style={{ fontWeight: 700, color: "var(--fg)", marginRight: 6 }}>{it.quantidade}×</span>{it.produto_nome}
            </span>
            {it.observacao && <span style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)", marginLeft: 22 }}>{it.observacao}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Painel do pedido ativo ───────────────────────────────────────────────────

function PainelAtivo({ barId, pedido, usaPronto, onIniciar, onPronto, onCancelar }: {
  barId: string; pedido: PedidoCard; usaPronto: boolean;
  onIniciar: (id: string) => void;
  onPronto: (id: string) => void;
  onCancelar: (id: string) => void;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [fichas, setFichas] = useState<Record<string, InsumoLinha[] | null>>({});
  const [started, setStarted] = useState(pedido.status === "preparando");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reset SÓ ao trocar de pedido (por id). Não pode depender de pedido.status:
  // ticar o 1º drink chama iniciarPedido → status vira "preparando" → isso zerava
  // o checked e desmarcava o que você acabou de ticar.
  useEffect(() => { setChecked(new Set()); setStarted(pedido.status === "preparando"); setConfirmCancel(false); }, [pedido.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Sincroniza "started" quando o status vira preparando (por outro device), sem tocar no checked.
  useEffect(() => { if (pedido.status === "preparando") setStarted(true); }, [pedido.status]);

  // carrega fichas dos produtos do pedido
  useEffect(() => {
    let cancel = false;
    (async () => {
      const out: Record<string, InsumoLinha[] | null> = {};
      for (const it of pedido.itens) {
        if (out[it.produto_id] !== undefined) continue;
        out[it.produto_id] = await fetchFicha(barId, it.produto_id);
      }
      if (!cancel) setFichas(out);
    })();
    return () => { cancel = true; };
  }, [barId, pedido.id]); // eslint-disable-line react-hooks/exhaustive-deps -- itens são fixos por pedido

  const total = pedido.itens.length;
  const todosFeitos = total > 0 && checked.size === total;

  function toggle(i: number) {
    if (!started) { setStarted(true); startTransition(async () => { await iniciarPedido(pedido.id); onIniciar(pedido.id); }); }
    setChecked(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* contexto */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {started ? "Preparando" : "Pedido"} · {pedido.pessoa}{pedido.pessoa !== pedido.mesa_label ? ` · ${pedido.mesa_label}` : ""}
          </span>
          {!confirmCancel ? (
            <button onClick={() => setConfirmCancel(true)} style={{ background: "none", border: "none", color: "var(--fg-subtle)", fontSize: 12, cursor: "pointer", padding: 0, flexShrink: 0 }}>Cancelar</button>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>Cancelar pedido?</span>
              <button onClick={() => startTransition(async () => { await cancelarPedido(pedido.id); onCancelar(pedido.id); })} style={{ background: "none", border: "none", color: "var(--danger)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Sim</button>
              <button onClick={() => setConfirmCancel(false)} style={{ background: "none", border: "none", color: "var(--fg-subtle)", fontSize: 12, cursor: "pointer", padding: 0 }}>Não</button>
            </span>
          )}
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>
          {total} {total === 1 ? "drink" : "drinks"} · há {tempo(pedido.criado_em)}
        </span>
      </div>

      {/* checklist de drinks */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {pedido.itens.map((it, i) => {
          const done = checked.has(i);
          const ficha = fichas[it.produto_id];
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                background: "var(--bg-card)", border: `1px solid ${done ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "var(--border)"}`,
                borderRadius: 16, padding: 16, cursor: "pointer",
                opacity: done ? 0.55 : 1, transition: "opacity 150ms, border-color 150ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  border: `1.5px solid ${done ? "var(--accent)" : "var(--border-strong)"}`,
                  background: done ? "var(--accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent-fg)", fontSize: 14, fontWeight: 800,
                }}>{done ? "✓" : ""}</div>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "var(--fg)", textDecoration: done ? "line-through" : "none" }}>
                  <span style={{ color: "var(--fg-muted)", marginRight: 6 }}>{it.quantidade}×</span>{it.produto_nome}
                </span>
              </div>
              {it.observacao && (
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", margin: "8px 0 0 36px" }}>{it.observacao}</p>
              )}
              {/* ficha técnica */}
              {ficha === undefined ? null : ficha === null ? (
                <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "10px 0 0 36px" }}>Sem ficha técnica cadastrada.</p>
              ) : (
                <div style={{ margin: "10px 0 0 36px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {ficha.map((ins, k) => (
                    <div key={k} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                      <span style={{ flex: 1, color: "var(--fg-muted)" }}>{ins.nome}</span>
                      <span style={{ color: "var(--fg)" }}>{ins.quantidade} {ins.unidade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ação */}
      <div style={{ paddingTop: 16 }}>
        <button
          onClick={() => { if (todosFeitos) startTransition(async () => { if (usaPronto) await marcarPronto(pedido.id); else await entregarPedido(pedido.id); onPronto(pedido.id); }); }}
          disabled={!todosFeitos || isPending}
          style={btnPrimary(todosFeitos)}
        >
          {isPending ? "…" : !todosFeitos ? `Tique ${total === 1 ? "o drink" : `os ${total} drinks`} para liberar` : usaPronto ? "Pedido pronto →" : "Entregar →"}
        </button>
      </div>
    </div>
  );
}

function btnPrimary(enabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "16px", borderRadius: "var(--r-pill)", border: "none",
    background: enabled ? "var(--accent)" : "color-mix(in srgb, var(--fg) 8%, transparent)",
    color: enabled ? "var(--accent-fg)" : "var(--fg-subtle)",
    fontSize: 15, fontWeight: 700, cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 150ms, color 150ms",
  };
}

// ─── Tab de produção ──────────────────────────────────────────────────────────

type Filtro = "todos" | "preparo" | "feitos";

export function ProducaoTab({ barId, turnoId, usaPronto = true }: { barId: string; turnoId: string; usaPronto?: boolean }) {
  const [pedidos, setPedidos] = useState<PedidoCard[]>([]);
  const [feitos, setFeitos] = useState<FeitoCard[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const carregar = useCallback(async () => {
    const [lista, feitosLista] = await Promise.all([fetchPedidos(barId, turnoId), fetchFeitos(barId, turnoId)]);
    setPedidos(lista);
    setFeitos(feitosLista);
    setLoading(false);
  }, [barId, turnoId]);

  useEffect(() => {
    carregar();
    const timer = setInterval(() => setTick(t => t + 1), 60_000);
    // Fallback: garante que pedido novo apareça mesmo se o realtime não entregar.
    // Produção NÃO pode perder pedido (Princípio 11/12). O checked do card ativo
    // não é afetado (reseta só por id, não por status/refetch).
    const poll = setInterval(carregar, 6000);
    const supabase = createClient();
    const channel = supabase
      .channel(`producao_${barId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos", filter: `bar_id=eq.${barId}` }, async (payload) => {
        const novo = payload.new as { id: string; turno_id: string };
        if (novo.turno_id !== turnoId) return;
        const card = await fetchPedidoById(novo.id);
        if (!card) return;
        setPedidos(prev => prev.some(p => p.id === card.id) ? prev : [...prev, card]);
        setNewIds(prev => new Set([...prev, card.id]));
        playAlertSound();
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(card.id); return n; }), 6000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `bar_id=eq.${barId}` }, (payload) => {
        const up = payload.new as { id: string; status: string };
        if (up.status === "cancelado") {
          setPedidos(prev => prev.filter(p => p.id !== up.id));
          setActiveId(a => (a === up.id ? null : a));
        } else if (up.status === "pronto" || up.status === "entregue") {
          setPedidos(prev => prev.filter(p => p.id !== up.id));
          setActiveId(a => (a === up.id ? null : a));
          fetchFeitos(barId, turnoId).then(setFeitos);
        } else {
          setPedidos(prev => prev.map(p => p.id === up.id ? { ...p, status: up.status as "recebido" | "preparando" } : p));
        }
      })
      .subscribe();
    return () => { clearInterval(timer); clearInterval(poll); supabase.removeChannel(channel); };
  }, [barId, turnoId, carregar]);

  function localIniciar(id: string) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: "preparando" } : p));
    setActiveId(id);
  }
  function localPronto(id: string) {
    setPedidos(prev => prev.filter(p => p.id !== id));
    setActiveId(a => (a === id ? null : a));
  }
  function localCancelar(id: string) {
    setPedidos(prev => prev.filter(p => p.id !== id));
    setActiveId(a => (a === id ? null : a));
  }

  const preparando = pedidos.filter(p => p.status === "preparando");
  const visiveis = filtro === "preparo" ? preparando : pedidos;
  const active = activeId ? pedidos.find(p => p.id === activeId) ?? null : null;

  const chips: { id: Filtro; label: string; n: number }[] = [
    { id: "todos", label: "Todos", n: pedidos.length },
    { id: "preparo", label: "Em preparo", n: preparando.length },
    { id: "feitos", label: "Feitos", n: feitos.length },
  ];

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--fg-subtle)", fontSize: 13 }}>Carregando fila…</div>;
  }

  return (
    <div style={{ height: "100%", display: "flex", gap: 24, padding: "24px", overflow: "hidden", boxSizing: "border-box" }}>

      {/* ESQUERDA: fila */}
      <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Fila de produção</h1>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            {chips.map(c => {
              const on = filtro === c.id;
              return (
                <button key={c.id} onClick={() => setFiltro(c.id)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: "var(--r-pill)", border: "none", cursor: "pointer",
                  background: on ? "var(--accent)" : "var(--bg-card-hi)",
                  color: on ? "var(--accent-fg)" : "var(--fg-muted)", fontSize: 13, fontWeight: on ? 500 : 400,
                }}>
                  {c.label}<span style={{ color: on ? "var(--accent-fg)" : "var(--fg-subtle)" }}>{c.n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, alignContent: "start" }}>
          {filtro === "feitos" ? (
            feitos.length === 0 ? (
              <p style={{ gridColumn: "1 / -1", fontSize: 13, color: "var(--fg-subtle)", padding: "40px 0", textAlign: "center" }}>Nenhum pedido feito neste turno.</p>
            ) : feitos.map(f => (
              <div key={f.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, opacity: 0.65, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.pessoa}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-muted)" }}>{f.estado === "pronto" ? "Pronto" : "Entregue"}</span>
                </div>
                {f.pessoa !== f.mesa_label && <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{f.mesa_label}</span>}
                <div style={{ height: 1, background: "var(--border-strong)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {f.itens.map((it, i) => (
                    <span key={i} style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                      <span style={{ fontWeight: 700, color: "var(--fg)", marginRight: 6 }}>{it.quantidade}×</span>{it.produto_nome}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <>
              {visiveis.map(p => (
                <FilaCard key={p.id} pedido={p} isNew={newIds.has(p.id)} active={p.id === activeId} onClick={() => setActiveId(p.id)} />
              ))}
              {visiveis.length === 0 && (
                <p style={{ gridColumn: "1 / -1", fontSize: 13, color: "var(--fg-subtle)", padding: "40px 0", textAlign: "center" }}>Nada na fila.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* DIREITA: pedido ativo */}
      <div style={{ flex: "0 0 460px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {active ? (
          <PainelAtivo barId={barId} pedido={active} usaPronto={usaPronto} onIniciar={localIniciar} onPronto={localPronto} onCancelar={localCancelar} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", margin: 0 }}>Nenhum pedido ativo</p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Toque num pedido da fila para ver os drinks e a ficha técnica.</p>
          </div>
        )}
      </div>
    </div>
  );
}
