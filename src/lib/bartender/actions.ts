"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import type { CartItem, Comanda } from "@/types/database";

/** Abre comanda para uma mesa específica (ou balcão se mesaId for null). */
export async function abrirComanda(
  mesaId: string | null,
  totalPessoas?: number,
  identificador?: string,
  nomeCliente?: string,
) {
  const current = await getCurrentBar();
  if (!current) return;

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) return;

  const supabase = await createClient();
  const { data: novaComanda } = await supabase.from("comandas")
    .insert({
      bar_id: current.bar.id,
      turno_id: turno.id,
      bartender_id: current.userId,
      mesa_id: mesaId,
      total_pessoas: totalPessoas ?? null,
      identificador: identificador ?? null,
      nome_cliente: nomeCliente?.trim() || null,
    })
    .select("id")
    .single();

  if (!novaComanda?.id) return null;
  return { id: novaComanda.id };
}

/**
 * Busca comanda aberta pelo identificador do cartão no turno atual.
 * Retorna o ID da comanda se encontrada, null caso contrário.
 */
export async function buscarComandaPorCartao(identificador: string): Promise<string | null> {
  const current = await getCurrentBar();
  if (!current) return null;

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id")
    .eq("bar_id", current.bar.id)
    .eq("turno_id", turno.id)
    .eq("identificador", identificador)
    .in("status", ["aberta", "aguardando_pagamento"])
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

export async function adicionarItem(
  produtoId: string,
  comandaId: string,
  varianteId?: string | null,
  varianteName?: string | null,
) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();

  // Se tem variante, usa o preço da variante; senão usa o preço do produto
  let preco: number;
  if (varianteId) {
    const { data: variante } = await supabase
      .from("produto_variantes")
      .select("preco")
      .eq("id", varianteId)
      .single<{ preco: number }>();
    if (!variante) return;
    preco = variante.preco;
  } else {
    const { data: produto } = await supabase
      .from("produtos")
      .select("preco")
      .eq("id", produtoId)
      .single<{ preco: number }>();
    if (!produto) return;
    preco = produto.preco;
  }

  await supabase.from("comanda_items").insert({
    comanda_id:    comandaId,
    bar_id:        current.bar.id,
    produto_id:    produtoId,
    variante_id:   varianteId ?? null,
    variante_nome: varianteName ?? null,
    quantidade:    1,
    preco_unitario: preco,
    preco_total:    preco,
    adicionado_por: current.userId,
  });

  revalidatePath(`/bartender/${comandaId}`);
}

export async function removerItem(itemId: string, comandaId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase.from("comanda_items")
    .update({
      status: "cancelado",
      cancelado_por: current.userId,
      cancelado_em: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("status", "ativo");

  revalidatePath(`/bartender/${comandaId}`);
}

export async function fecharComanda(comandaId: string) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { error } = await supabase.from("comandas")
    .update({ status: "aguardando_pagamento", fechada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .eq("bar_id", current.bar.id)
    .eq("status", "aberta");

  if (error) return { error: "Erro ao fechar comanda." };

  revalidatePath("/caixa");
  revalidatePath("/bartender");
  return { ok: true };
}

export async function cancelarComanda(comandaId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase.from("comandas")
    .update({ status: "cancelada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .eq("bar_id", current.bar.id)
    .eq("status", "aberta");

  redirect("/bartender");
}

// Usado por NovaComandaButton via form action — abre comanda de balcão (sem mesa)
export async function criarComanda(formData: FormData) {
  return abrirComanda(null);
}

export async function atenderChamada(chamadaId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase
    .from("chamadas")
    .update({ status: "atendida", atendida_em: new Date().toISOString() })
    .eq("id", chamadaId)
    .eq("bar_id", current.bar.id)
    .eq("status", "pendente");
}

// ─── Fila de produção ─────────────────────────────────────────────────────────

/**
 * Cria um pedido agrupando todos os itens do carrinho em uma única operação.
 * Cada tap no produto-grid adiciona ao carrinho local; este action persiste tudo.
 */
export async function criarPedido(
  comandaId: string,
  itens: CartItem[],
): Promise<{ ok: true; pedidoId: string } | { error: string }> {
  if (!itens.length) return { error: "Carrinho vazio." };

  const current = await getCurrentBar();
  if (!current) return { error: "Não autorizado." };

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) return { error: "Sem turno aberto." };

  const supabase = await createClient();

  // 1. Cria o pedido
  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedidos")
    .insert({
      bar_id:     current.bar.id,
      turno_id:   turno.id,
      comanda_id: comandaId,
      status:     "recebido",
    })
    .select("id")
    .single<{ id: string }>();

  if (pedidoErr || !pedido) return { error: "Erro ao criar pedido." };

  // 2. Insere comanda_items — uma linha por unidade (compatível com removerItem)
  const rows = itens.flatMap(item =>
    Array.from({ length: item.quantidade }, () => ({
      comanda_id:     comandaId,
      bar_id:         current.bar.id,
      pedido_id:      pedido.id,
      produto_id:     item.produto_id,
      variante_id:    item.variante_id ?? null,
      variante_nome:  item.variante_nome ?? null,
      quantidade:     1,
      preco_unitario: item.preco,
      preco_total:    item.preco,
      adicionado_por: current.userId,
    }))
  );

  const { error: itemsErr } = await supabase.from("comanda_items").insert(rows);
  if (itemsErr) return { error: "Erro ao inserir itens." };

  revalidatePath(`/bartender/${comandaId}`);
  return { ok: true, pedidoId: pedido.id };
}

/** Bartender inicia o preparo do pedido. */
export async function iniciarPedido(pedidoId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase
    .from("pedidos")
    .update({ status: "preparando", iniciado_em: new Date().toISOString() })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "recebido");
}

/** Bartender entrega o pedido — estado final. */
export async function entregarPedido(pedidoId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase
    .from("pedidos")
    .update({ status: "entregue", entregue_em: new Date().toISOString() })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "preparando");
}
