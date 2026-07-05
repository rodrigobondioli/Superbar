import { createAdminClient } from "@/lib/supabase/admin";

export type MesaPublica = {
  id: string;
  numero: number;
  nome: string | null;
  bar: {
    id: string;
    nome: string;
    autoPedido: boolean;
  };
};

export type ProdutoPublico = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  foto_url: string | null;
  categoriaNome: string;
  variantes: { id: string; nome: string; preco: number }[];
};

export async function getMesaPublica(mesaId: string): Promise<MesaPublica | null> {
  const supabase = createAdminClient();

  const { data: mesa } = await supabase
    .from("mesas")
    .select("id, numero, nome, bar_id")
    .eq("id", mesaId)
    .maybeSingle<{ id: string; numero: number; nome: string | null; bar_id: string }>();

  if (!mesa) return null;

  const { data: bar } = await supabase
    .from("bars")
    .select("id, nome, configuracoes")
    .eq("id", mesa.bar_id)
    .eq("ativo", true)
    .maybeSingle<{ id: string; nome: string; configuracoes: { auto_pedido?: boolean } }>();

  if (!bar) return null;

  return {
    id: mesa.id,
    numero: mesa.numero,
    nome: mesa.nome,
    bar: {
      id: bar.id,
      nome: bar.nome,
      autoPedido: bar.configuracoes?.auto_pedido ?? false,
    },
  };
}

export async function getProdutosPublicos(barId: string): Promise<ProdutoPublico[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("produtos")
    .select(`
      id, nome, descricao, preco, imagem_url,
      categorias(nome),
      produto_variantes(id, nome, preco)
    `)
    .eq("bar_id", barId)
    .eq("ativo", true)
    .order("nome");

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((p: any) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao ?? null,
    preco: p.preco,
    foto_url: p.imagem_url ?? null,
    categoriaNome: p.categorias?.nome ?? "Cardápio",
    variantes: (p.produto_variantes ?? []).map((v: { id: string; nome: string; preco: number }) => ({
      id: v.id,
      nome: v.nome,
      preco: v.preco,
    })),
  }));
}

/** Doses possíveis por produto a partir da ficha (min de estoque_atual/dose entre
 *  os ingredientes ativos). Produto sem ficha não entra no mapa (sem limite = disponível).
 *  Usado pra marcar "esgotado" no cardápio e travar o pedido no servidor. */
export async function getDosesDisponiveis(barId: string): Promise<Map<string, number>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("receitas")
    .select("produto_id, quantidade, ingredientes(estoque_atual, ativo)")
    .eq("bar_id", barId);

  const map = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    const ing = Array.isArray(r.ingredientes) ? r.ingredientes[0] : r.ingredientes;
    // ingrediente inativo ou dose inválida → não limita por esse insumo
    const doses = ing && ing.ativo && r.quantidade > 0
      ? Math.floor(Number(ing.estoque_atual) / Number(r.quantidade))
      : Number.POSITIVE_INFINITY;
    const prev = map.get(r.produto_id) ?? Number.POSITIVE_INFINITY;
    map.set(r.produto_id, Math.min(prev, doses));
  }
  return map;
}

/** IDs de produtos esgotados (0 doses possíveis pela ficha). */
export async function getEsgotados(barId: string): Promise<string[]> {
  const doses = await getDosesDisponiveis(barId);
  return [...doses.entries()].filter(([, n]) => n < 1).map(([id]) => id);
}
