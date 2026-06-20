"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getImagemAutomatica } from "./drink-images";

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

  await supabase.from("categorias").insert({
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
  await supabase.from("categorias").update({ nome }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

export async function desativarCategoria(id: string) {
  const supabase = await createClient();
  await supabase.from("categorias").update({ ativo: false }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

// ─── Produtos ─────────────────────────────────────────────────────────────────

export async function criarProduto(formData: FormData) {
  const current = await getCurrentBar();
  if (!current) return;

  const nome        = String(formData.get("nome") ?? "").trim();
  const precoStr    = String(formData.get("preco") ?? "").replace(",", ".");
  const custoStr    = String(formData.get("custo") ?? "").replace(",", ".");
  const categoriaId = String(formData.get("categoria_id") ?? "").trim() || null;
  const descricao   = String(formData.get("descricao") ?? "").trim() || null;
  let   imagemUrl   = String(formData.get("imagem_url") ?? "").trim() || null;

  if (!nome || isNaN(parseFloat(precoStr))) return;

  // auto-imagem se não fornecida
  if (!imagemUrl) imagemUrl = getImagemAutomatica(nome);

  const custo = custoStr && !isNaN(parseFloat(custoStr)) ? parseFloat(custoStr) : null;

  const supabase = await createClient();
  await supabase.from("produtos").insert({
    bar_id:       current.bar.id,
    categoria_id: categoriaId,
    nome,
    preco:        parseFloat(precoStr),
    custo,
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
  const custoStr    = String(formData.get("custo") ?? "").replace(",", ".");
  const categoriaId = String(formData.get("categoria_id") ?? "").trim() || null;
  const descricao   = String(formData.get("descricao") ?? "").trim() || null;
  let   imagemUrl   = String(formData.get("imagem_url") ?? "").trim() || null;

  if (!nome || isNaN(parseFloat(precoStr))) return;

  if (!imagemUrl) imagemUrl = getImagemAutomatica(nome);

  const custo = custoStr && !isNaN(parseFloat(custoStr)) ? parseFloat(custoStr) : null;

  const supabase = await createClient();
  await supabase.from("produtos").update({
    nome,
    preco:        parseFloat(precoStr),
    custo,
    categoria_id: categoriaId,
    descricao,
    imagem_url:   imagemUrl,
  }).eq("id", id);

  revalidatePath("/dashboard/cardapio");
}

// ─── Variantes ────────────────────────────────────────────────────────────────

export async function criarVariante(produtoId: string, formData: FormData) {
  const nome      = String(formData.get("nome") ?? "").trim();
  const precoStr  = String(formData.get("preco") ?? "").replace(",", ".");
  const custoStr  = String(formData.get("custo") ?? "").replace(",", ".");
  const imagemUrl = String(formData.get("imagem_url") ?? "").trim() || null;

  if (!nome || isNaN(parseFloat(precoStr))) return;

  const custo = custoStr && !isNaN(parseFloat(custoStr)) ? parseFloat(custoStr) : null;

  const supabase = await createClient();

  // próxima ordem
  const { data: ultima } = await supabase
    .from("produto_variantes")
    .select("ordem")
    .eq("produto_id", produtoId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle<{ ordem: number }>();

  await supabase.from("produto_variantes").insert({
    produto_id:  produtoId,
    nome,
    preco:       parseFloat(precoStr),
    custo,
    imagem_url:  imagemUrl,
    ativo:       true,
    ordem:       (ultima?.ordem ?? 0) + 1,
  });

  revalidatePath("/dashboard/cardapio");
}

export async function editarVariante(varianteId: string, formData: FormData) {
  const nome      = String(formData.get("nome") ?? "").trim();
  const precoStr  = String(formData.get("preco") ?? "").replace(",", ".");
  const custoStr  = String(formData.get("custo") ?? "").replace(",", ".");
  const imagemUrl = String(formData.get("imagem_url") ?? "").trim() || null;

  if (!nome || isNaN(parseFloat(precoStr))) return;

  const custo = custoStr && !isNaN(parseFloat(custoStr)) ? parseFloat(custoStr) : null;

  const supabase = await createClient();
  await supabase.from("produto_variantes").update({
    nome,
    preco:      parseFloat(precoStr),
    custo,
    imagem_url: imagemUrl,
  }).eq("id", varianteId);

  revalidatePath("/dashboard/cardapio");
}

export async function deletarVariante(varianteId: string) {
  const supabase = await createClient();
  await supabase.from("produto_variantes")
    .update({ ativo: false })
    .eq("id", varianteId);

  revalidatePath("/dashboard/cardapio");
}

export async function toggleProduto(id: string, ativo: boolean) {
  const supabase = await createClient();
  await supabase.from("produtos").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

export async function deletarProduto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  // Se tiver FK em itens_comanda, desativa em vez de deletar
  if (error) {
    await supabase.from("produtos").update({ ativo: false }).eq("id", id);
  }
  revalidatePath("/dashboard/cardapio");
}
