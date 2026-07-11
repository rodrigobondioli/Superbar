import { createClient } from "@/lib/supabase/server";
import type { EstoqueUnidade, MovimentoTipo } from "@/types/database";

export interface ItemEstoque {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  unidade: EstoqueUnidade;
  abaixoDoMinimo: boolean;
}

export interface MovimentoEstoque {
  id: string;
  tipo: MovimentoTipo;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadePosterior: number;
  motivo: string | null;
  criadoEm: string;
}

export async function getEstoque(barId: string): Promise<ItemEstoque[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("estoque")
    .select("id, produto_id, quantidade_atual, quantidade_minima, unidade, produtos(nome)")
    .eq("bar_id", barId)
    .order("quantidade_atual", { ascending: true })
    .returns<Array<{
      id: string;
      produto_id: string;
      quantidade_atual: number;
      quantidade_minima: number;
      unidade: EstoqueUnidade;
      produtos: { nome: string } | null;
    }>>();

  return (data ?? []).map((row) => ({
    id: row.id,
    produtoId: row.produto_id,
    produtoNome: row.produtos?.nome ?? "Produto",
    quantidadeAtual: Number(row.quantidade_atual),
    quantidadeMinima: Number(row.quantidade_minima),
    unidade: row.unidade,
    abaixoDoMinimo: Number(row.quantidade_atual) < Number(row.quantidade_minima),
  }));
}

// ── Dinheiro parado (excess / slow-moving inventory) ────────────────────────
// Capital dormindo na prateleira: insumo valorizado que NÃO teve saída ('venda')
// nos últimos DIAS_PARADO dias. Guardrails: só insumo com custo e estoque > 0
// (valorizável, honesto); gate anti-falso-positivo — se o bar não teve nenhuma
// venda de insumo no período, é bar sem operação, não estoque encalhado (não
// alarma); silencioso sem dado.

export interface InsumoParado {
  id: string;
  nome: string;
  unidade: string;
  estoqueAtual: number;
  custoUnitario: number;
  valorParado: number;   // estoqueAtual * custoUnitario
}

export interface DinheiroParado {
  total: number;              // R$ total parado
  dias: number;               // janela sem giro considerada
  itens: InsumoParado[];      // top N por valor
}

const DIAS_PARADO = 60;
const VALOR_MIN_PARADO = 30;  // R$ — abaixo disso não vale puxar a atenção

export async function getDinheiroParado(barId: string): Promise<DinheiroParado> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - DIAS_PARADO * 86_400_000).toISOString();

  const [{ data: insumos }, { data: vendas }] = await Promise.all([
    supabase
      .from("ingredientes")
      .select("id, nome, unidade, estoque_atual, custo_atual")
      .eq("bar_id", barId)
      .eq("ativo", true)
      .gt("estoque_atual", 0)
      .gt("custo_atual", 0)
      .returns<{ id: string; nome: string; unidade: string; estoque_atual: number; custo_atual: number }[]>(),
    supabase
      .from("ingrediente_movimentos")
      .select("ingrediente_id")
      .eq("bar_id", barId)
      .eq("tipo", "venda")
      .gte("criado_em", desde)
      .returns<{ ingrediente_id: string }[]>(),
  ]);

  // Gate: bar sem NENHUMA venda de insumo no período não é "encalhe" — não alarma.
  if (!vendas || vendas.length === 0) return { total: 0, dias: DIAS_PARADO, itens: [] };

  const giraram = new Set(vendas.map((v) => v.ingrediente_id));

  const parados = (insumos ?? [])
    .filter((i) => !giraram.has(i.id))                         // não saiu no período
    .map((i) => ({
      id: i.id,
      nome: i.nome,
      unidade: i.unidade,
      estoqueAtual: Number(i.estoque_atual),
      custoUnitario: Number(i.custo_atual),
      valorParado: Number(i.estoque_atual) * Number(i.custo_atual),
    }))
    .filter((i) => i.valorParado >= VALOR_MIN_PARADO)          // só o que pesa
    .sort((a, b) => b.valorParado - a.valorParado);

  const total = parados.reduce((s, i) => s + i.valorParado, 0);
  return { total, dias: DIAS_PARADO, itens: parados.slice(0, 6) };
}

export interface MovimentoRecente {
  id: string;
  tipo: string;
  quantidade: number;
  motivo: string | null;
  produtoNome: string;
  criadoEm: string;
}

export async function getMovimentosRecentes(barId: string): Promise<MovimentoRecente[]> {
  const supabase = await createClient();

  // Mapa estoqueId → nome do produto
  const { data: estoqueItems } = await supabase
    .from("estoque")
    .select("id, produtos(nome)")
    .eq("bar_id", barId)
    .returns<Array<{ id: string; produtos: { nome: string } | null }>>();

  const nomeMap = new Map(
    (estoqueItems ?? []).map(e => [e.id, e.produtos?.nome ?? "Produto"])
  );
  const estoqueIds = [...nomeMap.keys()];
  if (estoqueIds.length === 0) return [];

  const { data } = await supabase
    .from("estoque_movimentos")
    .select("id, tipo, quantidade, motivo, criado_em, referencia_id")
    .in("referencia_id", estoqueIds)
    .order("criado_em", { ascending: false })
    .limit(50)
    .returns<Array<{ id: string; tipo: string; quantidade: number; motivo: string | null; criado_em: string; referencia_id: string }>>();

  return (data ?? []).map(row => ({
    id: row.id,
    tipo: row.tipo,
    quantidade: Number(row.quantidade),
    motivo: row.motivo,
    produtoNome: nomeMap.get(row.referencia_id) ?? "Produto",
    criadoEm: row.criado_em,
  }));
}

export async function getMovimentosEstoque(estoqueId: string): Promise<MovimentoEstoque[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("estoque_movimentos")
    .select("id, tipo, quantidade, quantidade_anterior, quantidade_posterior, motivo, criado_em")
    .eq("referencia_id", estoqueId)
    .order("criado_em", { ascending: false })
    .limit(20)
    .returns<Array<{
      id: string;
      tipo: MovimentoTipo;
      quantidade: number;
      quantidade_anterior: number;
      quantidade_posterior: number;
      motivo: string | null;
      criado_em: string;
    }>>();

  return (data ?? []).map((row) => ({
    id: row.id,
    tipo: row.tipo,
    quantidade: Number(row.quantidade),
    quantidadeAnterior: Number(row.quantidade_anterior),
    quantidadePosterior: Number(row.quantidade_posterior),
    motivo: row.motivo,
    criadoEm: row.criado_em,
  }));
}
