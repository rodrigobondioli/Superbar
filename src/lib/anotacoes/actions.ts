"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import type { AnotacaoStatus } from "@/types/database";

type Result = { ok: true } | { error: string };

const LIM = { titulo: 140, corpo: 4000, categoria: 60 } as const;

/** Guard: só o admin da plataforma mexe em nota/status/remoção. */
async function assertAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!isPlatformAdmin(auth.user.email)) throw new Error("Acesso negado");
}

// ─── Cliente (dono do bar) ────────────────────────────────────────────────────

/** Abre um chamado de suporte. Cai em Admin → Anotações → Tickets. */
export async function abrirChamado(payload: { titulo: string; corpo: string }): Promise<Result> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const titulo = payload.titulo.trim();
  const corpo = payload.corpo.trim();
  if (!corpo) return { error: "Descreva o problema." };
  if (titulo.length > LIM.titulo || corpo.length > LIM.corpo) return { error: "Texto muito longo." };

  const admin = createAdminClient();
  const { error } = await admin.from("anotacoes").insert({
    tipo: "ticket",
    corpo,
    titulo: titulo || null,
    bar_id: current.bar.id,
    autor_nome: current.userNome,
  });
  if (error) return { error: "Erro ao abrir o chamado. Tente novamente." };
  return { ok: true };
}

/** Envia uma sugestão de melhoria. Cai em Admin → Anotações → Sugestões. */
export async function enviarSugestao(payload: { categoria: string; corpo: string }): Promise<Result> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const corpo = payload.corpo.trim();
  const categoria = payload.categoria.trim();
  if (!corpo) return { error: "Escreva a sua sugestão." };
  if (corpo.length > LIM.corpo || categoria.length > LIM.categoria) return { error: "Texto muito longo." };

  const admin = createAdminClient();
  const { error } = await admin.from("anotacoes").insert({
    tipo: "sugestao",
    corpo,
    categoria: categoria || null,
    bar_id: current.bar.id,
    autor_nome: current.userNome,
  });
  if (error) return { error: "Erro ao enviar. Tente novamente." };
  return { ok: true };
}

// ─── Admin (fundador) ─────────────────────────────────────────────────────────

/** Cria uma nota própria do fundador (ideia/melhoria). */
export async function criarNota(payload: { titulo: string; corpo: string }): Promise<Result> {
  await assertAdmin();
  const corpo = payload.corpo.trim();
  const titulo = payload.titulo.trim();
  if (!corpo) return { error: "Escreva a nota." };
  if (titulo.length > LIM.titulo || corpo.length > LIM.corpo) return { error: "Texto muito longo." };

  const admin = createAdminClient();
  const { error } = await admin.from("anotacoes").insert({
    tipo: "nota",
    corpo,
    titulo: titulo || null,
  });
  if (error) return { error: "Erro ao salvar a nota." };
  revalidatePath("/admin/anotacoes");
  return { ok: true };
}

/** Muda o status (aberto → resolvido → arquivado) de qualquer anotação. */
export async function atualizarStatusAnotacao(id: string, status: AnotacaoStatus): Promise<Result> {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("anotacoes").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "Erro ao atualizar." };
  revalidatePath("/admin/anotacoes");
  return { ok: true };
}

/** Remove uma anotação (usado principalmente para notas próprias). */
export async function deletarAnotacao(id: string): Promise<Result> {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("anotacoes").delete().eq("id", id);
  if (error) return { error: "Erro ao remover." };
  revalidatePath("/admin/anotacoes");
  return { ok: true };
}
