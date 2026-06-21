"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { iniciarPedido, entregarPedido } from "@/lib/bartender/actions";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface ItemDoPedido {
  quantidade: number;
  variante_nome: string | null;
  produto_nome: string;
}

interface PedidoCard {
  id: string;
  status: "recebido" | "preparando";
  criado_em: string;
  mesa_label: string;
  nome_cliente: string | null;
  itens: ItemDoPedido[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? ` ${diff % 60}min` : ""}`;
}

// ─── Fetch completo de pedidos ativos ─────────────────────────────────────────

async function fetchPedidos(barId: string, turnoId: string): Promise<PedidoCard[]> {
  const supabase = createClient();

  // 1. Pedidos com comanda + mesa
  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select(`
      id, status, criado_em,
      comanda_id,
      comandas (
        nome_cliente,
        mesa_id,
        mesas ( numero, nome )
      )
    `)
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .in("status", ["recebido", "preparando"])
    .order("criado_em", { ascending: true });

  if (!pedidosRaw?.length) return [];

  const ids = pedidosRaw.map(p => p.id);

  // 2. Itens com nome do produto
  const { data: itemsRaw } = await supabase
    .from("comanda_items")
    .select(`
      pedido_id, quantidade, variante_nome,
      produtos ( nome )
    `)
    .in("pedido_id", ids)
    .eq("status", "ativo");

  // Agrupa itens por pedido_id
  const itensPorPedido = new Map<string, ItemDoPedido[]>();
  for (const item of itemsRaw ?? []) {
    const pid = item.pedido_id as string;
    const lista = itensPorPedido.get(pid) ?? [];
    lista.push({
      quantidade:   item.quantidade as number,
      variante_nome: item.variante_nome as string | null,
      produto_nome: (item.produtos as { nome: string } | null)?.nome ?? "Produto",
    });
    itensPorPedido.set(pid, lista);
  }

  // Agrega itens iguais (mesmo nome) dentro do mesmo pedido
  function agregar(itens: ItemDoPedido[]): ItemDoPedido[] {
    const map = new Map<string, ItemDoPedido>();
    for (const item of itens) {
      const label = item.variante_nome ? `${item.produto_nome} — ${item.variante_nome}` : item.produto_nome;
      const existing = map.get(label);
      if (existing) existing.quantidade += item.quantidade;
      else map.set(label, { ...item, produto_nome: label, variante_nome: null });
    }
    return [...map.values()];
  }

  return pedidosRaw.map(p => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comanda = (p as any).comandas as {
      nome_cliente: string | null;
      mesa_id: string | null;
      mesas: { numero: number; nome: string | null } | null;
    } | null;

    const mesa = comanda?.mesas;
    const mesa_label = mesa ? (mesa.nome ?? `Mesa ${mesa.numero}`) : "Balcão";

    return {
      id:           p.id,
      status:       p.status as "recebido" | "preparando",
      criado_em:    p.criado_em,
      mesa_label,
      nome_cliente: comanda?.nome_cliente ?? null,
      itens:        agregar(itensPorPedido.get(p.id) ?? []),
    };
  });
}

async function fetchPedidoById(pedidoId: string): Promise<PedidoCard | null> {
  const supabase = createClient();

  const { data: p } = await supabase
    .from("pedidos")
    .select(`
      id, status, criado_em,
      comanda_id,
      comandas (
        nome_cliente,
        mesa_id,
        mesas ( numero, nome )
      )
    `)
    .eq("id", pedidoId)
    .single();

  if (!p) return null;

  const { data: itemsRaw } = await supabase
    .from("comanda_items")
    .select("quantidade, variante_nome, produtos(nome)")
    .eq("pedido_id", pedidoId)
    .eq("status", "ativo");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comanda = (p as any).comandas as {
    nome_cliente: string | null;
    mesa_id: string | null;
    mesas: { numero: number; nome: string | null } | null;
  } | null;

  const mesa = comanda?.mesas;
  const mesa_label = mesa ? (mesa.nome ?? `Mesa ${mesa.numero}`) : "Balcão";

  const itensRaw: ItemDoPedido[] = (itemsRaw ?? []).map(i => ({
    quantidade:   i.quantidade as number,
    variante_nome: i.variante_nome as string | null,
    produto_nome: (i.produtos as { nome: string } | null)?.nome ?? "Produto",
  }));

  const map = new Map<string, ItemDoPedido>();
  for (const item of itensRaw) {
    const label = item.variante_nome ? `${item.produto_nome} — ${item.variante_nome}` : item.produto_nome;
    const existing = map.get(label);
    if (existing) existing.quantidade += item.quantidade;
    else map.set(label, { ...item, produto_nome: label, variante_nome: null });
  }

  return {
    id:           p.id,
    status:       p.status as "recebido" | "preparando",
    criado_em:    p.criado_em,
    mesa_label,
    nome_cliente: comanda?.nome_cliente ?? null,
    itens:        [...map.values()],
  };
}

// ─── Card de pedido ───────────────────────────────────────────────────────────

function PedidoCardView({
  pedido,
  isNew,
  onAtualizar,
}: {
  pedido: PedidoCard;
  isNew: boolean;
  onAtualizar: (id: string, status: "preparando" | "entregue") => void;
}) {
  const [, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(pedido.status);

  // Keep in sync if parent pushes update
  useEffect(() => { setLocalStatus(pedido.status); }, [pedido.status]);

  function avancar() {
    if (localStatus === "recebido") {
      setLocalStatus("preparando");
      startTransition(async () => {
        await iniciarPedido(pedido.id);
        onAtualizar(pedido.id, "preparando");
      });
    } else if (localStatus === "preparando") {
      startTransition(async () => {
        await entregarPedido(pedido.id);
        onAtualizar(pedido.id, "entregue");
      });
    }
  }

  const recebido = localStatus === "recebido";

  return (
    <div style={{
      background: isNew
        ? "color-mix(in srgb, var(--ok) 6%, transparent)"
        : "color-mix(in srgb, var(--fg) 4%, transparent)",
      border: `1px solid ${isNew ? "color-mix(in srgb, var(--ok) 22%, transparent)" : "var(--border)"}`,
      borderRadius: 10, padding: "16px 18px",
      transition: "background 0.5s, border-color 0.5s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.3px" }}>
            {pedido.mesa_label}
            {pedido.nome_cliente && (
              <span style={{ fontWeight: 500, color: "var(--fg-muted)" }}> · {pedido.nome_cliente}</span>
            )}
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "3px 0 0" }}>
            há {tempo(pedido.criado_em)}
          </p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "3px 9px", borderRadius: 4,
          background: recebido
            ? "color-mix(in srgb, var(--warn) 15%, transparent)"
            : "color-mix(in srgb, var(--accent-bright) 15%, transparent)",
          color: recebido ? "var(--warn)" : "var(--accent-bright)",
        }}>
          {recebido ? "Novo" : "Preparando"}
        </span>
      </div>

      {/* Itens */}
      <div style={{ marginBottom: 14 }}>
        {pedido.itens.map((item, i) => (
          <p
            key={i}
            style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 4px", lineHeight: 1.4 }}
          >
            <span style={{ fontWeight: 800, color: "var(--fg)", marginRight: 6 }}>
              {item.quantidade}×
            </span>
            {item.produto_nome}
          </p>
        ))}
      </div>

      {/* Botão */}
      <button
        type="button"
        onClick={avancar}
        style={{
          width: "100%", padding: "12px", minHeight: 48, borderRadius: 8, border: "none",
          background: recebido ? "var(--accent)" : "color-mix(in srgb, var(--ok) 80%, transparent)",
          color: recebido ? "var(--accent-fg)" : "#fff",
          fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: "-0.2px",
          transition: "background 0.15s",
        }}
      >
        {recebido ? "Iniciar →" : "✓ Entregue"}
      </button>
    </div>
  );
}

// ─── Tab de produção ──────────────────────────────────────────────────────────

export function ProducaoTab({ barId, turnoId }: { barId: string; turnoId: string }) {
  const [pedidos, setPedidos] = useState<PedidoCard[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0); // força re-render a cada minuto para atualizar "há X min"

  const carregar = useCallback(async () => {
    const lista = await fetchPedidos(barId, turnoId);
    setPedidos(lista);
    setLoading(false);
  }, [barId, turnoId]);

  useEffect(() => {
    carregar();

    // Atualiza timestamps a cada minuto
    const timer = setInterval(() => setTick(t => t + 1), 60_000);

    const supabase = createClient();
    const channel = supabase
      .channel(`producao_${barId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pedidos",
        filter: `bar_id=eq.${barId}`,
      }, async (payload) => {
        const novo = payload.new as { id: string; turno_id: string; status: string };
        if (novo.turno_id !== turnoId) return;
        const card = await fetchPedidoById(novo.id);
        if (!card) return;
        setPedidos(prev => [...prev, card]);
        setNewIds(prev => new Set([...prev, card.id]));
        setTimeout(() => {
          setNewIds(prev => { const n = new Set(prev); n.delete(card.id); return n; });
        }, 6000);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "pedidos",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const atualizado = payload.new as { id: string; status: string };
        setPedidos(prev =>
          atualizado.status === "entregue"
            ? prev.filter(p => p.id !== atualizado.id)
            : prev.map(p =>
                p.id === atualizado.id
                  ? { ...p, status: atualizado.status as "recebido" | "preparando" }
                  : p
              )
        );
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [barId, turnoId, carregar]);

  // Suprime warning do ESLint sobre tick não usado no JSX
  void tick;

  function handleAtualizar(id: string, status: "preparando" | "entregue") {
    if (status === "entregue") {
      setPedidos(prev => prev.filter(p => p.id !== id));
    } else {
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    }
  }

  const recebidos  = pedidos.filter(p => p.status === "recebido");
  const preparando = pedidos.filter(p => p.status === "preparando");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--fg-subtle)", fontSize: 13 }}>
        Carregando fila...
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, paddingTop: 60 }}>
        <p style={{ fontSize: 28 }}>🍹</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-muted)", margin: 0 }}>Nenhum pedido em aberto</p>
        <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>Confirme pedidos na tela de comandas para vê-los aqui.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", flex: 1 }}>

      {recebidos.length > 0 && (
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px" }}>
            Recebidos ({recebidos.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recebidos.map(p => (
              <PedidoCardView
                key={p.id}
                pedido={p}
                isNew={newIds.has(p.id)}
                onAtualizar={handleAtualizar}
              />
            ))}
          </div>
        </section>
      )}

      {preparando.length > 0 && (
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-bright)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px" }}>
            Em preparo ({preparando.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {preparando.map(p => (
              <PedidoCardView
                key={p.id}
                pedido={p}
                isNew={false}
                onAtualizar={handleAtualizar}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
