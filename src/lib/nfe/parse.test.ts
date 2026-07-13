import { describe, it, expect } from "vitest";
import { extrairTamanho, rotuloCompra, unidadeBase } from "./parse";

describe("extrairTamanho — volume da embalagem pela descrição", () => {
  it("garrafa em ml", () => {
    expect(extrairTamanho("GIN TANQUERAY LONDON DRY 750ML")).toEqual({ valor: 750, base: "ml" });
  });
  it("litro vira ml", () => {
    expect(extrairTamanho("VODKA ABSOLUT ORIGINAL 1L")).toEqual({ valor: 1000, base: "ml" });
    expect(extrairTamanho("AGUA TONICA SCHWEPPES 1,5L")).toEqual({ valor: 1500, base: "ml" });
  });
  it("cl vira ml", () => {
    expect(extrairTamanho("LICOR 50CL")).toEqual({ valor: 500, base: "ml" });
  });
  it("kg vira g", () => {
    expect(extrairTamanho("ACUCAR REFINADO UNIAO 1KG")).toEqual({ valor: 1000, base: "g" });
    expect(extrairTamanho("GELO EM CUBOS PACOTE 5KG")).toEqual({ valor: 5000, base: "g" });
  });
  it("a granel (sem número+unidade) → null", () => {
    expect(extrairTamanho("LIMAO TAHITI KG")).toBeNull();
    expect(extrairTamanho("HORTELA MACO")).toBeNull();
  });
});

describe("rotuloCompra — sólido não é garrafa", () => {
  it("líquido default = garrafa", () => {
    expect(rotuloCompra("GIN TANQUERAY 750ML", "ml")).toBe("garrafa");
  });
  it("sólido (base g) = pacote, mesmo sem a palavra", () => {
    expect(rotuloCompra("ACUCAR REFINADO UNIAO 1KG", "g")).toBe("pacote");
  });
  it("lata detectada", () => {
    expect(rotuloCompra("CERVEJA HEINEKEN LATA 350ML", "ml")).toBe("lata");
  });
  it("pacote/saco detectado", () => {
    expect(rotuloCompra("GELO EM CUBOS PACOTE 5KG", "g")).toBe("pacote");
  });
});

describe("unidadeBase — unidade comercial → base do insumo", () => {
  it("volumes e pesos", () => {
    expect(unidadeBase("L")).toBe("l");
    expect(unidadeBase("ML")).toBe("ml");
    expect(unidadeBase("KG")).toBe("kg");
    expect(unidadeBase("G")).toBe("g");
  });
  it("UN/CX/GF caem em un", () => {
    expect(unidadeBase("UN")).toBe("un");
    expect(unidadeBase("CX")).toBe("un");
    expect(unidadeBase("GF")).toBe("un");
  });
});
