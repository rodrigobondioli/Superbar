import { createClient } from "@/lib/supabase/server";
import type { PagamentoMetodo } from "@/types/database";

export interface ComandaPendente {
  id: string;
  total: number;
  aberta_em: string;
  mesa: string; // "Mesa 3" | "Balcão"
  itens: { nome: string; quantidade: number; preco_total: number }[];
}

export interface CaixaInsights {
  totalTurno: number;
  comandasPagas: number;
  ticketMedio: number;
  porMetodo: { metodo: PagamentoMetodo; total: number; quantidade: number }[];
}

export async function getComandasPendentes(barId: string, turnoId: string): Promise<ComandaPendente[]> {
  const supabase = await createClient();

  const { data: comandas } = await supabase.from("comandas")
    .select("id, total, aberta_em, mesa_id, mesas(numero, nome)")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "aguardando_pagamento")
    .order("aberta_em", { ascending: true }) as {
      data: {
        id: string;
        total: number;
        aberta_em: string;
        mesa_id: string | null;
        mesas: { numero: number; nome: string | null } | null;
      }[] | null;
    };

  if (!comandas?.length) return [];

  // Busca itens de todas as comandas de uma vez
  const ids = comandas.map(c => c.id);
  const { data: itensRaw } = await supabase.from("comanda_items")
    .select("comanda_id, quantidade, preco_total, variante_nome, produtos(nome)")
    .in("comanda_id", ids)
    .eq("status", "ativo") as {
      data: {
        comanda_id: string;
        quantidade: number;
        preco_total: number;
        variante_nome: string | null;
        produtos: { nome: string } | null;
      }[] | null;
    };

  const itensPorComanda = new Map<string, ComandaPendente["itens"]>();
  for (const item of itensRaw ?? []) {
    if (!item.produtos) continue;
    const nomeBase = item.produtos.nome;
    const nome = item.variante_nome ? `${nomeBase} — ${item.variante_nome}` : nomeBase;
    const lista = itensPorComanda.get(item.comanda_id) ?? [];
    lista.push({ nome, quantidade: item.quantidade, preco_total: item.preco_total });
    itensPorComanda.set(item.comanda_id, lista);
  }

  return comandas.map(c => ({
    id: c.id,
    total: c.total,
    aberta_em: c.aberta_em,
    mesa: c.mesas ? (c.mesas.nome ?? `Mesa ${c.mesas.numero}`) : "Balcão",
    itens: itensPorComanda.get(c.id) ?? [],
  }));
}

export async function getCaixaInsights(barId: string, turnoId: string): Promise<CaixaInsights> {
  const supabase = await createClient();

  const { data: pagamentos } = await supabase.from("pagamentos")
    .select("valor, metodo")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "confirmado") as {
      data: { valor: number; metodo: PagamentoMetodo }[] | null;
    };

  const lista = pagamentos ?? [];
  const totalTurno = lista.reduce((s, p) => s + p.valor, 0);
  const comandasPagas = lista.length;
  const ticketMedio = comandasPagas > 0 ? totalTurno / comandasPagas : 0;

  const mapaMetodo = new Map<PagamentoMetodo, { total: number; quantidade: number }>();
  for (const p of lista) {
    const atual = mapaMetodo.get(p.metodo) ?? { total: 0, quantidade: 0 };
    mapaMetodo.set(p.metodo, { total: atual.total + p.valor, quantidade: atual.quantidade + 1 });
  }

  const porMetodo = Array.from(mapaMetodo.entries()).map(([metodo, v]) => ({ metodo, ...v }));

  return { totalTurno, comandasPagas, ticketMedio, porMetodo };
}
