"use server";

import { createClient } from "@/lib/supabase/server";
import type { ItemPedidoCliente } from "@/types/database";
import type { Json } from "@/types/supabase";

interface SubmeterPedidoInput {
  barId: string;
  mesaId: string;
  nomeCliente: string | null;
  itens: ItemPedidoCliente[];
}

export async function submeterPedido({
  barId,
  mesaId,
  nomeCliente,
  itens,
}: SubmeterPedidoInput): Promise<string> {
  const supabase = await createClient();

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  const { data, error } = await supabase.from("pedidos_cliente")
    .insert({
      bar_id: barId,
      mesa_id: mesaId,
      nome_cliente: nomeCliente,
      itens: itens as unknown as Json, // coluna jsonb — shape validado no app
      total,
      status: "pendente",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function pedirConta(
  barId: string,
  mesaId: string,
): Promise<{ ok: boolean; total?: number }> {
  const supabase = await createClient();

  // Busca comanda aberta desta mesa
  const { data: comanda } = await supabase.from("comandas")
    .select("id, total")
    .eq("bar_id", barId)
    .eq("mesa_id", mesaId)
    .eq("status", "aberta")
    .maybeSingle() as { data: { id: string; total: number } | null };

  if (comanda) {
    await supabase.from("comandas")
      .update({ status: "aguardando_pagamento" })
      .eq("id", comanda.id);
    return { ok: true, total: comanda.total };
  }

  // Se não há comanda aberta (pedidos ainda em fila), ok na mesma
  // — o garçom vai atender
  return { ok: true };
}

export async function atualizarStatusPedido(
  pedidoId: string,
  status: "em_preparo" | "pronto" | "entregue" | "cancelado"
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pedidos_cliente")
    .update({ status })
    .eq("id", pedidoId);
  if (error) throw new Error(error.message);
}
