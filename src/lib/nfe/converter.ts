// ─────────────────────────────────────────────────────────────────────────────
// Conversões de dinheiro da NF-e — ISOLADAS e TESTADAS (converter.test.ts).
// Quando a embalagem tem tamanho (garrafa 750ml, pacote 1kg), tanto o CUSTO
// quanto a QUANTIDADE entram na unidade-base (ml/g). É o que impede o clássico
// erro de custo/estoque "por garrafa" que estoura o CMV (Princípio 10) — e o bug
// do "6 ml" (6 garrafas guardadas como 6 ml em vez de 6000 ml).
// ─────────────────────────────────────────────────────────────────────────────

export interface ItemConversivel {
  custoUnitario: number;              // R$ por unidade da nota (ex: por garrafa)
  tamanhoEmbalagem: number | null;    // base por embalagem (ex: 750 = 750ml)
  baseEmbalagem: "ml" | "g" | null;   // base real (líquido vs sólido)
  unidadeSugerida: string;            // fallback quando não há embalagem
}

export interface BaseConvertida {
  unidade: string;   // unidade-base resultante (ml/g) ou a sugerida
  custo: number;     // R$ por unidade-base
  convertido: boolean;
}

/** Custo por unidade-base. Garrafa 750ml a R$75 → R$0,10/ml. */
export function baseDoItem(it: ItemConversivel): BaseConvertida {
  if (it.tamanhoEmbalagem && it.tamanhoEmbalagem > 0 && it.baseEmbalagem) {
    return {
      unidade: it.baseEmbalagem,
      custo: Math.round((it.custoUnitario / it.tamanhoEmbalagem) * 10000) / 10000,
      convertido: true,
    };
  }
  return { unidade: it.unidadeSugerida, custo: it.custoUnitario, convertido: false };
}

/**
 * Quantidade na unidade-base. 6 garrafas de 750ml → 4500 ml. Sem tamanho de
 * embalagem (ex: limão a granel), fica como está (10 kg → 10).
 */
export function quantidadeBaseImportada(it: ItemConversivel, qtyNota: number): number {
  const b = baseDoItem(it);
  return b.convertido && it.tamanhoEmbalagem ? qtyNota * it.tamanhoEmbalagem : qtyNota;
}
