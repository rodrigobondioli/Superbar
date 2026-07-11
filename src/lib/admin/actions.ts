"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS ?? "rodrigobondioli@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

/** Guard: verifica que o usuário atual é admin da plataforma */
async function assertAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!ADMIN_EMAILS.includes(auth.user.email?.toLowerCase() ?? "")) {
    throw new Error("Acesso negado");
  }
  return auth.user;
}

// ─── Suspender bar ────────────────────────────────────────────────────────────

export async function suspenderBar(barId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("bars").update({ ativo: false }).eq("id", barId);
  revalidatePath("/admin");
  revalidatePath(`/admin/${barId}`);
}

// ─── Reativar bar ─────────────────────────────────────────────────────────────

export async function reativarBar(barId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("bars").update({ ativo: true }).eq("id", barId);
  revalidatePath("/admin");
  revalidatePath(`/admin/${barId}`);
}

// ─── Alterar status da assinatura ─────────────────────────────────────────────

export async function alterarStatusAssinatura(
  assinaturaId: string,
  status: "ativa" | "cancelada" | "trial" | "inadimplente",
  barId: string
) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin
    .from("assinaturas")
    .update({ status })
    .eq("id", assinaturaId);
  revalidatePath("/admin");
  revalidatePath(`/admin/${barId}`);
}

// ─── Criar lead manualmente (admin) ──────────────────────────────────────────

export async function createLeadAdmin(payload: {
  nome_bar: string;
  cidade: string;
  tipo_bar: string;
  whatsapp?: string;
  instagram?: string;
  site?: string;
  nome_responsavel?: string;
  email?: string;
  notas?: string;
}): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("leads").insert({
    nome_bar: payload.nome_bar.trim(),
    cidade: payload.cidade.trim(),
    tipo_bar: payload.tipo_bar,
    whatsapp: payload.whatsapp?.trim() || null,
    instagram: payload.instagram?.trim() || null,
    site: payload.site?.trim() || null,
    nome_responsavel: payload.nome_responsavel?.trim() || null,
    email: payload.email?.trim() || null,
    notas: payload.notas?.trim() || null,
    status: "novo",
    origem: "Prospecção ativa", // ativo — você foi atrás
    ordem: Date.now(),          // entra no topo da coluna
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}

// ─── Renomear estágio do pipeline ─────────────────────────────────────────────

export async function updateStageLabel(id: string, label: string): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const trimmed = label.trim();
  if (!trimmed) return { error: "O nome não pode ficar vazio." };
  const admin = createAdminClient();
  const { error } = await admin.from("crm_stages").update({ label: trimmed }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}

// ─── Atualizar lead completo ──────────────────────────────────────────────────

export async function updateLead(
  id: string,
  payload: Partial<{
    nome_bar: string; cidade: string; tipo_bar: string;
    whatsapp: string | null; instagram: string | null; site: string | null;
    nome_responsavel: string | null; email: string | null;
    status: string; notas: string | null;
    follow_up_at: string | null; origem: string | null;
    ordem: number | null;
  }>
): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("leads").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}

// ─── Deletar lead ─────────────────────────────────────────────────────────────

export async function deleteLead(id: string): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("leads").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}

// ─── Atualizar status de lead ─────────────────────────────────────────────────

export async function updateLeadStatus(
  id: string,
  status: string,
  notas?: string,
): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const update: Record<string, string> = { status };
  if (notas !== undefined) update.notas = notas;
  const { error } = await admin.from("leads").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Atividades do lead (timeline) ────────────────────────────────────────────

export interface LeadAtividade {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string;
  criado_em: string;
}

export async function listarAtividades(leadId: string): Promise<LeadAtividade[]> {
  await assertAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("lead_atividades")
    .select("id, lead_id, tipo, descricao, criado_em")
    .eq("lead_id", leadId)
    .order("criado_em", { ascending: false });
  return (data as LeadAtividade[] | null) ?? [];
}

export async function adicionarAtividade(
  leadId: string,
  tipo: string,
  descricao: string,
): Promise<{ ok: true; atividade: LeadAtividade } | { error: string }> {
  await assertAdmin();
  const texto = descricao.trim();
  if (!texto) return { error: "Descrição vazia." };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lead_atividades")
    .insert({ lead_id: leadId, tipo, descricao: texto })
    .select("id, lead_id, tipo, descricao, criado_em")
    .single();
  if (error) return { error: error.message };
  return { ok: true, atividade: data as LeadAtividade };
}
