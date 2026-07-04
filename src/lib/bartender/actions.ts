"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import type { CartItem, Comanda } from "@/types/database";

/** Abre comanda para uma mesa específica (ou balcão se mesaId for null). */
export async function abrirComanda(
  mesaId: string | null,
  totalPessoas?: number,
  identificador?: string,
  nomeCliente?: string,
): Promise<{ id: string } | { error: string } | null> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada. Faça login novamente." };

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) return { error: "Erro ao iniciar turno." };

  const supabase = await createClient();

  // Auto-link cliente pelo identificador QR/NFC
  let clienteId: string | null = null;
  if (identificador?.trim()) {
    const token = identificador.trim();
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("bar_id", current.bar.id)
      .eq("identificador", token)
      .maybeSingle<{ id: string }>();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else if (nomeCliente?.trim()) {
      // Cria cliente automaticamente na primeira vez que o cartão aparece
      const { data: novoCliente } = await supabase
        .from("clientes")
        .insert({ bar_id: current.bar.id, identificador: token, nome: nomeCliente.trim() })
        .select("id")
        .single<{ id: string }>();
      clienteId = novoCliente?.id ?? null;
    }
  }

  const { data: novaComanda, error: dbError } = await supabase.from("comandas")
    .insert({
      bar_id: current.bar.id,
      turno_id: turno.id,
      bartender_id: current.userId,
      aberta_por_member_id: current.memberId,
      mesa_id: mesaId,
      total_pessoas: totalPessoas ?? null,
      identificador: identificador ?? null,
      nome_cliente: nomeCliente?.trim() || null,
      cliente_id: clienteId,
    })
    .select("id")
    .single();

  if (!novaComanda?.id) return { error: dbError?.message ?? "Erro ao inserir comanda no banco." };
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

export type ResultadoBusca = {
  id: string;
  label: string; // Ex: "Mesa 3 — Ana" ou "Balcão — João"
};

/**
 * Busca comanda ativa por:
 *  1. identificador exato (cartão NFC/QR)
 *  2. nome do cliente (ilike)
 *  3. nome ou número da mesa (ilike no nome, ou número exato)
 */
export async function buscarComandaAtiva(termo: string): Promise<ResultadoBusca[]> {
  const current = await getCurrentBar();
  if (!current) return [];

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) return [];

  const supabase = await createClient();
  const barId   = current.bar.id;
  const turnoId = turno.id;
  const t       = termo.trim();
  if (!t) return [];

  type Row = {
    id: string;
    nome_cliente: string | null;
    identificador: string | null;
    mesas: { nome: string | null; numero: number | null } | null;
  };

  // 1. Identificador exato
  const { data: porCartao } = await supabase
    .from("comandas")
    .select("id, nome_cliente, identificador, mesas(nome, numero)")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("identificador", t)
    .in("status", ["aberta", "aguardando_pagamento"])
    .returns<Row[]>();

  if (porCartao?.length) {
    return porCartao.map(c => ({
      id: c.id,
      label: buildLabel(c),
    }));
  }

  // 2. Nome do cliente (ilike)
  const { data: porNome } = await supabase
    .from("comandas")
    .select("id, nome_cliente, identificador, mesas(nome, numero)")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .ilike("nome_cliente", `%${t}%`)
    .in("status", ["aberta", "aguardando_pagamento"])
    .returns<Row[]>();

  if (porNome?.length) {
    return porNome.map(c => ({ id: c.id, label: buildLabel(c) }));
  }

  // 3. Mesa por nome ou número
  const numMesa = parseInt(t, 10);
  const mesaQuery = supabase
    .from("mesas")
    .select("id")
    .eq("bar_id", barId);

  const mesaFilter = isNaN(numMesa)
    ? mesaQuery.ilike("nome", `%${t}%`)
    : mesaQuery.or(`nome.ilike.%${t}%,numero.eq.${numMesa}`);

  const { data: mesas } = await mesaFilter.returns<{ id: string }[]>();
  const mesaIds = (mesas ?? []).map(m => m.id);

  if (!mesaIds.length) return [];

  const { data: porMesa } = await supabase
    .from("comandas")
    .select("id, nome_cliente, identificador, mesas(nome, numero)")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .in("mesa_id", mesaIds)
    .in("status", ["aberta", "aguardando_pagamento"])
    .returns<Row[]>();

  return (porMesa ?? []).map(c => ({ id: c.id, label: buildLabel(c) }));
}

function buildLabel(c: { nome_cliente: string | null; mesas: { nome: string | null; numero: number | null } | null }): string {
  const mesa = c.mesas
    ? (c.mesas.nome ?? `Mesa ${c.mesas.numero}`)
    : "Balcão";
  return c.nome_cliente ? `${mesa} — ${c.nome_cliente}` : mesa;
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
    adicionado_por:           current.userId,
    adicionado_por_member_id: current.memberId,
  });

  revalidatePath(`/garcom/${comandaId}`);
}

export async function removerItem(itemId: string, comandaId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase.from("comanda_items")
    .update({
      status: "cancelado",
      cancelado_por:           current.userId,
      cancelado_por_member_id: current.memberId,
      cancelado_em:            new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("status", "ativo");

  revalidatePath(`/garcom/${comandaId}`);
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
  revalidatePath("/dashboard/caixa");
  revalidatePath("/garcom");
  return { ok: true };
}

export async function cancelarComanda(
  comandaId: string,
): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase.from("comandas")
    .update({ status: "cancelada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .eq("bar_id", current.bar.id)
    .eq("status", "aberta");

  if (error) return { error: "Erro ao cancelar comanda." };

  revalidatePath("/garcom");
  return { ok: true };
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
      bar_id:               current.bar.id,
      turno_id:             turno.id,
      comanda_id:           comandaId,
      status:               "recebido",
      criado_por_member_id: current.memberId,
    })
    .select("id")
    .single<{ id: string }>();

  if (pedidoErr || !pedido) return { error: "Erro ao criar pedido." };

  // 2. Insere comanda_items — uma linha por unidade (compatível com removerItem)
  const rows = itens.flatMap(item =>
    Array.from({ length: item.quantidade }, () => ({
      comanda_id:               comandaId,
      bar_id:                   current.bar.id,
      pedido_id:                pedido.id,
      produto_id:               item.produto_id,
      variante_id:              item.variante_id ?? null,
      variante_nome:            item.variante_nome ?? null,
      quantidade:               1,
      preco_unitario:           item.preco,
      preco_total:              item.preco,
      adicionado_por:           current.userId,
      adicionado_por_member_id: current.memberId,
    }))
  );

  const { error: itemsErr } = await supabase.from("comanda_items").insert(rows);
  if (itemsErr) return { error: "Erro ao inserir itens." };

  revalidatePath(`/garcom/${comandaId}`);
  return { ok: true, pedidoId: pedido.id };
}

/** Bartender inicia o preparo do pedido. */
export async function iniciarPedido(pedidoId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase
    .from("pedidos")
    .update({
      status:                  "preparando",
      iniciado_em:             new Date().toISOString(),
      iniciado_por_member_id:  current.memberId,
    })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "recebido");
}

/** Bartender marca o pedido como pronto — aguarda retirada pelo garçom.
 *  Sem baixa de estoque aqui: o consumo é registrado na entrega (fn_entregar_pedido). */
export async function marcarPronto(pedidoId: string) {
  const current = await getCurrentBar();
  if (!current) return;

  const supabase = await createClient();
  await supabase
    .from("pedidos")
    .update({
      status:    "pronto",
      pronto_em: new Date().toISOString(),
    })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "preparando");
}

/** Bartender entrega o pedido — estado final.
 *
 * Chama fn_entregar_pedido() que, numa única transação:
 *   1. Atualiza pedido → entregue
 *   2. Percorre comanda_items → receitas
 *   3. Cria ingrediente_movimentos (baixa de estoque)
 *   4. Decrementa ingredientes.estoque_atual
 *   5. Retorna alertas de estoque baixo
 *
 * Produtos sem receita cadastrada: sem baixa, sem erro.
 */
export async function entregarPedido(
  pedidoId: string,
): Promise<{ ok: true; alertas: EstoqueAlerta[] } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autorizado." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_entregar_pedido", {
    p_pedido_id: pedidoId,
    p_user_id:   current.userId,
    p_member_id: current.memberId,
  });

  if (error)       return { error: error.message };
  if (!data?.ok)   return { error: data?.error ?? "Erro ao entregar pedido." };

  return { ok: true, alertas: data.alertas ?? [] };
}

/** Ingrediente abaixo do mínimo — retornado por entregarPedido(). */
export interface EstoqueAlerta {
  ingrediente_id: string;
  nome:           string;
  estoque_atual:  number;
  estoque_minimo: number;
}
