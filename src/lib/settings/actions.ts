"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/utils";

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
  const { data: barAtual } = await supabase.from("bars")
    .select("configuracoes")
    .eq("id", barId)
    .maybeSingle() as { data: { configuracoes: Record<string, unknown> } | null };

  const configuracoes = {
    ...(barAtual?.configuracoes ?? {}),
    ...(metaMensal !== undefined ? { meta_mensal: metaMensal } : {}),
    ...(metaAnual  !== undefined ? { meta_anual:  metaAnual  } : {}),
  };

  const { error } = await supabase.from("bars").update({
    nome,
    telefone,
    logo_url: logoUrl,
    endereco,
    configuracoes,
  }).eq("id", barId);

  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarLogo(barId: string, logoUrl: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("bars").update({ logo_url: logoUrl }).eq("id", barId);
  if (error) return { error: traduzirErro(error.message) };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarAvatar(userId: string, avatarUrl: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (error) return { error: traduzirErro(error.message) };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarConta(userId: string, formData: FormData): Promise<ActionResult> {
  const nome      = String(formData.get("nome") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim() || null;

  if (!nome) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    nome,
    avatar_url: avatarUrl,
  }).eq("id", userId);

  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarTaxaServico(barId: string, pct: number): Promise<ActionResult> {
  const supabase = await createClient();
  // merge_bar_config usa UPDATE ... SET configuracoes = configuracoes || patch
  // — atômico, sem race condition com outros campos sendo salvos simultaneamente
  const { error } = await supabase.rpc("merge_bar_config", {
    p_bar_id: barId,
    p_patch:  JSON.stringify({ taxa_servico_pct: pct }),
  });
  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard");
  revalidatePath("/caixa");
  return { ok: true };
}

export async function atualizarAutoPedido(barId: string, value: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("merge_bar_config", {
    p_bar_id: barId,
    p_patch:  JSON.stringify({ auto_pedido: value }),
  });
  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fluxo de entrega: true = bartender marca "pronto" e o garçom retira;
 *  false = bartender entrega direto (sem o passo intermediário). Default: true. */
export async function atualizarFluxoPronto(barId: string, value: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("merge_bar_config", {
    p_bar_id: barId,
    p_patch:  JSON.stringify({ fluxo_pronto: value }),
  });
  if (error) return { error: traduzirErro(error.message) };

  revalidatePath("/producao");
  revalidatePath("/garcom");
  return { ok: true };
}
