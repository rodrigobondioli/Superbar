import { describe, it, expect } from "vitest";
import { percentChange } from "./percent-change";

describe("percentChange", () => {
  it("variação positiva", () => {
    expect(percentChange(150, 100)).toBe(50);
  });
  it("variação negativa", () => {
    expect(percentChange(80, 100)).toBeCloseTo(-20);
  });
  it("zero quando igual", () => {
    expect(percentChange(100, 100)).toBe(0);
  });
  it("null quando anterior = 0 (sem denominador válido)", () => {
    expect(percentChange(100, 0)).toBeNull();
  });
  it("null quando anterior negativo", () => {
    expect(percentChange(100, -10)).toBeNull();
  });
});
