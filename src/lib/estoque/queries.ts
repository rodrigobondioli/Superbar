import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MovimentoTipo } from "@/types/database";

export interface ItemEstoque {
  id: string;               // ingrediente_id
  nome: string;             // nome do insumo
  quantidadeAtual: number;  // na unidade-base (ml/g/un)
  quantidadeMinima: number;
  unidade: string;          // base: un/ml/l/g/kg
  custoAtual: number;       // R$ por unidade-base (custo é rei — Princípio 10)
  tamanhoEmbalagem: number | null;  // base por embalagem (ex: 750 = garrafa 750ml)
  unidadeCompra: string | null;     // rótulo: "garrafa" | "lata" | "pacote"
  valorEstoque: number;     // quantidadeAtual × custoAtual (R$ parado)
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

// Estoque = INSUMOS (ingredientes). É a mesma fonte da NF-e, da contagem, do
// dinheiro parado e do CMV — a inteligência mora aqui (Princípio 1/2). A tabela
// antiga `estoque`/`produtos` era um segundo sistema paralelo que a NF-e não
// alimentava; por isso a tela ficava vazia mesmo com insumos importados.
export async function getEstoque(barId: string): Promise<ItemEstoque[]> {
  // Admin (untyped): tamanho_embalagem/unidade_compra são colunas novas fora dos
  // tipos gerados. Read escopado por bar_id.
  const admin = createAdminClient();
  const { data } = await admin
    .from("ingredientes")
    .select("id, nome, unidade, estoque_atual, estoque_minimo, custo_atual, tamanho_embalagem, unidade_compra")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .order("nome", { ascending: true })
    .returns<Array<{
      id: string;
      nome: string;
      unidade: string;
      estoque_atual: number;
      estoque_minimo: number;
      custo_atual: number;
      tamanho_embalagem: number | null;
      unidade_compra: string | null;
    }>>();

  return (data ?? []).map((row) => {
    const qtd = Number(row.estoque_atual);
    const min = Number(row.estoque_minimo);
    const custo = Number(row.custo_atual);
    return {
      id: row.id,
      nome: row.nome,
      quantidadeAtual: qtd,
      quantidadeMinima: min,
      unidade: row.unidade,
      custoAtual: custo,
      tamanhoEmbalagem: row.tamanho_embalagem != null ? Number(row.tamanho_embalagem) : null,
      unidadeCompra: row.unidade_compra,
      valorEstoque: qtd * custo,
      // Só "abaixo do mínimo" quando há mínimo definido (>0). Insumo sem mínimo
      // e zerado cai em "crítico" pelo semáforo, não aqui.
      abaixoDoMinimo: min > 0 && qtd < min,
    };
  });
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

// ── Contagem de insumos (inventário físico) ─────────────────────────────────
// Contagem CEGA: o cliente recebe só id/nome/unidade — nunca o estoque esperado.
// Assim a pessoa conta a realidade, não carimba o número do sistema (Princípio 12).
// A diferença é calculada no servidor, depois de salvar.

export interface InsumoContagem {
  id: string;
  nome: string;
  unidade: string;                    // base: ml/g/un/l/kg
  tamanhoEmbalagem: number | null;    // base por embalagem (ex: 750 = garrafa 750ml); null = conta direto
  unidadeCompra: string | null;       // rótulo: "garrafa", "lata"…
}

export async function getInsumosParaContagem(barId: string): Promise<InsumoContagem[]> {
  // Admin (untyped): as colunas tamanho_embalagem/unidade_compra são novas e ainda
  // não estão nos tipos gerados. Read escopado por bar_id.
  const admin = createAdminClient();
  const { data } = await admin
    .from("ingredientes")
    .select("id, nome, unidade, tamanho_embalagem, unidade_compra")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .order("nome", { ascending: true })
    .returns<{ id: string; nome: string; unidade: string; tamanho_embalagem: number | null; unidade_compra: string | null }[]>();

  return (data ?? []).map((i) => ({
    id: i.id,
    nome: i.nome,
    unidade: i.unidade,
    tamanhoEmbalagem: i.tamanho_embalagem,
    unidadeCompra: i.unidade_compra,
  }));
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

  const { data: movs } = await supabase
    .from("ingrediente_movimentos")
    .select("id, tipo, quantidade, motivo, criado_em, ingrediente_id")
    .eq("bar_id", barId)
    .order("criado_em", { ascending: false })
    .limit(50)
    .returns<Array<{ id: string; tipo: string; quantidade: number; motivo: string | null; criado_em: string; ingrediente_id: string }>>();

  if (!movs || movs.length === 0) return [];

  // Nome do insumo em passo separado (evita embed que tipa `never` — ver memória).
  const ingIds = [...new Set(movs.map(m => m.ingrediente_id))];
  const { data: ings } = await supabase
    .from("ingredientes")
    .select("id, nome")
    .in("id", ingIds)
    .returns<Array<{ id: string; nome: string }>>();
  const nomeMap = new Map((ings ?? []).map(i => [i.id, i.nome]));

  return movs.map(row => ({
    id: row.id,
    tipo: row.tipo,
    quantidade: Number(row.quantidade),
    motivo: row.motivo,
    produtoNome: nomeMap.get(row.ingrediente_id) ?? "Insumo",
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
