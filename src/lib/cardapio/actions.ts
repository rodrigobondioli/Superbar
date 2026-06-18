"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getImagemAutomatica } from "./drink-images";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function semTipo<T>(q: T): any { return q; }

// ─── Categorias ───────────────────────────────────────────────────────────────

export async function criarCategoria(formData: FormData) {
  const current = await getCurrentBar();
  if (!current) return;

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const supabase = await createClient();

  // pega próxima ordem
  const { data: ultima } = await supabase
    .from("categorias")
    .select("ordem")
    .eq("bar_id", current.bar.id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle<{ ordem: number }>();

  await semTipo(supabase.from("categorias")).insert({
    bar_id: current.bar.id,
    nome,
    ordem: (ultima?.ordem ?? 0) + 1,
    ativo: true,
  });

  revalidatePath("/dashboard/cardapio");
}

export async function editarCategoria(id: string, formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const supabase = await createClient();
  await semTipo(supabase.from("categorias")).update({ nome }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

export async function desativarCategoria(id: string) {
  const supabase = await createClient();
  await semTipo(supabase.from("categorias")).update({ ativo: false }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

// ─── Produtos ─────────────────────────────────────────────────────────────────

export async function criarProduto(formData: FormData) {
  const current = await getCurrentBar();
  if (!current) return;

  const nome        = String(formData.get("nome") ?? "").trim();
  const precoStr    = String(formData.get("preco") ?? "").replace(",", ".");
  const categoriaId = String(formData.get("categoria_id") ?? "").trim() || null;
  const descricao   = String(formData.get("descricao") ?? "").trim() || null;
  let   imagemUrl   = String(formData.get("imagem_url") ?? "").trim() || null;

  if (!nome || isNaN(parseFloat(precoStr))) return;

  // auto-imagem se não fornecida
  if (!imagemUrl) imagemUrl = getImagemAutomatica(nome);

  const supabase = await createClient();
  await semTipo(supabase.from("produtos")).insert({
    bar_id:       current.bar.id,
    categoria_id: categoriaId,
    nome,
    preco:        parseFloat(precoStr),
    descricao,
    imagem_url:   imagemUrl,
    ativo:        true,
    controla_estoque: false,
  });

  revalidatePath("/dashboard/cardapio");
}

export async function editarProduto(id: string, formData: FormData) {
  const nome        = String(formData.get("nome") ?? "").trim();
  const precoStr    = String(formData.get("preco") ?? "").replace(",", ".");
  const categoriaId = String(formData.get("categoria_id") ?? "").trim() || null;
  const descricao   = String(formData.get("descricao") ?? "").trim() || null;
  let   imagemUrl   = String(formData.get("imagem_url") ?? "").trim() || null;

  if (!nome || isNaN(parseFloat(precoStr))) return;

  if (!imagemUrl) imagemUrl = getImagemAutomatica(nome);

  const supabase = await createClient();
  await semTipo(supabase.from("produtos")).update({
    nome,
    preco:        parseFloat(precoStr),
    categoria_id: categoriaId,
    descricao,
    imagem_url:   imagemUrl,
  }).eq("id", id);

  revalidatePath("/dashboard/cardapio");
}

export async function toggleProduto(id: string, ativo: boolean) {
  const supabase = await createClient();
  await semTipo(supabase.from("produtos")).update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}
