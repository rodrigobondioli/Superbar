import { MenuApp } from "@/components/menu/menu-app";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";
import { getTopPedidos } from "@/lib/menu/queries";
import { getDestaques } from "@/lib/destaques/queries";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

// ─── Demo (fallback quando não há bar logado) — estrutura do MiniBar Gem, sem
//     imagens (fotos entram no admin do bar; nada hotlinkado de terceiros). ────
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

function prod(id: string, cat_id: string, nome: string, preco: number, descricao: string | null): Produto {
  return { id, bar_id: "demo", categoria_id: cat_id, nome, preco, descricao, custo: null, custo_status: "sem", imagem_url: null, destaque: false, ativo: true, controla_estoque: false, created_at: "", updated_at: "" };
}

const categoriasDemo = [
  cat("c1", "Drinks Autorais", 1),
  cat("c2", "Mocktails", 2),
  cat("c3", "Clássicos da Coquetelaria", 3),
  cat("c4", "Especial do Dia", 4),
  cat("c5", "Happy Hour", 5),
  cat("c6", "Entradinhas", 6),
  cat("c7", "Burger & Sanduíches", 7),
  cat("c8", "Principais", 8),
  cat("c9", "Extras", 9),
  cat("c10", "Sobremesas", 10),
  cat("c11", "Bebidas Não Alcoólicas", 11),
  cat("c12", "Cervejas", 12),
  cat("c13", "Especiais Jack Daniel's", 13),
];

const cardapioDemo = [
  { ...categoriasDemo[0], produtos: [
    prod("p1", "c1", "Sertões e Sertões", 37, "(Ácido e frutado) Cachaça Origem + gengibre + vermute caju + espuma de caju — o moscow mule do sertão"),
    prod("p2", "c1", "Corsário", 46, "(Cítrico e levemente adocicado) Gin + cordial de acerola + vermute caju + solução cítrica"),
    prod("p3", "c1", "Mai Tai Nordestino", 42, "(Condimentado e potente) Blend de runs + tamarindo + maracujá + orgeat de licuri + angostura"),
    prod("p4", "c1", "Chopp Gem", 39, "(Adocicado e lupulado) Bourbon + solução cítrica + maracujá + licor de ervas + cerveja"),
    prod("p5", "c1", "Sopro Diamantino", 35, "(Potente com toque amargo) Bourbon + blend de vermutes + toque floral"),
    prod("p6", "c1", "Alvorada", 46, "(Cítrico e frutado) Cachaça Origem + frutas amarelas (manga, maracujá e cajá) + cordial de acerola + solução cítrica"),
    prod("p7", "c1", "Fruta Nera", 48, "(Frutado, suave e inquieto) Borbú Jabuticaba Cia dos Fermentados + destilado de jabuticaba Lemavos + shrub de caju"),
    prod("p8", "c1", "Ervas e Flores (sem álcool)", 21, "(Floral e herbal) Hibisco + jasmim + erva doce + água de coco + solução cítrica"),
    prod("p9", "c1", "Equilíbrio", 38, "(Cítrico, levemente doce e apimentado) Scotch whisky + limão + pimenta doce + açúcar"),
    prod("p10", "c1", "Mandacaru", 39, "Cachaça Origem + maracujá selvagem + limão + xarope de caju + xarope de coentro"),
  ] },
  { ...categoriasDemo[1], produtos: [
    prod("p11", "c2", "Fanfarra", 24, "(Frutado e suave) Maracujá + cajá + manga + coentro + açúcar + limão"),
    prod("p12", "c2", "Soda", 22, "Maracujá do mato | Acerola | Gengibre"),
    prod("p13", "c2", "Tabuleiro", 24, "(Adocicado e fresco) Cordial de acerola + gengibre + açúcar + limão + tônica"),
  ] },
  { ...categoriasDemo[2], produtos: [
    prod("p14", "c3", "Boulevardier", 42, null),
    prod("p15", "c3", "Fitzgerald", 38, null),
    prod("p16", "c3", "Mojito", 36, null),
    prod("p17", "c3", "Negroni", 42, null),
    prod("p18", "c3", "Rabo de Galo", 32, null),
    prod("p19", "c3", "Whisky Sour", 38, null),
  ] },
  { ...categoriasDemo[3], produtos: [
    prod("p20", "c4", "Mexilhões + Batata frita", 58, "Mexilhões (8un) + Batata frita (180g)"),
  ] },
  { ...categoriasDemo[4], produtos: [
    prod("p21", "c5", "Taco de Camarão Crocante", 36, "Camarão empanado + alface + vinagrete de manga verde + aioli de páprica + meia cura (2un.)"),
    prod("p22", "c5", "Pastel de cupim", 28, "Pastel de cupim acompanhado de fonduta de queijo meia cura (02und)"),
    prod("p23", "c5", "Combo Gem", 65, "Burger Gem + Batata frita (porção)"),
  ] },
  { ...categoriasDemo[5], produtos: [
    prod("p24", "c6", "Caldinho de Frutos do Mar", 28, "Caldinho de frutos do mar + espuma de coco"),
    prod("p25", "c6", "Sonho de Vatapá (04 und)", 34, "Sonho de vatapá + peixe curado + mujjol"),
  ] },
  { ...categoriasDemo[6], produtos: [
    prod("p26", "c7", "Burger Gem", 42, "Pão artesanal + 130g de Black Angus + cebola em três versões (maionese + crispy e picles)"),
    prod("p27", "c7", "Mini Hot Dog", 26, "Mini hot dog (50g) + aioli + barbecue picante + picles de cebola (2un.)"),
    prod("p28", "c7", "Pãozão com Carne Crocante", 38, "Pão artesanal + carne de panela crocante (100g) + saladinha de maçã verde + abacate + picles de cebola roxa"),
    prod("p29", "c7", "Mini Sanduba de Camarão", 32, "Mini sanduba de camarão + fonduta de provolone"),
  ] },
  { ...categoriasDemo[7], produtos: [
    prod("p30", "c8", "Tartare de Black Angus", 62, "Tartare de Black Angus (130g) + béarnaise de vinho tinto + castanha + alcaparra + meia cura + focaccia"),
    prod("p31", "c8", "Polvo Grelhado", 74, "Polvo grelhado (120g) + mini batatas assadas + béarnaise de vinho tinto + crispy de arroz negro + páprica defumada"),
    prod("p32", "c8", "Espetinho de coração", 46, "Coração marinado (12und) + molho tarê + amendoim + gergelim + coentro"),
    prod("p33", "c8", "Ceviche", 52, "Peixe + aji com coco + abacate + crispy de milho + batata doce roxa"),
  ] },
  { ...categoriasDemo[8], produtos: [
    prod("p34", "c9", "Batata Frita", 24, "Batata frita + aioli (porção 150g)"),
    prod("p35", "c9", "Focaccia", 22, "Focaccia (porção)"),
  ] },
  { ...categoriasDemo[9], produtos: [
    prod("p36", "c10", "Extravagância", 34, "Bolo de chocolate + creme inglês de paçoca + farofa crocante + sorvete de pudim + brigadeiro"),
    prod("p37", "c10", "Um Passeio pelo México", 32, "Churros + chantilly de ninho + sorvete de doce de leite + farofinha crocante"),
  ] },
  { ...categoriasDemo[10], produtos: [
    prod("p38", "c11", "Água", 8, "Com/sem gás"),
    prod("p39", "c11", "Água de Coco", 10, null),
    prod("p40", "c11", "Antárctica Tônica", 10, null),
    prod("p41", "c11", "Antárctica Tônica Zero", 10, null),
    prod("p42", "c11", "Café", 8, null),
    prod("p43", "c11", "Guaraná Antárctica", 8, null),
    prod("p44", "c11", "Guaraná Antárctica Zero", 8, null),
    prod("p45", "c11", "Pepsi", 8, null),
    prod("p46", "c11", "Pepsi Zero", 8, null),
    prod("p47", "c11", "Red Bull", 18, null),
    prod("p48", "c11", "Suco de Uva", 12, null),
  ] },
  { ...categoriasDemo[11], produtos: [
    prod("p49", "c12", "Becks", 16, null),
    prod("p50", "c12", "Corona", 18, null),
    prod("p51", "c12", "Corona Cero", 18, null),
    prod("p52", "c12", "IPA Carrie Nation", 26, "Cerveja intensa, com lúpulos americanos, aromas e sabores cítricos e de frutas amarelas + amargor assertivo. Consumir fresca."),
    prod("p53", "c12", "IPA Sour de Caju", 26, "Suculência, aroma e sabor do caju numa cerveja de acidez assertiva, leve e clara, que lembra um espumante."),
    prod("p54", "c12", "Stella Pure Gold", 16, null),
  ] },
  { ...categoriasDemo[12], produtos: [
    prod("p55", "c13", "Jack Old No. 7", 32, null),
    prod("p56", "c13", "Jack Apple", 32, null),
    prod("p57", "c13", "Jack Honey", 32, null),
    prod("p58", "c13", "Jack Fire", 32, null),
    prod("p59", "c13", "Gentleman Jack", 42, null),
    prod("p60", "c13", "Woodford Reserve", 48, null),
    prod("p61", "c13", "Single Barrel", 55, null),
    prod("p62", "c13", "El Jimador Reposado ou Blanco (Tequila 100% Agave)", 30, null),
    prod("p63", "c13", "Fords Gin London Dry", 34, null),
    prod("p64", "c13", "Gentleman's Sour", 42, "Suco de limão tahiti + xarope de açúcar + clara de ovo (opcional) + dash de Angostura bitters + gelo"),
    prod("p65", "c13", "Maracujack", 42, "Jack Daniel's Tennessee Whiskey + maracujá + xarope de açúcar + refrigerante de citrus + gelo"),
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

  return <MenuApp bar={barDemo} mesa={mesaDemo} cardapio={cardapioDemo} topPedidos={["p2", "p3", "p7", "p1", "p4"]} destaques={[]} />;
}
