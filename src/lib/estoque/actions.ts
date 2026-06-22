"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { traduzirErro } from "@/lib/utils";
import type { MovimentoTipo } from "@/types/database";

export type EstoqueResult = { ok: true } | { error: string } | null;

export async function registrarMovimento(
  estoqueId: string,
  formData: FormData
): Promise<EstoqueResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const quantidadeStr = String(formData.get("quantidade") ?? "").replace(",", ".");
  const tipo = String(formData.get("tipo") ?? "") as MovimentoTipo;
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  const custoStr = String(formData.get("custo_unitario") ?? "").replace(",", ".");
  const custoUnitario = custoStr ? parseFloat(custoStr) : null;

  const quantidade = parseFloat(quantidadeStr);
  if (isNaN(quantidade) || quantidade <= 0) return { error: "Quantidade inválida." };
  if (!["compra", "ajuste", "perda", "devolucao"].includes(tipo)) return { error: "Tipo inválido." };

  const supabase = await createClient();

  // Lê estoque atual
  const { data: estoque } = await supabase
    .from("estoque")
    .select("quantidade_atual, bar_id")
    .eq("id", estoqueId)
    .eq("bar_id", current.bar.id)
    .maybeSingle<{ quantidade_atual: number; bar_id: string }>();

  if (!estoque) return { error: "Item de estoque não encontrado." };

  const anterior = Number(estoque.quantidade_atual);
  // Compra e devolução somam; perda subtrai; ajuste define o valor absoluto
  const posterior =
    tipo === "ajuste" ? quantidade :
    tipo === "perda"  ? Math.max(anterior - quantidade, 0) :
    anterior + quantidade; // compra, devolucao

  // Atualiza quantidade
  const { error: updateError } = await supabase.from("estoque")
    .update({ quantidade_atual: posterior })
    .eq("id", estoqueId);

  if (updateError) return { error: traduzirErro(updateError.message) };

  // Registra movimento (log imutável)
  await supabase.from("estoque_movimentos").insert({
    bar_id: current.bar.id,
    produto_id: null, // preenchido via join no estoque
    tipo,
    quantidade,
    quantidade_anterior: anterior,
    quantidade_posterior: posterior,
    referencia_tipo: "estoque",
    referencia_id: estoqueId,
    motivo,
    ...(custoUnitario !== null && !isNaN(custoUnitario) ? { custo_unitario: custoUnitario } : {}),
    criado_por: current.userId,
    criado_em: new Date().toISOString(),
  });

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarMinimo(
  estoqueId: string,
  formData: FormData
): Promise<EstoqueResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const minimoStr = String(formData.get("quantidade_minima") ?? "").replace(",", ".");
  const minimo = parseFloat(minimoStr);
  if (isNaN(minimo) || minimo < 0) return { error: "Valor inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("estoque")
    .update({ quantidade_minima: minimo })
    .eq("id", estoqueId)
    .eq("bar_id", current.bar.id);

  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard");
  return { ok: true };
}
