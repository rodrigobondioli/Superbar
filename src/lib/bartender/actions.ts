"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import type { Comanda } from "@/types/database";

/** Abre comanda para uma mesa específica (ou balcão se mesaId for null). */
export async function abrirComanda(
  mesaId: string | null,
  totalPessoas?: number,
  identificador?: string,
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
    })
    .select("id")
    .single();

  if (!novaComanda?.id) return;
  redirect(`/bartender/${novaComanda.id}`);
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
  const supabase = await createClient();
  const { error } = await supabase.from("comandas")
    .update({ status: "aguardando_pagamento", fechada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .eq("status", "aberta");

  if (error) return { error: "Erro ao fechar comanda." };

  revalidatePath("/caixa");
  revalidatePath("/bartender");
  return { ok: true };
}

export async function cancelarComanda(comandaId: string) {
  const supabase = await createClient();
  await supabase.from("comandas")
    .update({ status: "cancelada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .eq("status", "aberta");

  redirect("/bartender");
}

// kept for backwards compat
export async function criarComanda(formData: FormData) {
  return abrirComanda(null);
}
