"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { traduzirErro } from "@/lib/utils";

export type ActionResult = { ok: true } | { error: string } | null;

/** Mescla campos em bars.configuracoes com admin client (bypassa a RLS de UPDATE
 *  que fazia o save "dar sucesso" sem gravar), validando que é o dono do bar. */
async function mergeConfigDono(barId: string, patch: Record<string, unknown>): Promise<ActionResult> {
  const current = await getCurrentBar();
  if (!current || current.bar.id !== barId) return { error: "Não autorizado." };

  const admin = createAdminClient();
  const { data: bar } = await admin
    .from("bars")
    .select("configuracoes")
    .eq("id", barId)
    .maybeSingle<{ configuracoes: Record<string, unknown> | null }>();

  const novaConfig = { ...(bar?.configuracoes ?? {}), ...patch };
  const { error } = await admin.from("bars").update({ configuracoes: novaConfig }).eq("id", barId);
  if (error) return { error: traduzirErro(error.message) };
  return { ok: true };
}

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

  const current = await getCurrentBar();
  if (!current || current.bar.id !== barId) return { error: "Não autorizado." };

  const endereco = { rua, numero, bairro, cidade, estado, cep };

  // Admin client: a RLS de UPDATE em bars bloqueava o client autenticado
  // (update afetava 0 linhas sem erro → "sucesso" falso). Dono já validado acima.
  const admin = createAdminClient();

  // Lê configuracoes atual para fazer merge (não sobrescrever outros campos)
  const { data: barAtual } = await admin.from("bars")
    .select("configuracoes")
    .eq("id", barId)
    .maybeSingle<{ configuracoes: Record<string, unknown> | null }>();

  const configuracoes = {
    ...(barAtual?.configuracoes ?? {}),
    ...(metaMensal !== undefined ? { meta_mensal: metaMensal } : {}),
    ...(metaAnual  !== undefined ? { meta_anual:  metaAnual  } : {}),
  };

  const { error } = await admin.from("bars").update({
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
  const current = await getCurrentBar();
  if (!current || current.bar.id !== barId) return { error: "Não autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("bars").update({ logo_url: logoUrl }).eq("id", barId);
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
  const r = await mergeConfigDono(barId, { taxa_servico_pct: pct });
  if (r && "error" in r) return r;
  revalidatePath("/dashboard");
  revalidatePath("/caixa");
  return { ok: true };
}

export async function atualizarAutoPedido(barId: string, value: boolean): Promise<ActionResult> {
  const r = await mergeConfigDono(barId, { auto_pedido: value });
  if (r && "error" in r) return r;
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fluxo de entrega: true = bartender marca "pronto" e o garçom retira;
 *  false = bartender entrega direto (sem o passo intermediário). Default: true. */
export async function atualizarFluxoPronto(barId: string, value: boolean): Promise<ActionResult> {
  const r = await mergeConfigDono(barId, { fluxo_pronto: value });
  if (r && "error" in r) return r;
  revalidatePath("/producao");
  revalidatePath("/garcom");
  return { ok: true };
}
