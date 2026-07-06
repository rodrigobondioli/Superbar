import { createClient } from "@/lib/supabase/server";
import { percentChange } from "@/lib/dashboard/percent-change";
import { gerarDiasDoPeriodo, inicioDoDia, periodoAnterior, type PeriodoRange } from "@/lib/dashboard/periodo";
import type { TopDrink } from "@/lib/dashboard/queries";
import type { CustoStatus } from "@/types/database";
import { calcularCmv } from "@/lib/dashboard/menu-engineering";

export interface PontoFaturamento {
  label: string;
  value: number;
}

function formatDiaMes(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatDiaSemana(date: Date) {
  const abreviado = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(/\.$/, "");
  return abreviado.charAt(0).toUpperCase() + abreviado.slice(1);
}

export async function getFaturamentoPorDia(
  barId: string,
  periodo: PeriodoRange,
  formatoLabel: "dataCurta" | "diaSemana" = "dataCurta"
): Promise<PontoFaturamento[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pagamentos")
    .select("valor, processado_em")
    .eq("bar_id", barId)
    .eq("status", "confirmado")
    .gte("processado_em", periodo.inicio.toISOString())
    .lte("processado_em", periodo.fim.toISOString())
    .returns<{ valor: number; processado_em: string }[]>();

  const porDia = new Map<string, number>();
  for (const pagamento of data ?? []) {
    const chave = inicioDoDia(new Date(pagamento.processado_em)).toISOString();
    porDia.set(chave, (porDia.get(chave) ?? 0) + pagamento.valor);
  }

  const formatar = formatoLabel === "diaSemana" ? formatDiaSemana : formatDiaMes;
  return gerarDiasDoPeriodo(periodo).map((dia) => ({
    label: formatar(dia),
    value: porDia.get(inicioDoDia(dia).toISOString()) ?? 0,
  }));
}

export interface ComparacaoPeriodo {
  atual: number;
  anterior: number;
  percentual: number | null;
}

export async function getComparacaoPeriodo(barId: string, periodo: PeriodoRange): Promise<ComparacaoPeriodo> {
  const supabase = await createClient();
  const anterior = periodoAnterior(periodo);

  const { data } = await supabase
    .from("pagamentos")
    .select("valor, processado_em")
    .eq("bar_id", barId)
    .eq("status", "confirmado")
    .gte("processado_em", anterior.inicio.toISOString())
    .lte("processado_em", periodo.fim.toISOString())
    .returns<{ valor: number; processado_em: string }[]>();

  let atual = 0;
  let anteriorTotal = 0;
  for (const pagamento of data ?? []) {
    const processadoEm = new Date(pagamento.processado_em);
    if (processadoEm >= periodo.inicio) atual += pagamento.valor;
    else anteriorTotal += pagamento.valor;
  }

  return { atual, anterior: anteriorTotal, percentual: percentChange(atual, anteriorTotal) };
}

export interface ProdutoRanking {
  produtoNome: string;
  quantidadeVendida: number;
  faturamento: number;
}

export async function getRankingProdutos(
  barId: string,
  periodo: PeriodoRange,
  limit = 5
): Promise<ProdutoRanking[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("comanda_items")
    .select("quantidade, preco_total, produtos(nome)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .gte("adicionado_em", periodo.inicio.toISOString())
    .lte("adicionado_em", periodo.fim.toISOString())
    .returns<
      { quantidade: number; preco_total: number; produtos: { nome: string } | null }[]
    >();

  const porProduto = new Map<string, ProdutoRanking>();
  for (const item of data ?? []) {
    const nome = item.produtos?.nome ?? "Produto";
    const atual = porProduto.get(nome) ?? { produtoNome: nome, quantidadeVendida: 0, faturamento: 0 };
    atual.quantidadeVendida += Number(item.quantidade);
    atual.faturamento += Number(item.preco_total);
    porProduto.set(nome, atual);
  }

  return [...porProduto.values()]
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
    .slice(0, limit);
}

export interface VendaGarcom {
  memberId: string;
  nome: string;
  fotoUrl: string | null;
  totalVendido: number;
  qtdItens: number;
}

/** Vendas por garçom no período — atribuição pelo item lançado (adicionado_por_member_id).
 *  Base = pedido lançado (não pagamento), então reflete quem VENDEU, mesmo comanda aberta. */
export async function getVendasPorGarcom(barId: string, periodo: PeriodoRange): Promise<VendaGarcom[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comanda_items")
    .select("quantidade, preco_total, adicionado_por_member_id")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .gte("adicionado_em", periodo.inicio.toISOString())
    .lte("adicionado_em", periodo.fim.toISOString())
    .not("adicionado_por_member_id", "is", null)
    .returns<{ quantidade: number; preco_total: number; adicionado_por_member_id: string }[]>();

  const porMembro = new Map<string, { total: number; qtd: number }>();
  for (const it of data ?? []) {
    const cur = porMembro.get(it.adicionado_por_member_id) ?? { total: 0, qtd: 0 };
    cur.total += Number(it.preco_total);
    cur.qtd += Number(it.quantidade);
    porMembro.set(it.adicionado_por_member_id, cur);
  }
  if (porMembro.size === 0) return [];

  const ids = [...porMembro.keys()];
  const { data: membros } = await supabase
    .from("bar_members")
    .select("id, nome, foto_url")
    .in("id", ids)
    .returns<{ id: string; nome: string | null; foto_url: string | null }[]>();
  const membroMap = new Map((membros ?? []).map(m => [m.id, m]));

  return ids
    .map(id => {
      const v = porMembro.get(id)!;
      const m = membroMap.get(id);
      return { memberId: id, nome: m?.nome ?? "Sem nome", fotoUrl: m?.foto_url ?? null, totalVendido: v.total, qtdItens: v.qtd };
    })
    .sort((a, b) => b.totalVendido - a.totalVendido);
}

export interface KpisFinanceirosPeriodo {
  cmv: number | null;          // % custo sobre receita
  margemBruta: number | null;  // % (100 - CMV)
  ticketMedio: number | null;  // R$
  cmvParcial: boolean;         // true se nem todos os produtos têm custo
}

export async function getKpisFinanceirosPeriodo(
  barId: string,
  periodo: PeriodoRange
): Promise<KpisFinanceirosPeriodo> {
  const supabase = await createClient();

  // Ticket médio: receita / comandas pagas no período
  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("valor, comanda_id")
    .eq("bar_id", barId)
    .eq("status", "confirmado")
    .gte("processado_em", periodo.inicio.toISOString())
    .lte("processado_em", periodo.fim.toISOString())
    .returns<{ valor: number; comanda_id: string }[]>();

  const totalReceita = (pagamentos ?? []).reduce((s, p) => s + Number(p.valor), 0);
  const totalComandas = new Set((pagamentos ?? []).map(p => p.comanda_id)).size;
  const ticketMedio = totalComandas > 0 ? totalReceita / totalComandas : null;

  // CMV e margem: produtos vendidos com custo
  const produtos = await getProdutosVendidosPeriodo(barId, periodo);
  const cmv = calcularCmv(produtos);
  const margemBruta = cmv !== null ? Math.round(100 - cmv) : null;
  // Parcial se algum produto vendido não tem custo confirmado (estimado ou sem).
  const cmvParcial = produtos.some(p => p.custoStatus !== "confirmada");

  return { cmv, margemBruta, ticketMedio, cmvParcial };
}

// Mesma agregação de getProdutosVendidosTurno (queries.ts), mas filtrada por
// um intervalo de datas em vez de um turno específico — usada por cálculos
// de CMV mensais, que precisam da lista completa (sem corte de top-N).
export async function getProdutosVendidosPeriodo(barId: string, periodo: PeriodoRange): Promise<TopDrink[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comanda_items")
    .select("quantidade, preco_total, produto_id, produtos(nome, preco, custo, custo_status)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .gte("adicionado_em", periodo.inicio.toISOString())
    .lte("adicionado_em", periodo.fim.toISOString())
    .returns<
      {
        quantidade: number;
        preco_total: number;
        produto_id: string;
        produtos: { nome: string; preco: number; custo: number | null; custo_status: CustoStatus } | null;
      }[]
    >();

  const porProduto = new Map<string, TopDrink>();
  for (const item of data ?? []) {
    if (!item.produtos) continue;

    const atual =
      porProduto.get(item.produto_id) ??
      ({
        produtoId: item.produto_id,
        produtoNome: item.produtos.nome,
        quantidadeVendida: 0,
        faturamento: 0,
        preco: item.produtos.preco,
        custo: item.produtos.custo,
        custoStatus: item.produtos.custo_status,
      } satisfies TopDrink);

    atual.quantidadeVendida += Number(item.quantidade);
    atual.faturamento += Number(item.preco_total);
    porProduto.set(item.produto_id, atual);
  }

  return [...porProduto.values()];
}
