"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { entregarPedido } from "@/lib/bartender/actions";

interface Item { quantidade: number; nome: string; }
interface Pronto { id: string; pessoa: string; mesa_label: string; itens: Item[]; }

function ding() {
  try {
    const ctx = new AudioContext();
    const play = (f: number, s: number, d: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.3, ctx.currentTime + s);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s + d);
      o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + d);
    };
    play(988, 0, 0.1); play(1319, 0.12, 0.14);
    setTimeout(() => ctx.close(), 500);
  } catch { /* ignora */ }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([60, 40, 100]);
}

async function fetchProntos(barId: string, turnoId: string): Promise<Pronto[]> {
  const supabase = createClient();
  const { data: peds } = await supabase
    .from("pedidos")
    .select("id, comandas ( nome_cliente, identificador, mesas ( numero, nome ) )")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "pronto")
    .order("pronto_em", { ascending: true });
  if (!peds?.length) return [];

  const ids = peds.map(p => p.id);
  const { data: items } = await supabase
    .from("comanda_items")
    .select("pedido_id, quantidade, produtos ( nome )")
    .in("pedido_id", ids)
    .eq("status", "ativo");

  const byPedido = new Map<string, Item[]>();
  for (const it of items ?? []) {
    const pid = it.pedido_id as string;
    const l = byPedido.get(pid) ?? [];
    l.push({ quantidade: it.quantidade as number, nome: (it.produtos as unknown as { nome: string } | null)?.nome ?? "Produto" });
    byPedido.set(pid, l);
  }

  return peds.map(p => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (p as any).comandas as { nome_cliente: string | null; identificador: string | null; mesas: { numero: number; nome: string | null } | null } | null;
    const mesa = c?.mesas;
    const mesa_label = mesa ? (mesa.nome ?? `Mesa ${mesa.numero}`) : "Balcão";
    const pessoa = c?.nome_cliente ?? (c?.identificador && c.identificador.trim() ? `Comanda ${c.identificador.slice(-4)}` : mesa_label);
    const map = new Map<string, Item>();
    for (const it of byPedido.get(p.id) ?? []) {
      const e = map.get(it.nome); if (e) e.quantidade += it.quantidade; else map.set(it.nome, { ...it });
    }
    return { id: p.id, pessoa, mesa_label, itens: [...map.values()] };
  });
}

export function ProntosRetirar({ barId, turnoId }: { barId: string; turnoId: string }) {
  const [prontos, setProntos] = useState<Pronto[]>([]);
  const [, startTransition] = useTransition();

  const carregar = useCallback(async () => { setProntos(await fetchProntos(barId, turnoId)); }, [barId, turnoId]);

  useEffect(() => {
    carregar();
    const supabase = createClient();
    const ch = supabase
      .channel(`prontos_${barId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `bar_id=eq.${barId}` }, async (payload) => {
        const up = payload.new as { id: string; turno_id: string; status: string };
        if (up.turno_id !== turnoId) return;
        if (up.status === "pronto") { await carregar(); ding(); }
        else if (up.status === "entregue") { setProntos(prev => prev.filter(p => p.id !== up.id)); }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [barId, turnoId, carregar]);

  function entregar(id: string) {
    setProntos(prev => prev.filter(p => p.id !== id));
    startTransition(async () => { await entregarPedido(id); });
  }

  if (prontos.length === 0) return null;

  return (
    <div style={{
      flexShrink: 0, background: "color-mix(in srgb, var(--accent) 8%, var(--bg))",
      borderBottom: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
      padding: "14px 24px",
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", margin: "0 0 10px" }}>
        Prontos pra retirar · {prontos.length}
      </p>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 2 }}>
        {prontos.map(p => (
          <div key={p.id} style={{
            flex: "0 0 auto", minWidth: 220, background: "var(--bg-card)",
            border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14,
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{p.pessoa}</p>
              {p.pessoa !== p.mesa_label && <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "2px 0 0" }}>{p.mesa_label}</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {p.itens.map((it, i) => (
                <span key={i} style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                  <span style={{ fontWeight: 700, color: "var(--fg)", marginRight: 4 }}>{it.quantidade}×</span>{it.nome}
                </span>
              ))}
            </div>
            <button onClick={() => entregar(p.id)} style={{
              padding: "9px 14px", borderRadius: 999, border: "none", background: "var(--accent)",
              color: "var(--accent-fg)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Entregar →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
