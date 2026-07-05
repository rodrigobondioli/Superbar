import { MenuApp } from "@/components/menu/menu-app";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";
import { getTopPedidos } from "@/lib/menu/queries";
import { getDestaques } from "@/lib/destaques/queries";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

// ─── Demo (fallback quando não há bar logado) — cardápio real do MiniBar Gem ────
const barDemo: Bar = {
  id: "demo", nome: "MiniBar Gem", slug: "minibar-gem-preview", cnpj: null, telefone: null,
  endereco: null, logo_url: null, configuracoes: {}, ativo: true, created_at: "", updated_at: "",
};

const mesaDemo: Mesa = {
  id: "demo-mesa", bar_id: "demo", numero: 3, nome: "Varanda", capacidade: 4, ativo: true, ordem: null, created_at: "",
};

function cat(id: string, nome: string, ordem: number): Categoria {
  return { id, bar_id: "demo", nome, ordem, ativo: true, imagem_url: null, created_at: "" };
}

function prod(id: string, cat_id: string, nome: string, preco: number, descricao: string | null, avatar: string | null): Produto {
  const imagem_url = avatar ? `https://static.tagme.com.br/pubimg/thumbs/${avatar}?ims=filters:quality(70):format(webp)` : null;
  return { id, bar_id: "demo", categoria_id: cat_id, nome, preco, descricao, custo: null, custo_status: "sem", imagem_url, destaque: false, ativo: true, controla_estoque: false, created_at: "", updated_at: "" };
}

const categoriasDemo = [
  cat("c1", "Especial do Dia", 1),
  cat("c2", "Happy Hour", 2),
  cat("c3", "Entradinhas", 3),
  cat("c4", "Burger & Sanduíches", 4),
  cat("c5", "Principais", 5),
  cat("c6", "Extras", 6),
  cat("c7", "Sobremesas", 7),
];

const cardapioDemo = [
  { ...categoriasDemo[0], produtos: [
    prod("p1", "c1", "Mexilhões + Batata frita", 58, "Mexilhões (8un) + Batata frita (180g)", "MenuItem/25d339f0-69d0-11f1-90fb-a3ffa60f22f7.jpg"),
  ] },
  { ...categoriasDemo[1], produtos: [
    prod("p2", "c2", "Corsário", 39, "(Cítrico, levemente adocicado) Gin + cordial de acerola + cúrcuma + limão + leve toque defumado", "Product/b91da130-412b-11ee-9f08-cbb47dc97f9f.jpg"),
    prod("p3", "c2", "Taco de Camarão Crocante", 36, "Camarão empanado + alface + vinagrete de manga verde + aioli de páprica + meia cura (2un.)", "MenuItem/0e56b170-722e-11f0-9c74-ad599901fb86.jpg"),
    prod("p4", "c2", "Pastel de cupim", 28, "Pastel de cupim acompanhado de fonduta de queijo meia cura (02und)", "MenuItem/b1988c90-7220-11f0-8907-554e6c5fb222.jpg"),
    prod("p5", "c2", "Combo Gem", 65, "Burger Gem + Batata frita (porção)", "MenuItem/46a22c10-2286-11ef-96e2-b79c1f3da9c8.jpg"),
  ] },
  { ...categoriasDemo[2], produtos: [
    prod("p6", "c3", "Taco de Camarão Crocante", 32, "Camarão empanado (50g) + alface + vinagrete de manga verde + aioli de páprica + meia cura (2un.)", "MenuItem/64843d20-4663-11f0-a307-9557819bfe8e.jpg"),
    prod("p7", "c3", "Caldinho de Frutos do Mar", 28, "Caldinho de frutos do mar + espuma de coco", "MenuItem/a10f5a90-4663-11f0-a307-9557819bfe8e.jpg"),
    prod("p8", "c3", "Pastel de cupim", 28, "Pastel de cupim acompanhado de fonduta de queijo meia cura (02und)", "MenuItem/ca426900-4660-11f0-a307-9557819bfe8e.jpg"),
    prod("p9", "c3", "Sonho de Vatapá (04 und)", 34, "Sonho de vatapá + peixe curado + mujjol", "MenuItem/f4318cc0-4663-11f0-a307-9557819bfe8e.jpg"),
  ] },
  { ...categoriasDemo[3], produtos: [
    prod("p10", "c4", "Burger Gem", 42, "Pão artesanal + 130g de Black Angus + cebola em três versões (maionese + crispy e picles).", "MenuItem/17e82030-4672-11f0-a307-9557819bfe8e.jpg"),
    prod("p11", "c4", "Mini Hot Dog", 26, "Mini hot dog (50g) + aioli + barbecue picante + picles de cebola (2un.)", "MenuItem/7ec485f0-4672-11f0-a307-9557819bfe8e.jpg"),
    prod("p12", "c4", "Pãozão com Carne Crocante", 38, "Pão artesanal + carne de panela crocante (100g) + saladinha de maçã verde + abacate + picles de cebola roxa", "MenuItem/78394ad0-90ac-11ef-bfd0-995c8d1e1094.jpg"),
    prod("p13", "c4", "Mini Sanduba de Camarão", 32, "Mini sanduba de camarão + fonduta de provolone", "MenuItem/607e1e20-13e2-11f0-bd3f-d523131bd650.jpg"),
    prod("p14", "c4", "Combo Gem", 65, "Burger Gem + Batata frita (porção)", "MenuItem/46a22c10-2286-11ef-96e2-b79c1f3da9c8.jpg"),
  ] },
  { ...categoriasDemo[4], produtos: [
    prod("p15", "c5", "Tartare de Black Angus", 62, "Tartare de Black Angus (130g) + béarnaise de vinho tinto + castanha + alcaparra + meia cura + focaccia", "MenuItem/a140be40-43ae-11ef-b98d-edc6c56549a7.jpg"),
    prod("p16", "c5", "Polvo Grelhado", 74, "Polvo grelhado (120g) + mini batatas assadas + béarnaise de vinho tinto + crispy de arroz negro, páprica defumada", "MenuItem/094781f0-4673-11f0-a307-9557819bfe8e.jpg"),
    prod("p17", "c5", "Espetinho de coração", 46, "Coração marinado (12und) + molho tarê + amendoim + gergelim + coentro", "MenuItem/6fe494c0-4673-11f0-a307-9557819bfe8e.jpg"),
    prod("p18", "c5", "Ceviche", 52, "Peixe + aji com coco + abacate + crispy de milho + batata doce roxa", "MenuItem/89889b60-4673-11f0-a307-9557819bfe8e.jpg"),
  ] },
  { ...categoriasDemo[5], produtos: [
    prod("p19", "c6", "Batata Frita", 24, "Batata frita + aioli (porção 150g)", "MenuItem/f8ab0e80-0177-11ee-9628-7b0f4f8469bc.jpg"),
    prod("p20", "c6", "Focaccia", 22, "Focaccia (porção)", "MenuItem/075fd190-1f8b-11ef-908c-53cc7c5e6a0f.jpg"),
  ] },
  { ...categoriasDemo[6], produtos: [
    prod("p21", "c7", "Extravagância", 34, "Bolo de chocolate + creme inglês de paçoca + farofa crocante + sorvete de pudim + brigadeiro", "MenuItem/bc3af2c0-722d-11f0-8907-554e6c5fb222.jpg"),
    prod("p22", "c7", "Um Passeio pelo México", 32, "Churros + chantilly de ninho + sorvete de doce de leite + farofinha crocante", "MenuItem/afee2b80-f107-11ed-8c89-5796b78425aa.jpg"),
  ] },
];

export default async function MenuPreviewPage() {
  // Prévia real: se o dono está logado, mostra o cardápio DELE (mesma regra da página do cliente).
  const current = await getCurrentBar();
  if (current) {
    const supabase = await createClient();
    const [{ data: categorias }, { data: produtos }, { data: primeiraMesa }] = await Promise.all([
      supabase.from("categorias").select("*").eq("bar_id", current.bar.id).eq("ativo", true).order("ordem", { ascending: true }).returns<Categoria[]>(),
      supabase.from("produtos").select("*").eq("bar_id", current.bar.id).eq("ativo", true).returns<Produto[]>(),
      supabase.from("mesas").select("*").eq("bar_id", current.bar.id).eq("ativo", true).order("numero", { ascending: true }).limit(1).maybeSingle<Mesa>(),
    ]);

    const cardapio = (categorias ?? [])
      .map((c) => ({ ...c, produtos: (produtos ?? []).filter((p) => p.categoria_id === c.id) }))
      .filter((c) => c.produtos.length > 0);

    if (cardapio.length > 0) {
      const [topPedidos, destaques] = await Promise.all([getTopPedidos(current.bar.id), getDestaques(current.bar.id)]);
      const mesa: Mesa = primeiraMesa ?? { id: "preview", bar_id: current.bar.id, numero: 0, nome: "Prévia", capacidade: 4, ativo: true, ordem: null, created_at: "" };
      return <MenuApp bar={current.bar} mesa={mesa} cardapio={cardapio} topPedidos={topPedidos} destaques={destaques} />;
    }
  }

  return <MenuApp bar={barDemo} mesa={mesaDemo} cardapio={cardapioDemo} topPedidos={["p10", "p2", "p15", "p18", "p1"]} destaques={[]} />;
}
