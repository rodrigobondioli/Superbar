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
  const update: { nome: string; imagem_url?: string | null } = { nome };
  if (formData.has("imagem_url")) {
    update.imagem_url = String(formData.get("imagem_url") ?? "").trim() || null;
  }
  await supabase.from("categorias").update(update).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

/** Persiste a nova ordem das categorias (drag-and-drop na lista).
 *  A ordem aqui é a mesma que o cliente vê no app (que ordena por `ordem`). */
export async function reordenarCategorias(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, i) => supabase.from("categorias").update({ ordem: i + 1 }).eq("id", id)),
  );
  revalidatePath("/dashboard/cardapio");
}

/** Salva só a foto da categoria (thumb clicável na lista, sem abrir o editor). */
export async function atualizarFotoCategoria(id: string, imagemUrl: string | null) {
  const supabase = await createClient();
  await supabase.from("categorias").update({ imagem_url: imagemUrl }).eq("id", id);
  revalidatePath("/dashboard/cardapio");
}

/** Liga/desliga o "destaque" de um produto (vira Assinatura da casa no app do cliente). */
export async function toggleDestaque(id: string, destaque: boolean) {
  const supabase = await createClient();
  await supabase.from("produtos").update({ destaque: !destaque }).eq("id", id);
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
    custo_status: custo != null ? "confirmada" : "sem",
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
    custo_status: custo != null ? "confirmada" : "sem",
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
    custo_status: custo != null ? "confirmada" : "sem",
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
    custo_status: custo != null ? "confirmada" : "sem",
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

/** Porta B do onboarding: cria vários produtos clássicos de uma vez.
 *  items: nome + categoria (+ preço opcional). Custo fica vazio (sem ficha ainda). */
export async function criarProdutosClassicos(
  items: { nome: string; categoria: string; preco?: number | null }[],
): Promise<{ ok: true; criados: number } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  const validos = items.filter((i) => i.nome.trim());
  if (validos.length === 0) return { ok: true, criados: 0 };

  const supabase = await createClient();
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Categorias que já existem — casa por sinônimo (Drinks ≈ Drinques ≈ Coquetéis)
  // pra NÃO criar categoria duplicada em inglês.
  const { data: existentes } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("bar_id", current.bar.id)
    .returns<{ id: string; nome: string }[]>();
  const existentesN = (existentes ?? []).map((c) => ({ id: c.id, n: norm(c.nome) }));

  const { data: ultima } = await supabase
    .from("categorias")
    .select("ordem")
    .eq("bar_id", current.bar.id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle<{ ordem: number }>();
  let ordem = (ultima?.ordem ?? 0) + 1;

  const resolvido = new Map<string, string>(); // nome-do-clássico → categoria_id
  const nomesCat = [...new Set(validos.map((i) => i.categoria))];
  for (const nome of nomesCat) {
    const alvo = norm(nome);
    const isNaoAlc = alvo.includes("nao alco") || alvo.includes("sem alco");
    let match = existentesN.find((c) => c.n === alvo);
    if (!match) {
      match = existentesN.find((c) => isNaoAlc
        ? (c.n.includes("nao alco") || c.n.includes("sem alco"))
        : (c.n.includes("drink") || c.n.includes("drinque") || c.n.includes("coquete") || c.n.includes("cocktail")));
    }
    if (match) { resolvido.set(nome, match.id); continue; }
    const { data: nova } = await supabase
      .from("categorias")
      .insert({ bar_id: current.bar.id, nome, ordem: ordem++, ativo: true })
      .select("id")
      .single<{ id: string }>();
    if (nova) { resolvido.set(nome, nova.id); existentesN.push({ id: nova.id, n: alvo }); }
  }

  const rows = validos.map((i) => ({
    bar_id: current.bar.id,
    categoria_id: resolvido.get(i.categoria) ?? null,
    nome: i.nome.trim(),
    preco: i.preco != null && i.preco > 0 ? i.preco : 0,
    custo: null,
    custo_status: "sem" as const,
    descricao: null,
    imagem_url: getImagemAutomatica(i.nome),
    ativo: true,
    controla_estoque: false,
  }));

  const { error } = await supabase.from("produtos").insert(rows);
  if (error) return { error: "Erro ao criar os produtos." };

  revalidatePath("/dashboard/cardapio");
  return { ok: true, criados: rows.length };
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
