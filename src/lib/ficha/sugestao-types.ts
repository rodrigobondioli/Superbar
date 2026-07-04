import { normalizarNome } from "@/lib/cardapio/import-types";

/** Unidade base de um insumo (igual ao CHECK de ingredientes.unidade). */
export type UnidadeInsumo = "un" | "ml" | "l" | "g" | "kg";

/** Um insumo sugerido pela IA, já com tentativa de casamento ao estoque do bar. */
export interface InsumoSugerido {
  /** Papel genérico na receita: "vodka", "limão", "açúcar". A IA sabe isto. */
  papel: string;
  /** Quantidade padrão sugerida (o dono confirma/ajusta). */
  quantidade: number;
  unidade: UnidadeInsumo;
  /** id do ingrediente do bar que casou (SKU real), ou null se não achou. */
  ingredienteId: string | null;
  /** nome do ingrediente casado (ex: "Vodka Smirnoff 998ml"), ou null. */
  ingredienteNome: string | null;
}

export interface SugerirFichaResponse {
  insumos: InsumoSugerido[];
}

/** Ingrediente do bar, forma mínima para casamento. */
export interface IngredienteRef {
  id: string;
  nome: string;
}

/**
 * Casa o papel genérico ("vodka") com um ingrediente real do bar
 * ("Vodka Smirnoff 998ml"), por tokens de palavra — conservador para não
 * vincular errado (Princípio 9). Retorna null quando não há match confiável.
 *
 * Pontuação: igualdade exata (3) > papel é palavra do insumo ou vice-versa (2)
 * > substring solta (1). Escolhe a maior; empate = primeiro.
 */
export function casarIngrediente(
  papel: string,
  ingredientes: IngredienteRef[],
): IngredienteRef | null {
  const p = normalizarNome(papel);
  if (!p) return null;
  const pTokens = new Set(p.split(" ").filter(Boolean));

  let melhor: IngredienteRef | null = null;
  let melhorScore = 0;

  for (const ing of ingredientes) {
    const n = normalizarNome(ing.nome);
    if (!n) continue;
    const nTokens = n.split(" ").filter(Boolean);

    let score = 0;
    if (n === p) {
      score = 3;
    } else if (nTokens.some((t) => pTokens.has(t))) {
      // alguma palavra do insumo bate com alguma palavra do papel
      score = 2;
    } else if (n.includes(p) || p.includes(n)) {
      score = 1;
    }

    if (score > melhorScore) {
      melhorScore = score;
      melhor = { id: ing.id, nome: ing.nome };
    }
  }

  return melhorScore > 0 ? melhor : null;
}
