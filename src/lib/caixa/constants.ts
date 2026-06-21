import type { PagamentoMetodo } from "@/types/database";

export const METODOS: { key: PagamentoMetodo; label: string; icon: string }[] = [
  { key: "pix",      label: "Pix",      icon: "⚡" },
  { key: "dinheiro", label: "Dinheiro", icon: "💵" },
  { key: "debito",   label: "Débito",   icon: "💳" },
  { key: "credito",  label: "Crédito",  icon: "💳" },
  { key: "cortesia", label: "Cortesia", icon: "🎁" },
];

export const METODO_LABEL: Record<PagamentoMetodo, string> = {
  pix:      "Pix",
  debito:   "Débito",
  credito:  "Crédito",
  dinheiro: "Dinheiro",
  cortesia: "Cortesia",
};
