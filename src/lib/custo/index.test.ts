import { describe, it, expect } from "vitest";
import {
  custoDaFicha,
  custoEfetivo,
  margem,
  margemPercentual,
  custoStatusEfetivo,
} from "./index";

describe("custoDaFicha", () => {
  it("soma quantidade × custo unitário de cada linha", () => {
    expect(
      custoDaFicha([
        { quantidade: 50, custoUnitario: 0.08 }, // 4.00
        { quantidade: 20, custoUnitario: 0.15 }, // 3.00
      ]),
    ).toBe(7);
  });

  it("retorna null quando não há ficha (sinal pro fallback)", () => {
    expect(custoDaFicha(null)).toBeNull();
    expect(custoDaFicha(undefined)).toBeNull();
    expect(custoDaFicha([])).toBeNull();
  });

  it("arredonda em 4 casas (não vaza dízima)", () => {
    expect(custoDaFicha([{ quantidade: 1, custoUnitario: 1 / 3 }])).toBe(0.3333);
  });
});

describe("custoEfetivo (precedência ficha → variante → produto)", () => {
  it("a ficha manda quando existe", () => {
    expect(custoEfetivo(5, 9, 12)).toBe(5);
  });
  it("cai na variante quando não há ficha", () => {
    expect(custoEfetivo(null, 9, 12)).toBe(9);
  });
  it("cai no produto quando não há ficha nem variante", () => {
    expect(custoEfetivo(null, null, 12)).toBe(12);
  });
  it("null quando não há custo nenhum", () => {
    expect(custoEfetivo(null, null, null)).toBeNull();
  });
  it("custo zero é válido (não confundir com ausência)", () => {
    expect(custoEfetivo(0, 9, 12)).toBe(0);
  });
});

describe("margem (R$)", () => {
  it("preço − custo, 2 casas", () => {
    expect(margem(30, 9.5)).toBe(20.5);
  });
  it("null sem custo", () => {
    expect(margem(30, null)).toBeNull();
  });
  it("margem negativa quando custo > preço", () => {
    expect(margem(10, 14)).toBe(-4);
  });
});

describe("margemPercentual (% sobre o preço)", () => {
  it("(preço − custo) / preço × 100", () => {
    expect(margemPercentual(100, 30)).toBeCloseTo(70);
  });
  it("null quando não há custo", () => {
    expect(margemPercentual(100, null)).toBeNull();
  });
  it("null quando preço ≤ 0 (evita divisão inválida)", () => {
    expect(margemPercentual(0, 5)).toBeNull();
    expect(margemPercentual(-1, 5)).toBeNull();
  });
  it("negativa quando custo > preço", () => {
    expect(margemPercentual(10, 15)).toBeCloseTo(-50);
  });
});

describe("custoStatusEfetivo (variante manda sobre produto)", () => {
  it("usa o status da variante quando existe", () => {
    expect(custoStatusEfetivo("confirmada", "sem")).toBe("confirmada");
  });
  it("cai no produto quando a variante não tem status", () => {
    expect(custoStatusEfetivo(null, "sugerida")).toBe("sugerida");
  });
  it("'sem' quando nenhum dos dois", () => {
    expect(custoStatusEfetivo(null, null)).toBe("sem");
  });
});
