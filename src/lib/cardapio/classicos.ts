/** Lista curada de clássicos para o onboarding (Porta B).
 *  O dono marca os que serve; a IA sugere a ficha depois. Preço o dono ajusta. */

export interface ClassicoItem {
  nome: string;
  categoria: string;
}

export const CATEGORIAS_CLASSICOS = ["Drinks", "Não Alcoólicos"] as const;

export const CLASSICOS: ClassicoItem[] = [
  // ── Drinks (coquetéis clássicos) ──
  { nome: "Caipirinha", categoria: "Drinks" },
  { nome: "Caipiroska", categoria: "Drinks" },
  { nome: "Mojito", categoria: "Drinks" },
  { nome: "Margarita", categoria: "Drinks" },
  { nome: "Negroni", categoria: "Drinks" },
  { nome: "Aperol Spritz", categoria: "Drinks" },
  { nome: "Gin Tônica", categoria: "Drinks" },
  { nome: "Cosmopolitan", categoria: "Drinks" },
  { nome: "Daiquiri", categoria: "Drinks" },
  { nome: "Old Fashioned", categoria: "Drinks" },
  { nome: "Whisky Sour", categoria: "Drinks" },
  { nome: "Moscow Mule", categoria: "Drinks" },
  { nome: "Cuba Libre", categoria: "Drinks" },
  { nome: "Piña Colada", categoria: "Drinks" },
  { nome: "Dry Martini", categoria: "Drinks" },
  { nome: "Manhattan", categoria: "Drinks" },
  { nome: "Espresso Martini", categoria: "Drinks" },
  { nome: "Sex on the Beach", categoria: "Drinks" },
  { nome: "Tequila Sunrise", categoria: "Drinks" },
  { nome: "Bloody Mary", categoria: "Drinks" },
  { nome: "Mai Tai", categoria: "Drinks" },
  { nome: "Clericot", categoria: "Drinks" },
  { nome: "Sangria", categoria: "Drinks" },
  { nome: "Gin Fizz", categoria: "Drinks" },
  { nome: "Penicillin", categoria: "Drinks" },
  { nome: "Aperol Tônica", categoria: "Drinks" },
  // ── Não Alcoólicos ──
  { nome: "Limonada Suíça", categoria: "Não Alcoólicos" },
  { nome: "Mojito sem Álcool", categoria: "Não Alcoólicos" },
  { nome: "Água com Gás", categoria: "Não Alcoólicos" },
  { nome: "Refrigerante", categoria: "Não Alcoólicos" },
  { nome: "Suco Natural", categoria: "Não Alcoólicos" },
];
