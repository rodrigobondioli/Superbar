import type { BarRole } from "@/types/database";

/**
 * Política central de papéis — a régua do controle de acesso.
 * Espelha docs/regras-papeis.md. Muda aqui e lá juntos.
 */

/** `gerente` é legado (consolidado em bar_manager). Normaliza qualquer resquício. */
export function normalizarRole(role: string | null | undefined): BarRole {
  if (role === "gerente") return "bar_manager";
  return (role ?? "garcom") as BarRole;
}

/** Papéis operacionais: só a própria tela, nunca o dashboard. */
const OPERACIONAIS: BarRole[] = ["bartender", "garcom", "caixa"];

export function isOperacional(role: string): boolean {
  return OPERACIONAIS.includes(normalizarRole(role));
}

/** Vê o financeiro/inteligência (faturamento, margem, CMV). Só o dono. */
export function podeVerFinanceiro(role: string): boolean {
  return normalizarRole(role) === "dono";
}

/** Acessa a área admin do dashboard (cardápio, mesas, estoque, equipe). Dono + Bar Manager. */
export function podeVerAdminDashboard(role: string): boolean {
  const r = normalizarRole(role);
  return r === "dono" || r === "bar_manager";
}

/** Pode fazer contagem de insumos. Dono, Bar Manager, Bartender. */
export function podeContarEstoque(role: string): boolean {
  const r = normalizarRole(role);
  return r === "dono" || r === "bar_manager" || r === "bartender";
}

/** Casa de cada papel ao logar. */
export function homePath(role: string): string {
  switch (normalizarRole(role)) {
    case "dono":        return "/dashboard";
    case "bar_manager": return "/dashboard/estoque";
    case "bartender":   return "/bartender";
    case "garcom":      return "/garcom";
    case "caixa":       return "/caixa";
    default:            return "/dashboard";
  }
}
