/**
 * Formatação de moeda — fonte única (BRL, pt-BR).
 * Antes: cada módulo redefinia `new Intl.NumberFormat(...)`. Num produto
 * financeiro, moeda formatada diferente entre telas mina a percepção de
 * precisão. Uma régua só (DRY).
 *
 * `currency`         → 2 casas ("R$ 12,50"). Uso geral.
 * `currencyInteiro`  → sem centavos ("R$ 13"). Metas e números grandes.
 * `formatBRL(v)`     → conveniência funcional equivalente a `currency.format(v)`.
 */

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const currencyInteiro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatBRL(value: number): string {
  return currency.format(value);
}
