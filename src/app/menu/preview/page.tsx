import { MenuApp } from "@/components/menu/menu-app";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

// ─── Demo data ────────────────────────────────────────────────────────────────
const bar: Bar = {
  id: "demo",
  nome: "Aurora Bar",
  slug: "aurora-bar-preview",
  cnpj: null,
  telefone: null,
  endereco: null,
  logo_url: null,
  configuracoes: {},
  ativo: true,
  created_at: "",
  updated_at: "",
};

const mesa: Mesa = {
  id: "demo-mesa",
  bar_id: "demo",
  numero: 3,
  nome: "Varanda",
  capacidade: 4,
  ativo: true,
  ordem: null,
  created_at: "",
};

function cat(id: string, nome: string, ordem: number): Categoria {
  return { id, bar_id: "demo", nome, ordem, ativo: true, imagem_url: null, created_at: "" };
}

function prod(id: string, cat_id: string, nome: string, preco: number, descricao: string | null, imagem_url: string | null): Produto {
  return { id, bar_id: "demo", categoria_id: cat_id, nome, preco, descricao, custo: null, custo_status: "sem", imagem_url, destaque: false, ativo: true, controla_estoque: false, created_at: "", updated_at: "" };
}

const IMG = {
  negroni:     "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
  gin:         "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80",
  old:         "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=600&q=80",
  margarita:   "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
  mojito:      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
  aperol:      "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=600&q=80",
  whisky:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  caipirinha:  "https://images.unsplash.com/photo-1612476259373-6f2f39c62d6e?w=600&q=80",
  limonada:    "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80",
  agua:        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
  suco:        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
  bruschetta:  "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80",
  tabua:       "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
  batata:      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
};

const categorias = [
  cat("c1", "Drinks", 1),
  cat("c2", "Não Alcoólicas", 2),
  cat("c3", "Petiscos", 3),
];

const cardapio = [
  {
    ...categorias[0],
    produtos: [
      prod("p1",  "c1", "Negroni",           48, "Campari, gin London Dry e vermute rosso. Clássico italiano.", IMG.negroni),
      prod("p2",  "c1", "Gin Tônica",         42, "Gin Tanqueray, tônica premium, zimbro e raspas de limão siciliano.", IMG.gin),
      prod("p3",  "c1", "Old Fashioned",      52, "Bourbon Woodford Reserve, bitters Angostura, açúcar demerara.", IMG.old),
      prod("p4",  "c1", "Margarita",          45, "Tequila blanco, Cointreau, suco de limão siciliano. Na pedra.", IMG.margarita),
      prod("p5",  "c1", "Mojito",             38, "Rum branco, hortelã fresca, limão, açúcar e água com gás.", IMG.mojito),
      prod("p6",  "c1", "Aperol Spritz",      39, "Aperol, prosecco e água com gás. Leve e refrescante.", IMG.aperol),
      prod("p7",  "c1", "Whisky On the Rocks",65, "Single malt Glenfiddich 12 anos. Servido com gelo esférico.", IMG.whisky),
      prod("p8",  "c1", "Caipirinha Clássica",32, "Cachaça artesanal Nega Fula, limão tahiti e açúcar cristal.", IMG.caipirinha),
    ],
  },
  {
    ...categorias[1],
    produtos: [
      prod("p9",  "c2", "Limonada Suíça",     22, "Limão siciliano, leite condensado e água com gás. Cremosa.", IMG.limonada),
      prod("p10", "c2", "Água com Gás",        8,  "San Pellegrino 500ml.", IMG.agua),
      prod("p11", "c2", "Suco de Laranja",    18,  "Laranja pera espremida na hora, sem açúcar.", IMG.suco),
    ],
  },
  {
    ...categorias[2],
    produtos: [
      prod("p12", "c3", "Bruschetta da Casa", 34, "Pão artesanal, tomate cereja, manjericão e azeite trufado.", IMG.bruschetta),
      prod("p13", "c3", "Tábua de Frios",     68, "Presunto de parma, queijo brie, gorgonzola, nozes e mel.", IMG.tabua),
      prod("p14", "c3", "Batata Rústica",     28, "Batata frita no azeite, alecrim, flor de sal e aioli.", IMG.batata),
    ],
  },
];

export default function MenuPreviewPage() {
  return <MenuApp bar={bar} mesa={mesa} cardapio={cardapio} topPedidos={["p8", "p1", "p6", "p2", "p3"]} />;
}
