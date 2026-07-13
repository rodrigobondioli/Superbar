"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import { getComandaById, getItensComanda, agruparItens, type ItemAgrupado } from "@/lib/bartender/queries";
import type { CartItem, Comanda } from "@/types/database";

/** Detalhe de uma comanda (comanda + itens agrupados + subtotal) — usado pelo
 *  workspace do garçom pra trocar de pessoa client-side, sem recarregar a página. */
export async function getComandaDetalhe(
  comandaId: string,
): Promise<{ comanda: Comanda; itens: ItemAgrupado[]; subtotal: number } | null> {
  const [comanda, itensBrutos] = await Promise.all([
    getComandaById(comandaId),
    getItensComanda(comandaId),
  ]);
  if (!comanda) return null;
  const itens = agruparItens(itensBrutos);
  const subtotal = itens.reduce((acc, i) => acc + i.precoTotal, 0);
  return { comanda, itens, subtotal };
}

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
      aberta_por_member_id: current.atribuicaoMemberId,
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

export type PessoaComandaLite = { id: string; nome_cliente: string | null; total: number; status: string; aberta_em: string };

/** Lista as comandas abertas/aguardando de uma mesa (leitura server-side, auth'd).
 *  Usado pelo drawer da mesa pra sempre refletir o estado real sem depender do realtime. */
export async function listarComandasMesa(mesaId: string): Promise<PessoaComandaLite[]> {
  const current = await getCurrentBar();
  if (!current) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id, nome_cliente, total, status, aberta_em")
    .eq("bar_id", current.bar.id)
    .eq("mesa_id", mesaId)
    .in("status", ["aberta", "aguardando_pagamento"])
    .order("aberta_em", { ascending: true });
  return data ?? [];
}

/** Abre VÁRIAS comandas de uma vez numa mesa (uma por pessoa/nome).
 *  Nomes vazios são ignorados; se a lista vier toda vazia, abre 1 comanda anônima
 *  (caso "mesa compartilha uma conta só"). Modelo individual, Princípio 12. */
export async function abrirComandasMesa(
  mesaId: string,
  nomes: string[],
): Promise<{ ids: string[] } | { error: string }> {
  const limpos = nomes.map((n) => n.trim()).filter(Boolean);
  const alvo = limpos.length > 0 ? limpos : [""]; // vazio → 1 comanda anônima
  const ids: string[] = [];
  for (const nome of alvo) {
    const r = await abrirComanda(mesaId, 1, undefined, nome || undefined);
    if (r && "id" in r) ids.push(r.id);
    else if (r && "error" in r) return { error: r.error };
  }
  if (ids.length === 0) return { error: "Não consegui abrir as comandas." };
  revalidatePath("/garcom");
  return { ids };
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

  // 1. Identificador exato
  const { data: porCartao } = await supabase
    .from("comandas")
    .select("id, nome_cliente, identificador, mesas(nome, numero)")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("identificador", t)
    .in("status", ["aberta", "aguardando_pagamento"]);

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
    .in("status", ["aberta", "aguardando_pagamento"]);

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

  const { data: mesas } = await mesaFilter;
  const mesaIds = (mesas ?? []).map(m => m.id);

  if (!mesaIds.length) return [];

  const { data: porMesa } = await supabase
    .from("comandas")
    .select("id, nome_cliente, identificador, mesas(nome, numero)")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .in("mesa_id", mesaIds)
    .in("status", ["aberta", "aguardando_pagamento"]);

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
): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada. Faça login de novo." };

  const supabase = await createClient();

  // Se tem variante, usa o preço da variante; senão usa o preço do produto
  let preco: number;
  if (varianteId) {
    const { data: variante, error } = await supabase
      .from("produto_variantes")
      .select("preco")
      .eq("id", varianteId)
      .single<{ preco: number }>();
    if (error || !variante) return { error: "Produto não encontrado." };
    preco = variante.preco;
  } else {
    const { data: produto, error } = await supabase
      .from("produtos")
      .select("preco")
      .eq("id", produtoId)
      .single<{ preco: number }>();
    if (error || !produto) return { error: "Produto não encontrado." };
    preco = produto.preco;
  }

  // Princípio 12: item perdido em silêncio é inaceitável — checa e reporta.
  const { error: insErr } = await supabase.from("comanda_items").insert({
    comanda_id:    comandaId,
    bar_id:        current.bar.id,
    produto_id:    produtoId,
    variante_id:   varianteId ?? null,
    variante_nome: varianteName ?? null,
    quantidade:    1,
    preco_unitario: preco,
    preco_total:    preco,
    adicionado_por:           current.userId,
    adicionado_por_member_id: current.atribuicaoMemberId,
  });
  if (insErr) {
    console.error("adicionarItem: falha ao inserir item", insErr);
    return { error: "Não consegui adicionar o item. Tente de novo." };
  }

  revalidatePath(`/garcom/${comandaId}`);
  return { ok: true };
}

export async function removerItem(itemId: string, comandaId: string): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase.from("comanda_items")
    .update({
      status: "cancelado",
      cancelado_por:           current.userId,
      cancelado_por_member_id: current.atribuicaoMemberId,
      cancelado_em:            new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("status", "ativo");
  if (error) {
    console.error("removerItem: falha ao cancelar item", error);
    return { error: "Não consegui remover o item. Tente de novo." };
  }

  revalidatePath(`/garcom/${comandaId}`);
  return { ok: true };
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

/** Envia uma ou várias comandas pro caixa (status → aguardando_pagamento).
 *  Por pessoa: quem vai embora fecha, quem fica continua aberto. Só fecha as que
 *  estão 'aberta' (guard idempotente). Lá no caixa o pagamento é por tick. */
export async function enviarComandasCaixa(
  comandaIds: string[],
): Promise<{ ok: true; enviadas: number } | { error: string }> {
  const ids = [...new Set(comandaIds.filter(Boolean))];
  if (ids.length === 0) return { error: "Nenhuma comanda selecionada." };

  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comandas")
    .update({ status: "aguardando_pagamento", fechada_em: new Date().toISOString() })
    .eq("bar_id", current.bar.id)
    .eq("status", "aberta")
    .in("id", ids)
    .select("id");

  if (error) return { error: "Erro ao enviar pro caixa." };

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/garcom");
  return { ok: true, enviadas: data?.length ?? 0 };
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
export async function criarComanda(_formData: FormData) {
  return abrirComanda(null);
}

export async function atenderChamada(chamadaId: string): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("chamadas")
    .update({ status: "atendida", atendida_em: new Date().toISOString() })
    .eq("id", chamadaId)
    .eq("bar_id", current.bar.id)
    .eq("status", "pendente");
  if (error) {
    console.error("atenderChamada: falha", error);
    return { error: "Não consegui marcar como atendida." };
  }
  return { ok: true };
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

  // Uma linha por unidade (compatível com removerItem). Preço vem do servidor.
  const rows = itens.flatMap(item =>
    Array.from({ length: item.quantidade }, () => ({
      produto_id:               item.produto_id,
      variante_id:              item.variante_id ?? null,
      variante_nome:            item.variante_nome ?? null,
      quantidade:               1,
      preco_unitario:           item.preco,
      preco_total:              item.preco,
      observacao:               item.observacao?.trim() || null,
      adicionado_por:           current.userId,
      adicionado_por_member_id: current.atribuicaoMemberId,
    }))
  );

  // Pedido + itens numa transação (P1-2). Falha nos itens reverte o pedido.
  const res = await supabase
    .rpc("criar_pedido_com_itens", {
      p_bar_id:               current.bar.id,
      p_comanda_id:           comandaId,
      p_turno_id:             turno.id,
      p_itens:                rows,
      p_criado_por_member_id: current.atribuicaoMemberId,
    })
    .single();

  if (res.error) {
    console.error("criarPedido: falha no RPC transacional", res.error);
    return { error: "Erro ao criar pedido." };
  }

  const out = res.data as { ok: boolean; pedido_id?: string } | null;
  if (!out?.ok || !out.pedido_id) return { error: "Erro ao criar pedido." };

  revalidatePath(`/garcom/${comandaId}`);
  return { ok: true, pedidoId: out.pedido_id };
}

/** Bartender inicia o preparo do pedido. */
export async function iniciarPedido(pedidoId: string): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({
      status:                  "preparando",
      iniciado_em:             new Date().toISOString(),
      iniciado_por_member_id:  current.atribuicaoMemberId,
    })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "recebido");
  if (error) {
    console.error("iniciarPedido: falha", error);
    return { error: "Não consegui iniciar o preparo." };
  }
  return { ok: true };
}

/** Bartender marca o pedido como pronto — aguarda retirada pelo garçom.
 *  Sem baixa de estoque aqui: o consumo é registrado na entrega (fn_entregar_pedido). */
export async function marcarPronto(pedidoId: string): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({
      status:    "pronto",
      pronto_em: new Date().toISOString(),
    })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "preparando");
  if (error) {
    console.error("marcarPronto: falha", error);
    return { error: "Não consegui marcar como pronto." };
  }
  return { ok: true };
}

/** Cancela um pedido (erro, cliente desistiu). Sai da fila e os itens não contam. */
export async function cancelarPedido(pedidoId: string): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { error: pedErr } = await supabase
    .from("pedidos")
    .update({ status: "cancelado", cancelado_em: new Date().toISOString() })
    .eq("id", pedidoId)
    .eq("bar_id", current.bar.id)
    .in("status", ["recebido", "preparando"]);
  if (pedErr) {
    console.error("cancelarPedido: falha ao cancelar pedido", pedErr);
    return { error: "Não consegui cancelar o pedido." };
  }

  const { error: itErr } = await supabase
    .from("comanda_items")
    .update({ status: "cancelado", cancelado_em: new Date().toISOString(), cancelado_por: current.userId })
    .eq("pedido_id", pedidoId)
    .eq("bar_id", current.bar.id)
    .eq("status", "ativo");
  if (itErr) console.error("cancelarPedido: falha ao cancelar itens do pedido", itErr);

  return { ok: true };
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
    p_member_id: current.atribuicaoMemberId,
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
