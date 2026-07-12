"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getImagemAutomatica } from "./drink-images";
import { normalizarNome } from "./import-types";
import type { ProdutoPreview, ProdutoSalvo } from "./import-types";
import type { CustoStatus } from "@/types/database";

// ─── Salvar produtos importados ───────────────────────────────────────────────

export async function salvarProdutosImportados(
  barId: string,
  produtos: ProdutoPreview[]
): Promise<{ salvos: ProdutoSalvo[] } | { error: string }> {
  const current = await getCurrentBar();
  if (!current || current.bar.id !== barId) return { error: "Não autorizado." };
  if (produtos.length === 0) return { salvos: [] };

  const supabase = await createClient();

  // Coletar categorias únicas
  const nomesCat = [
    ...new Set(produtos.map((p) => p.categoria).filter(Boolean)),
  ] as string[];

  // Buscar categorias existentes
  const { data: existingCats } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .returns<{ id: string; nome: string }[]>();

  const catMap: Record<string, string> = {};
  for (const c of existingCats ?? []) catMap[c.nome] = c.id;

  // Criar categorias faltantes
  const { data: maxOrdemRow } = await supabase
    .from("categorias")
    .select("ordem")
    .eq("bar_id", barId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle<{ ordem: number }>();
  let ordem = (maxOrdemRow?.ordem ?? 0) + 1;

  for (const nome of nomesCat) {
    if (!catMap[nome]) {
      const { data: novaCat } = await supabase.from("categorias")
        .insert({ bar_id: barId, nome, ordem, ativo: true })
        .select("id")
        .single();
      if (novaCat?.id) {
        catMap[nome] = novaCat.id;
        ordem++;
      }
    }
  }

  // Inserir produtos
  const toInsert = produtos.map((p) => ({
    bar_id: barId,
    nome: p.nome,
    preco: p.preco_venda ?? 0,
    custo: p.custo ?? null,
    custo_status: (p.custo != null ? "confirmada" : "sem") as CustoStatus,
    descricao: p.descricao ?? null,
    categoria_id: p.categoria ? (catMap[p.categoria] ?? null) : null,
    imagem_url: getImagemAutomatica(p.nome),
    ativo: true,
    controla_estoque: false,
  }));

  const { data: inserted, error } = await supabase.from("produtos")
    .insert(toInsert)
    .select("id, nome, custo");

  if (error || !inserted) return { error: "Erro ao salvar produtos." };

  revalidatePath("/dashboard/cardapio");
  revalidatePath("/dashboard");

  return {
    salvos: (
      inserted as { id: string; nome: string; custo: number | null }[]
    ).map((p) => ({
      id: p.id,
      nome: p.nome,
      temCusto: p.custo !== null,
    })),
  };
}

// ─── Salvar custos individualmente ────────────────────────────────────────────

export async function salvarCustosProdutos(
  custos: { id: string; custo: number }[]
): Promise<void> {
  if (custos.length === 0) return;

  const supabase = await createClient();

  await Promise.all(
    custos.map(({ id, custo }) =>
      supabase.from("produtos").update({ custo, custo_status: "confirmada" }).eq("id", id)
    )
  );

  revalidatePath("/dashboard/cardapio");
  revalidatePath("/dashboard");
}

// ─── Merge para re-importação nas settings ────────────────────────────────────

export async function mergeImportacao(
  barId: string,
  produtos: ProdutoPreview[],
  decisoes: Record<string, "atualizar" | "ignorar">
): Promise<{ adicionados: number; atualizados: number } | { error: string }> {
  const current = await getCurrentBar();
  if (!current || current.bar.id !== barId) return { error: "Não autorizado." };

  const supabase = await createClient();

  const { data: existentes } = await supabase
    .from("produtos")
    .select("id, nome")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .returns<{ id: string; nome: string }[]>();

  const existenteMap: Record<string, string> = {};
  for (const p of existentes ?? []) {
    existenteMap[normalizarNome(p.nome)] = p.id;
  }

  const novos: ProdutoPreview[] = [];
  const atualizacoes: { id: string; produto: ProdutoPreview }[] = [];

  for (const produto of produtos) {
    const normalizado = normalizarNome(produto.nome);
    const idExistente = existenteMap[normalizado];
    if (idExistente) {
      if (decisoes[normalizado] === "atualizar") {
        atualizacoes.push({ id: idExistente, produto });
      }
    } else {
      novos.push(produto);
    }
  }

  // Adicionar novos
  let adicionados = 0;
  if (novos.length > 0) {
    const result = await salvarProdutosImportados(barId, novos);
    if ("error" in result) return { error: result.error };
    adicionados = result.salvos.length;
  }

  // Atualizar existentes (só preço e custo)
  let atualizados = 0;
  for (const { id, produto } of atualizacoes) {
    const campos: { preco?: number; custo?: number; custo_status?: string } = {};
    if (produto.preco_venda !== null) campos.preco = produto.preco_venda;
    if (produto.custo !== null) { campos.custo = produto.custo; campos.custo_status = "confirmada"; }
    if (Object.keys(campos).length > 0) {
      await supabase.from("produtos").update(campos).eq("id", id);
      atualizados++;
    }
  }

  revalidatePath("/dashboard/cardapio");
  revalidatePath("/dashboard");

  return { adicionados, atualizados };
}
