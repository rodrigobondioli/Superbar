"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function semTipo<T>(q: T): any { return q; }

export type ActionResult = { ok: true } | { error: string } | null;

export async function atualizarPerfil(barId: string, formData: FormData): Promise<ActionResult> {
  const nome     = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim() || null;
  const logoUrl  = String(formData.get("logo_url") ?? "").trim() || null;
  const rua      = String(formData.get("rua") ?? "").trim() || undefined;
  const numero   = String(formData.get("numero") ?? "").trim() || undefined;
  const bairro   = String(formData.get("bairro") ?? "").trim() || undefined;
  const cidade   = String(formData.get("cidade") ?? "").trim() || undefined;
  const estado   = String(formData.get("estado") ?? "").trim() || undefined;
  const cep      = String(formData.get("cep") ?? "").trim() || undefined;

  const metaMensalStr = String(formData.get("meta_mensal") ?? "").replace(",", ".");
  const metaAnualStr  = String(formData.get("meta_anual")  ?? "").replace(",", ".");
  const metaMensal = metaMensalStr && !isNaN(parseFloat(metaMensalStr)) ? parseFloat(metaMensalStr) : undefined;
  const metaAnual  = metaAnualStr  && !isNaN(parseFloat(metaAnualStr))  ? parseFloat(metaAnualStr)  : undefined;

  if (!nome) return { error: "Nome é obrigatório." };

  const endereco = { rua, numero, bairro, cidade, estado, cep };

  const supabase = await createClient();

  // Lê configuracoes atual para fazer merge (não sobrescrever outros campos)
  const { data: barAtual } = await semTipo(supabase.from("bars"))
    .select("configuracoes")
    .eq("id", barId)
    .maybeSingle() as { data: { configuracoes: Record<string, unknown> } | null };

  const configuracoes = {
    ...(barAtual?.configuracoes ?? {}),
    ...(metaMensal !== undefined ? { meta_mensal: metaMensal } : {}),
    ...(metaAnual  !== undefined ? { meta_anual:  metaAnual  } : {}),
  };

  const { error } = await semTipo(supabase.from("bars")).update({
    nome,
    telefone,
    logo_url: logoUrl,
    endereco,
    configuracoes,
  }).eq("id", barId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarConta(userId: string, formData: FormData): Promise<ActionResult> {
  const nome      = String(formData.get("nome") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim() || null;

  if (!nome) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await semTipo(supabase.from("profiles")).update({
    nome,
    avatar_url: avatarUrl,
  }).eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
