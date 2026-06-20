"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import type { Comanda } from "@/types/database";

/** Abre comanda para uma mesa específica (ou balcão se mesaId for null). */
export async function abrirComanda(mesaId: string | null) {
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
    })
    .select("id")
    .single();

  if (!novaComanda?.id) return;
  redirect(`/bartender/${novaComanda.id}`);
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
  await supabase.from("comandas")
    .update({ status: "aguardando_pagamento", fechada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .eq("status", "aberta");

  redirect("/bartender");
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
