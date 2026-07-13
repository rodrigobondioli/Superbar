import { describe, it, expect } from "vitest";
import { baseDoItem, quantidadeBaseImportada, type ItemConversivel } from "./converter";

// Item de garrafa/pacote (tem tamanho de embalagem).
function comEmbalagem(custo: number, tamanho: number, base: "ml" | "g"): ItemConversivel {
  return { custoUnitario: custo, tamanhoEmbalagem: tamanho, baseEmbalagem: base, unidadeSugerida: "un" };
}
// Item a granel (sem tamanho — ex: limão kg, hortelã maço).
function granel(custo: number, unidade: string): ItemConversivel {
  return { custoUnitario: custo, tamanhoEmbalagem: null, baseEmbalagem: null, unidadeSugerida: unidade };
}

describe("baseDoItem — custo por unidade-base", () => {
  it("garrafa de 1L a R$89,90 → R$0,0899/ml", () => {
    const r = baseDoItem(comEmbalagem(89.9, 1000, "ml"));
    expect(r.convertido).toBe(true);
    expect(r.unidade).toBe("ml");
    expect(r.custo).toBeCloseTo(0.0899, 4);
  });

  it("garrafa de 750ml a R$75 → R$0,10/ml", () => {
    const r = baseDoItem(comEmbalagem(75, 750, "ml"));
    expect(r.custo).toBeCloseTo(0.1, 4);
  });

  it("pacote de 1kg (1000g) a R$5,20 → R$0,0052/g", () => {
    const r = baseDoItem(comEmbalagem(5.2, 1000, "g"));
    expect(r.unidade).toBe("g");
    expect(r.custo).toBeCloseTo(0.0052, 4);
  });

  it("a granel (sem tamanho) mantém custo e unidade da nota", () => {
    const r = baseDoItem(granel(6.9, "kg"));
    expect(r.convertido).toBe(false);
    expect(r.unidade).toBe("kg");
    expect(r.custo).toBe(6.9);
  });
});

describe("quantidadeBaseImportada — estoque em unidade-base (regressão do '6 ml')", () => {
  it("6 garrafas de 1L → 6000 ml (NÃO 6)", () => {
    expect(quantidadeBaseImportada(comEmbalagem(89.9, 1000, "ml"), 6)).toBe(6000);
  });

  it("6 garrafas de 750ml → 4500 ml", () => {
    expect(quantidadeBaseImportada(comEmbalagem(75, 750, "ml"), 6)).toBe(4500);
  });

  it("5 pacotes de 1kg → 5000 g", () => {
    expect(quantidadeBaseImportada(comEmbalagem(5.2, 1000, "g"), 5)).toBe(5000);
  });

  it("12 garrafas de 1,5L → 18000 ml", () => {
    expect(quantidadeBaseImportada(comEmbalagem(7.9, 1500, "ml"), 12)).toBe(18000);
  });

  it("a granel fica como está (10 kg → 10)", () => {
    expect(quantidadeBaseImportada(granel(6.9, "kg"), 10)).toBe(10);
  });
});

describe("coerência custo×quantidade = total pago", () => {
  it("6 garrafas de 1L a R$89,90 → valor de estoque ≈ R$539,40", () => {
    const it = comEmbalagem(89.9, 1000, "ml");
    const qtdBase = quantidadeBaseImportada(it, 6); // 6000 ml
    const custoBase = baseDoItem(it).custo;         // 0,0899/ml
    expect(qtdBase * custoBase).toBeCloseTo(89.9 * 6, 1);
  });
});
