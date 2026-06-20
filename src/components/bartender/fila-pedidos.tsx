"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarStatusPedido } from "@/lib/menu/actions";
import type { PedidoCliente, ItemPedidoCliente } from "@/types/database";

// Semantic status colors — allowed in Bartender surface
const STATUS_LABELS: Record<PedidoCliente["status"], string> = {
  pendente:   "Novo",
  em_preparo: "Em preparo",
  pronto:     "Pronto",
  entregue:   "Entregue",
  cancelado:  "Cancelado",
};

const STATUS_COLORS: Record<PedidoCliente["status"], string> = {
  pendente:   "var(--warn)",
  em_preparo: "var(--accent-bright)",
  pronto:     "var(--ok)",
  entregue:   "var(--fg-subtle)",
  cancelado:  "var(--fg-subtle)",
};

const STATUS_BG: Record<PedidoCliente["status"], string> = {
  pendente:   "color-mix(in srgb, var(--warn) 12%, transparent)",
  em_preparo: "color-mix(in srgb, var(--accent-bright) 12%, transparent)",
  pronto:     "var(--ok-bg)",
  entregue:   "color-mix(in srgb, var(--fg) 6%, transparent)",
  cancelado:  "color-mix(in srgb, var(--fg) 4%, transparent)",
};

function tempo(created_at: string) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min`;
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? `${diff % 60}min` : ""}`;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PedidoCard({
  pedido,
  isNew,
}: {
  pedido: PedidoCliente;
  isNew: boolean;
}) {
  const [, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(pedido.status);
  const itens = pedido.itens as ItemPedidoCliente[];

  const atualizar = (novoStatus: PedidoCliente["status"]) => {
    setLocalStatus(novoStatus);
    startTransition(async () => {
      try {
        await atualizarStatusPedido(pedido.id, novoStatus as "em_preparo" | "pronto" | "entregue" | "cancelado");
      } catch {
        setLocalStatus(pedido.status);
      }
    });
  };

  const isDone = localStatus === "entregue" || localStatus === "cancelado";

  return (
    <div style={{
      background: isNew ? "color-mix(in srgb, var(--ok) 5%, transparent)" : "color-mix(in srgb, var(--fg) 4%, transparent)",
      border: isNew ? "1px solid color-mix(in srgb, var(--ok) 20%, transparent)" : "1px solid var(--border)",
      borderRadius: 8,
      padding: "18px 20px",
      opacity: isDone ? 0.45 : 1,
      transition: "opacity 400ms, border-color 600ms, background 600ms",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.3px" }}>
            {pedido.nome_cliente ?? "Cliente"}
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "3px 0 0" }}>
            Mesa · {tempo(pedido.created_at)}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4,
          background: STATUS_BG[localStatus],
          color: STATUS_COLORS[localStatus],
          letterSpacing: "0.03em",
        }}>
          {STATUS_LABELS[localStatus]}
        </span>
      </div>

      {/* Itens */}
      <div style={{ marginBottom: 16 }}>
        {itens.map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 0",
            borderBottom: i < itens.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              <span style={{ color: "var(--accent-bright)", fontWeight: 800, marginRight: 6 }}>{item.quantidade}×</span>
              {item.nome}
            </span>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
              {fmt(item.preco * item.quantidade)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Total</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: "var(--fg)", letterSpacing: "-0.4px", fontFamily: "var(--font-mono)" }}>
          {fmt(pedido.total)}
        </span>
      </div>

      {/* Ações */}
      {!isDone && (
        <div style={{ display: "flex", gap: 8 }}>
          {localStatus === "pendente" && (
            <>
              <button
                onClick={() => atualizar("cancelado")}
                style={{
                  flex: 1, padding: "11px", minHeight: 44, borderRadius: 8,
                  background: "color-mix(in srgb, var(--fg) 5%, transparent)", border: "none",
                  color: "var(--fg-muted)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => atualizar("em_preparo")}
                style={{
                  flex: 2, padding: "11px", minHeight: 44, borderRadius: 8,
                  background: "var(--accent)", border: "none",
                  color: "var(--accent-fg)", fontSize: 13, fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Aceitar →
              </button>
            </>
          )}
          {localStatus === "em_preparo" && (
            <button
              onClick={() => atualizar("pronto")}
              style={{
                flex: 1, padding: "11px", minHeight: 44, borderRadius: 8,
                background: "var(--ok-bg)",
                border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
                color: "var(--ok)", fontSize: 13, fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ✓ Marcar como pronto
            </button>
          )}
          {localStatus === "pronto" && (
            <button
              onClick={() => atualizar("entregue")}
              style={{
                flex: 1, padding: "11px", minHeight: 44, borderRadius: 8,
                background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "1px solid var(--border)",
                color: "var(--fg-muted)", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Confirmar entrega
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FilaPedidos({ barId }: { barId: string }) {
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const carregarPedidos = useCallback(async () => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("pedidos_cliente") as any)
      .select("*")
      .eq("bar_id", barId)
      .in("status", ["pendente", "em_preparo", "pronto"])
      .order("created_at", { ascending: false })
      .limit(50);
    setPedidos((data as PedidoCliente[]) ?? []);
    setLoading(false);
  }, [barId]);

  useEffect(() => {
    carregarPedidos();

    const supabase = createClient();
    const channel = supabase
      .channel(`pedidos_bar_${barId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pedidos_cliente",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const novo = payload.new as PedidoCliente;
        setPedidos((prev) => [novo, ...prev]);
        setNewIds((prev) => new Set([...prev, novo.id]));
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev);
            next.delete(novo.id);
            return next;
          });
        }, 5000);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "pedidos_cliente",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const atualizado = payload.new as PedidoCliente;
        setPedidos((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [barId, carregarPedidos]);

  const ativos   = pedidos.filter(p => p.status === "pendente" || p.status === "em_preparo");
  const prontos  = pedidos.filter(p => p.status === "pronto");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "var(--fg-subtle)", fontSize: 13 }}>
        Carregando fila...
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: 140, gap: 10,
      }}>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
          Nenhum pedido ainda. Aguardando...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ativos.length > 0 && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 4px" }}>
            {ativos.length} pedido{ativos.length > 1 ? "s" : ""} ativo{ativos.length > 1 ? "s" : ""}
          </p>
          {ativos.map(p => (
            <PedidoCard key={p.id} pedido={p} isNew={newIds.has(p.id)} />
          ))}
        </>
      )}

      {prontos.length > 0 && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", textTransform: "uppercase", letterSpacing: "0.15em", margin: "12px 0 4px" }}>
            {prontos.length} pronto{prontos.length > 1 ? "s" : ""} para entregar
          </p>
          {prontos.map(p => (
            <PedidoCard key={p.id} pedido={p} isNew={false} />
          ))}
        </>
      )}
    </div>
  );
}
