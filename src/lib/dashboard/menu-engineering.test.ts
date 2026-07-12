import { describe, it, expect } from "vitest";
import type { TopDrink } from "@/lib/dashboard/queries";
import {
  calcularCmv,
  calcularCoberturaReceita,
  categorizarProdutos,
} from "./menu-engineering";

// Helper: monta um TopDrink com defaults sensatos.
function drink(p: Partial<TopDrink> & { produtoId: string }): TopDrink {
  return {
    produtoNome: p.produtoId,
    quantidadeVendida: 1,
    faturamento: 0,
    preco: 0,
    custo: null,
    custoStatus: "sem",
    ...p,
  };
}

describe("calcularCmv", () => {
  it("custo confirmado / faturamento desses itens, em %", () => {
    const cmv = calcularCmv([
      drink({ produtoId: "A", quantidadeVendida: 10, custo: 3, faturamento: 100, custoStatus: "confirmada" }),
    ]);
    expect(cmv).toBe(30); // 30 de custo / 100 de faturamento
  });

  it("ignora custo NÃO confirmado (sugerida/sem) — não fabrica CMV", () => {
    const cmv = calcularCmv([
      drink({ produtoId: "A", quantidadeVendida: 10, custo: 3, faturamento: 100, custoStatus: "confirmada" }),
      drink({ produtoId: "B", quantidadeVendida: 10, custo: 9, faturamento: 100, custoStatus: "sugerida" }),
    ]);
    expect(cmv).toBe(30); // só A entra
  });

  it("null quando nenhum item tem custo confirmado (prefere silêncio)", () => {
    expect(
      calcularCmv([drink({ produtoId: "A", custo: 5, faturamento: 100, custoStatus: "sugerida" })]),
    ).toBeNull();
    expect(calcularCmv([])).toBeNull();
  });
});

describe("calcularCoberturaReceita", () => {
  it("pondera por receita, não por contagem de produtos", () => {
    const { cobertura, status } = calcularCoberturaReceita([
      drink({ produtoId: "A", faturamento: 80, custo: 5, custoStatus: "confirmada" }),
      drink({ produtoId: "B", faturamento: 20, custoStatus: "sem" }),
    ]);
    expect(cobertura).toBe(80);
    expect(status).toBe("confiavel");
  });

  it("50–79% ⇒ estimado", () => {
    expect(
      calcularCoberturaReceita([
        drink({ produtoId: "A", faturamento: 60, custo: 5, custoStatus: "confirmada" }),
        drink({ produtoId: "B", faturamento: 40, custoStatus: "sem" }),
      ]).status,
    ).toBe("estimado");
  });

  it("< 50% ⇒ indisponivel; faturamento zero também", () => {
    expect(
      calcularCoberturaReceita([
        drink({ produtoId: "A", faturamento: 30, custo: 5, custoStatus: "confirmada" }),
        drink({ produtoId: "B", faturamento: 70, custoStatus: "sem" }),
      ]).status,
    ).toBe("indisponivel");
    expect(calcularCoberturaReceita([]).status).toBe("indisponivel");
  });

  it("custo sugerido NÃO conta como cobertura (Princípio 9)", () => {
    const { cobertura } = calcularCoberturaReceita([
      drink({ produtoId: "A", faturamento: 100, custo: 5, custoStatus: "sugerida" }),
    ]);
    expect(cobertura).toBe(0);
  });
});

describe("categorizarProdutos", () => {
  it("classifica star / cash_cow / slow / problema / sem_dados contra a média do turno", () => {
    const cat = categorizarProdutos([
      drink({ produtoId: "star",     quantidadeVendida: 100, preco: 30, custo: 6 }),  // vol alto, margem 80%
      drink({ produtoId: "cash_cow", quantidadeVendida: 100, preco: 30, custo: 21 }), // vol alto, margem 30%
      drink({ produtoId: "slow",     quantidadeVendida: 10,  preco: 30, custo: 6 }),  // vol baixo
      drink({ produtoId: "problema", quantidadeVendida: 100, preco: 10, custo: 14 }), // vol alto, margem -40%
      drink({ produtoId: "sem",      quantidadeVendida: 100, preco: 30, custo: null }), // sem custo
    ]);
    const cat_ = (id: string) => cat.find((p) => p.produtoId === id)!.categoria;
    expect(cat_("star")).toBe("star");
    expect(cat_("cash_cow")).toBe("cash_cow");
    expect(cat_("slow")).toBe("slow");
    expect(cat_("problema")).toBe("problema");
    expect(cat_("sem")).toBe("sem_dados");
  });

  it("lista vazia ⇒ vazia", () => {
    expect(categorizarProdutos([])).toEqual([]);
  });
});
