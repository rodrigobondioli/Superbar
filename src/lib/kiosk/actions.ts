"use server";

import { cookies } from "next/headers";
import { getBarByKioskToken, verificarPin, regenerarKioskToken, getKioskToken } from "./queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { KIOSK_COOKIE, OPERADOR_COOKIE } from "./constants";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Define o operador atual do device (garçom/bartender/caixa selecionado).
 *  Grava um cookie que o getCurrentBar lê como fonte de atribuição — assim as
 *  ações (abrir comanda, lançar pedido, cobrar) ficam no nome de quem fez. */
export async function definirOperador(memberId: string): Promise<{ ok: boolean }> {
  if (!memberId) return { ok: false };
  const current = await getCurrentBar();
  if (!current) return { ok: false };

  // Valida via admin (kiosk é anônimo — RLS bloquearia a leitura de bar_members).
  const admin = createAdminClient();
  const { data } = await admin
    .from("bar_members")
    .select("id")
    .eq("id", memberId)
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .maybeSingle<{ id: string }>();
  if (!data) return { ok: false };

  const store = await cookies();
  store.set(OPERADOR_COOKIE, memberId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return { ok: true };
}

/** Remove o operador atual do device (ao "Trocar"). */
export async function limparOperador(): Promise<void> {
  const store = await cookies();
  store.delete(OPERADOR_COOKIE);
}

/** Ativa o kiosk no dispositivo atual: salva cookie por 1 ano.
 *  Chamado pela rota /kiosk/setup?token=XXX. */
export async function activateKiosk(token: string): Promise<{ ok: boolean; barId?: string; error?: string }> {
  const bar = await getBarByKioskToken(token);
  if (!bar) return { ok: false, error: "Token inválido ou expirado." };

  const store = await cookies();
  store.set(KIOSK_COOKIE, `${bar.id}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });

  return { ok: true, barId: bar.id };
}

/** Remove o cookie kiosk do dispositivo. */
export async function deactivateKiosk(): Promise<void> {
  const store = await cookies();
  store.delete(KIOSK_COOKIE);
}

/** Verifica o PIN de um operador. */
export async function checkPin(
  memberId: string,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  const ok = await verificarPin(memberId, pin);
  if (!ok) return { ok: false, error: "PIN incorreto." };
  return { ok: true };
}

/** Retorna o link de setup do kiosk para o bar autenticado. */
export async function getKioskSetupLink(): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { url: null, error: "Não autenticado." };

  // Busca o bar do usuário
  const { data: membership } = await supabase
    .from("bar_members")
    .select("bar_id")
    .eq("user_id", auth.user.id)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle<{ bar_id: string }>();

  if (!membership) return { url: null, error: "Bar não encontrado." };

  const token = await getKioskToken(membership.bar_id);
  if (!token) return { url: null, error: "Token não disponível." };

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.superbar.com.br";
  return { url: `${base}/kiosk/setup?token=${token}` };
}

/** Regenera o token do bar autenticado. Invalida todos os iPads ativos. */
export async function regenerarToken(): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { url: null, error: "Não autenticado." };

  const { data: membership } = await supabase
    .from("bar_members")
    .select("bar_id, role")
    .eq("user_id", auth.user.id)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle<{ bar_id: string; role: string }>();

  if (!membership) return { url: null, error: "Bar não encontrado." };
  if (!["dono", "gerente", "bar_manager"].includes(membership.role)) {
    return { url: null, error: "Sem permissão." };
  }

  const newToken = await regenerarKioskToken(membership.bar_id);
  if (!newToken) return { url: null, error: "Erro ao regenerar." };

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.superbar.com.br";
  return { url: `${base}/kiosk/setup?token=${newToken}` };
}
