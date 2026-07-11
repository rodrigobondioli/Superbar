"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { parseNfe, unidadeBase } from "@/lib/nfe/parse";

const ROLES_OK = ["dono", "gerente", "bar_manager"];

export interface InsumoRef {
  id: string;
  nome: string;
  unidade: string;
  custo_atual: number;
}

export interface PreviewItem {
  cprod: string | null;
  gtin: string | null;
  nome: string;
  unidadeNota: string;
  unidadeSugerida: string;   // unidade-base sugerida p/ insumo novo
  quantidade: number;
  custoUnitario: number;
  sugeridoIngredienteId: string | null;  // casamento automático (GTIN/nome)
  custoAtual: number | null;              // custo hoje do insumo casado
}

export interface NfePreview {
  fornecedor: { cnpj: string | null; nome: string | null };
  chaveNfe: string | null;
  jaImportada: boolean;
  itens: PreviewItem[];
  insumos: InsumoRef[];       // p/ o dropdown de casamento manual
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

export async function previewNfe(xml: string): Promise<{ ok: true; preview: NfePreview } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  if (!ROLES_OK.includes(current.role)) return { error: "Sem permissão para importar." };

  let parsed;
  try { parsed = parseNfe(xml); }
  catch (e) { return { error: e instanceof Error ? e.message : "XML inválido." }; }

  const admin = createAdminClient();

  const { data: insumosRaw } = await admin
    .from("ingredientes")
    .select("id, nome, unidade, custo_atual")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true);
  const insumos: InsumoRef[] = (insumosRaw ?? []) as InsumoRef[];

  const { data: mapRaw } = await admin
    .from("nfe_item_map")
    .select("chave, ingrediente_id")
    .eq("bar_id", current.bar.id);
  const gtinMap = new Map<string, string>();
  for (const m of (mapRaw ?? []) as { chave: string; ingrediente_id: string }[]) {
    gtinMap.set(m.chave, m.ingrediente_id);
  }

  const porNome = new Map<string, InsumoRef>();
  for (const i of insumos) porNome.set(normalizar(i.nome), i);
  const custoById = new Map(insumos.map(i => [i.id, i.custo_atual]));

  let jaImportada = false;
  if (parsed.chaveNfe) {
    const { data } = await admin
      .from("nfe_importadas").select("id")
      .eq("bar_id", current.bar.id).eq("chave_nfe", parsed.chaveNfe).maybeSingle();
    jaImportada = !!data;
  }

  const itens: PreviewItem[] = parsed.itens.map(it => {
    let sugerido: string | null = null;
    if (it.gtin && gtinMap.has(it.gtin)) sugerido = gtinMap.get(it.gtin)!;
    else {
      const match = porNome.get(normalizar(it.nome));
      if (match) sugerido = match.id;
    }
    return {
      cprod: it.cprod,
      gtin: it.gtin,
      nome: it.nome,
      unidadeNota: it.unidadeNota,
      unidadeSugerida: unidadeBase(it.unidadeNota),
      quantidade: it.quantidade,
      custoUnitario: it.custoUnitario,
      sugeridoIngredienteId: sugerido,
      custoAtual: sugerido ? (custoById.get(sugerido) ?? null) : null,
    };
  });

  return {
    ok: true,
    preview: { fornecedor: parsed.fornecedor, chaveNfe: parsed.chaveNfe, jaImportada, itens, insumos },
  };
}

export interface ConfirmarItem {
  ingredienteId: string | null;  // null = criar novo insumo
  nome: string;
  unidade: string;
  custoUnitario: number;
  quantidade: number;
  gtin: string | null;
  cprod: string | null;
}

export async function confirmarNfe(payload: {
  cnpj: string | null;
  fornecedorNome: string | null;
  chaveNfe: string | null;
  itens: ConfirmarItem[];
}): Promise<{ ok: true; itens: number } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  if (!ROLES_OK.includes(current.role)) return { error: "Sem permissão para importar." };
  if (!payload.itens.length) return { error: "Nenhum item para importar." };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("importar_nfe", {
    p_bar_id:          current.bar.id,
    p_cnpj:            payload.cnpj,
    p_fornecedor_nome: payload.fornecedorNome,
    p_chave_nfe:       payload.chaveNfe,
    p_user_id:         current.userId,
    p_itens: payload.itens.map(i => ({
      ingrediente_id: i.ingredienteId,
      nome:           i.nome,
      unidade:        i.unidade,
      custo_unitario: i.custoUnitario,
      quantidade:     i.quantidade,
      gtin:           i.gtin,
      cprod:          i.cprod,
    })),
  });

  if (error) {
    console.error("confirmarNfe: erro no RPC importar_nfe", error);
    return { error: "Não foi possível importar a nota. Tente novamente." };
  }
  const res = data as { ok: boolean; itens?: number; error?: string } | null;
  if (!res?.ok) return { error: res?.error ?? "Falha ao importar." };

  revalidatePath("/dashboard/estoque");
  return { ok: true, itens: res.itens ?? 0 };
}
