"use client";

import { toast } from "@/components/ui/toaster";

// Sessão expirada no meio do serviço (Princípio 11): as actions críticas já
// falham fechado com um erro de "não autenticado" — nenhum dado é perdido.
// Este helper tira o beco sem saída: detecta esse erro no client, avisa e
// manda pro login (com next pra voltar). Detecta por PADRÃO (case-insensitive),
// não por string exata, porque as actions usam variações
// ("Não autenticado.", "Sessão expirada.", "Sessão expirada. Faça login…").

const PADROES_AUTH = ["autenticad", "sessão expir", "sessao expir"];

export function isSessaoExpirada(error?: string | null): boolean {
  if (!error) return false;
  const e = error.toLowerCase();
  return PADROES_AUTH.some(p => e.includes(p));
}

/**
 * Se `error` indicar sessão expirada, avisa e redireciona pro login.
 * Retorna `true` se tratou (o chamador deve parar/retornar e NÃO mostrar o
 * erro local). Retorna `false` se o erro é outro (segue o fluxo normal).
 */
export function tratarSessaoExpirada(error?: string | null): boolean {
  if (!isSessaoExpirada(error)) return false;
  toast("Sua sessão expirou. Redirecionando para o login…", "error");
  const next = typeof window !== "undefined" ? window.location.pathname : "/";
  setTimeout(() => {
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }, 1200);
  return true;
}
