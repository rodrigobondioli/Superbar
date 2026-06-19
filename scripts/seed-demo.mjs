/**
 * Seed do bar de demonstração (Aurora Bar).
 * Limpa duplicatas e adiciona produtos realistas com custo.
 *
 * Uso: node scripts/seed-demo.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qxxxfneklzbzgwgcpkhg.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eHhmbmVrbHpiemd3Z2Nwa2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY2Mjc5NCwiZXhwIjoyMDk3MjM4Nzk0fQ.42SSUM6I4pSw2lLmEqYDzEEwBHIWMT4ZVjKQ-kAWQtk";
const BAR_ID       = "0f6c70c5-5b6b-4514-b308-fb038ea043d9";

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── IDs existentes ────────────────────────────────────────────
const CAT_DRINQUES  = "4e459033-0c27-47d1-abb9-73faed6442cd";
const CAT_CERVEJAS  = "535dbbc1-3ca6-4364-b130-da75e5090854";
const CAT_PETISCOS  = "5a13d011-f85c-44cb-9694-ca5191c9e322";
// duplicata e teste — desativar
const CAT_PETISCOS2 = "d9103a7d-b79c-4064-89fb-cb8dd33b94a3";
const CAT_TESTE     = "884f9541-dd35-45d7-a84b-0fd582e7cebd";

async function run() {
  console.log("🧹 Limpando duplicatas...");

  // Desativa categorias duplicadas/teste
  await db.from("categorias").update({ ativo: false })
    .in("id", [CAT_PETISCOS2, CAT_TESTE]);

  // Desativa produtos das categorias lixo
  await db.from("produtos").update({ ativo: false })
    .in("categoria_id", [CAT_PETISCOS2, CAT_TESTE]);

  // ── Nova categoria: Não Alcoólicos ──────────────────────────
  console.log("📁 Criando categoria Não Alcoólicos...");
  const { data: catNA, error: errCat } = await db.from("categorias")
    .insert({ bar_id: BAR_ID, nome: "Não Alcoólicos", ordem: 3, ativo: true })
    .select("id").single();

  if (errCat) { console.error("Erro ao criar categoria:", errCat.message); return; }
  const CAT_NAO_ALC = catNA.id;

  // ── Reordena categorias existentes ──────────────────────────
  await db.from("categorias").update({ ordem: 0 }).eq("id", CAT_DRINQUES);
  await db.from("categorias").update({ ordem: 1 }).eq("id", CAT_CERVEJAS);
  await db.from("categorias").update({ ordem: 2 }).eq("id", CAT_PETISCOS);
  await db.from("categorias").update({ ordem: 3 }).eq("id", CAT_NAO_ALC);

  // ── Produtos ─────────────────────────────────────────────────
  const produtos = [
    // Drinques — já existem Caipirinha e Gin Tônica
    { nome: "Negroni",            preco: 42, custo: 13, cat: CAT_DRINQUES },
    { nome: "Aperol Spritz",      preco: 36, custo: 10, cat: CAT_DRINQUES },
    { nome: "Mojito",             preco: 32, custo: 9,  cat: CAT_DRINQUES },
    { nome: "Old Fashioned",      preco: 45, custo: 14, cat: CAT_DRINQUES },
    { nome: "Moscow Mule",        preco: 34, custo: 10, cat: CAT_DRINQUES },
    { nome: "Cosmopolitan",       preco: 36, custo: 10, cat: CAT_DRINQUES },
    { nome: "Daiquiri de Morango",preco: 32, custo: 9,  cat: CAT_DRINQUES },
    { nome: "Margarita",          preco: 34, custo: 10, cat: CAT_DRINQUES },
    { nome: "Caipiroska",         preco: 30, custo: 8,  cat: CAT_DRINQUES },
    { nome: "Sex on the Beach",   preco: 30, custo: 8,  cat: CAT_DRINQUES },
    { nome: "Whisky Sour",        preco: 42, custo: 13, cat: CAT_DRINQUES },
    { nome: "Dry Martini",        preco: 44, custo: 13, cat: CAT_DRINQUES },

    // Cervejas — já existem Heineken e Chopp 500ml
    { nome: "Stella Artois Long Neck", preco: 16, custo: 7, cat: CAT_CERVEJAS },
    { nome: "Corona Long Neck",        preco: 17, custo: 7, cat: CAT_CERVEJAS },
    { nome: "Budweiser Long Neck",     preco: 14, custo: 6, cat: CAT_CERVEJAS },
    { nome: "Brahma 350ml",            preco: 10, custo: 4, cat: CAT_CERVEJAS },
    { nome: "Chopp 300ml",             preco: 14, custo: 5, cat: CAT_CERVEJAS },
    { nome: "Eisenbahn Pilsen",        preco: 18, custo: 7, cat: CAT_CERVEJAS },
    { nome: "Colorado Appia",          preco: 19, custo: 8, cat: CAT_CERVEJAS },

    // Não alcoólicos
    { nome: "Coca-Cola Lata",          preco: 10, custo: 4, cat: CAT_NAO_ALC },
    { nome: "Guaraná Antarctica Lata", preco: 9,  custo: 3, cat: CAT_NAO_ALC },
    { nome: "Sprite Lata",             preco: 9,  custo: 3, cat: CAT_NAO_ALC },
    { nome: "Água Sem Gás 500ml",      preco: 7,  custo: 2, cat: CAT_NAO_ALC },
    { nome: "Água Com Gás 500ml",      preco: 8,  custo: 3, cat: CAT_NAO_ALC },
    { nome: "Tônica",                  preco: 9,  custo: 4, cat: CAT_NAO_ALC },
    { nome: "Red Bull",                preco: 24, custo: 10, cat: CAT_NAO_ALC },
    { nome: "Suco de Laranja Natural", preco: 18, custo: 5, cat: CAT_NAO_ALC },
    { nome: "Limonada Suíça",          preco: 20, custo: 5, cat: CAT_NAO_ALC },

    // Petiscos — já existe Batata Frita
    { nome: "Bolinho de Bacalhau (6 un)", preco: 42, custo: 14, cat: CAT_PETISCOS },
    { nome: "Tábua de Frios",             preco: 72, custo: 24, cat: CAT_PETISCOS },
    { nome: "Calabresa Acebolada",        preco: 45, custo: 14, cat: CAT_PETISCOS },
    { nome: "Camarão na Manteiga",        preco: 58, custo: 22, cat: CAT_PETISCOS },
    { nome: "Mix de Petiscos",            preco: 78, custo: 26, cat: CAT_PETISCOS },
    { nome: "Bruschetta (4 un)",          preco: 35, custo: 10, cat: CAT_PETISCOS },
    { nome: "Croquete de Carne (6 un)",   preco: 38, custo: 11, cat: CAT_PETISCOS },
    { nome: "Frango Crocante",            preco: 48, custo: 16, cat: CAT_PETISCOS },
  ];

  // Atualiza custo dos produtos existentes
  console.log("💰 Atualizando custos dos produtos existentes...");
  await db.from("produtos").update({ custo: 7  }).eq("nome", "Caipirinha").eq("bar_id", BAR_ID);
  await db.from("produtos").update({ custo: 9  }).eq("nome", "Gin Tônica").eq("bar_id", BAR_ID);
  await db.from("produtos").update({ custo: 5  }).eq("nome", "Chopp 500ml").eq("bar_id", BAR_ID);
  await db.from("produtos").update({ custo: 5  }).eq("nome", "Heineken Long Neck").eq("bar_id", BAR_ID);
  await db.from("produtos").update({ custo: 10 }).eq("nome", "Batata Frita").eq("bar_id", BAR_ID);

  // Insere novos produtos
  console.log(`🍹 Inserindo ${produtos.length} produtos...`);
  const rows = produtos.map(p => ({
    bar_id:       BAR_ID,
    categoria_id: p.cat,
    nome:         p.nome,
    preco:        p.preco,
    custo:        p.custo,
    ativo:        true,
    controla_estoque: false,
  }));

  const { error: errProd } = await db.from("produtos").insert(rows);
  if (errProd) { console.error("Erro ao inserir produtos:", errProd.message); return; }

  console.log("✅ Seed concluído!");
  console.log(`   • 4 categorias ativas (Drinques, Cervejas, Petiscos, Não Alcoólicos)`);
  console.log(`   • ${produtos.length + 5} produtos com custo cadastrado`);
  console.log(`   • CMV calculável desde o primeiro turno`);
}

run().catch(console.error);
