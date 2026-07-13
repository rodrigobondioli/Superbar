import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Bar, BarRole, Turno, CustoStatus } from "@/types/database";
import { percentChange } from "@/lib/dashboard/percent-change";
import { calcularCmv } from "@/lib/dashboard/menu-engineering";
import { OPERADOR_COOKIE } from "@/lib/kiosk/constants";

export interface CurrentBar {
  bar: Bar;
  role: BarRole;
  userId: string;
  /** bar_members.id — identidade operacional para atribuição de pedidos, comandas,
   *  pagamentos e movimentos de estoque. Presente para qualquer membro com conta auth.
   *  Para staff sem auth (bartender/garçom/caixa), o memberId virá do device via
   *  seleção local + PIN. */
  memberId: string;
  /** Membro a quem as AÇÕES devem ser atribuídas: o operador selecionado no device
   *  (garçom/bartender/caixa), se houver; senão o membro autenticado. null = sem atribuição. */
  atribuicaoMemberId: string | null;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
  /** true = sessão kiosk (iPad do bar sem login do dono) */
  isKiosk?: boolean;
}

// cache(): dedupe por request — layout e page chamam getCurrentBar no mesmo
// request; sem isso a checagem de auth+bar (2 viagens ao Supabase) roda 2x.
export const getCurrentBar = cache(async (): Promise<CurrentBar | null> => {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const opCookie = cookieStore.get(OPERADOR_COOKIE)?.value || null;
  const { data: auth } = await supabase.auth.getUser();

  // ── 1. Autenticação normal (dono / gerente com conta) ──────────────────────
  if (auth.user) {
    const { data: membership } = await supabase
      .from("bar_members")
      .select("id, role, bars(*), profiles!bar_members_user_id_fkey(nome, avatar_url)")
      .eq("user_id", auth.user.id)
      .eq("ativo", true)
      .limit(1)
      .maybeSingle<{ id: string; role: BarRole; bars: Bar; profiles: { nome: string; avatar_url: string | null } | null }>();

    if (membership?.bars) {
      return {
        bar: membership.bars,
        role: membership.role,
        userId: auth.user.id,
        memberId: membership.id,
        atribuicaoMemberId: opCookie || membership.id,
        userNome: membership.profiles?.nome ?? auth.user.email ?? "Usuário",
        userEmail: auth.user.email ?? "",
        userAvatarUrl: membership.profiles?.avatar_url ?? null,
      };
    }
  }

  // ── 2. Modo de operação do dispositivo: LOGIN COMPARTILHADO ─────────────────
  // O iPad/dispositivo do bar loga UMA vez com uma conta do bar (sessão PWA
  // persistente) e o OperadorShell escolhe QUEM está operando (atribuição via
  // OPERADOR_COOKIE). A RLS fica ligada em toda a operação — o dado de um bar
  // nunca vaza pra outro.
  //
  // O antigo modo "kiosk sem login" (token no cookie) foi desativado de propósito:
  // sem sessão auth, a RLS bloqueia leitura E escrita de mesa/comanda/pedido,
  // então o dispositivo ficaria inoperante. Princípio 9 — não expor caminho falso.
  // Se nenhum usuário estiver autenticado, as superfícies operacionais mandam
  // pro /login.
  return null;
});

export async function getTurnoAtual(barId: string): Promise<Turno | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .maybeSingle();

  return data ?? null;
}

export interface KpisTurno {
  faturamento: number;
  comandasAbertas: number;
  ticketMedio: number;
}

export async function getKpisTurno(turno: Turno): Promise<KpisTurno> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("comandas")
    .select("id", { count: "exact", head: true })
    .eq("turno_id", turno.id)
    .eq("status", "aberta");

  const faturamento = turno.total_vendas;
  const comandasAbertas = count ?? 0;
  const ticketMedio = turno.total_comandas > 0 ? faturamento / turno.total_comandas : 0;

  return { faturamento, comandasAbertas, ticketMedio };
}

export interface AlertaEstoque {
  produtoNome: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
}

// Alertas = INSUMOS abaixo do mínimo (ingredientes) — mesma fonte da tela de
// Estoque. Antes lia a tabela legada `estoque`/`produtos` (vazia), então o alerta
// do dono e o sino NÃO refletiam os insumos reais. Só alerta quem tem mínimo
// definido (>0); zerado sem mínimo é "crítico" na tela, não "abaixo do mínimo".
export async function getAlertasEstoque(barId: string): Promise<AlertaEstoque[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredientes")
    .select("nome, estoque_atual, estoque_minimo")
    .eq("bar_id", barId)
    .eq("ativo", true)
    .gt("estoque_minimo", 0)
    .returns<{ nome: string; estoque_atual: number; estoque_minimo: number }[]>();

  if (!data) return [];

  return data
    .filter((row) => Number(row.estoque_atual) < Number(row.estoque_minimo))
    .map((row) => ({
      produtoNome: row.nome,
      quantidadeAtual: Number(row.estoque_atual),
      quantidadeMinima: Number(row.estoque_minimo),
    }));
}

// ── Variação de custo do insumo (variance alert) ────────────────────────────
// Compara as DUAS últimas entradas (compra) do mesmo insumo. Se o custo subiu
// acima do limiar, a margem dos drinks com esse insumo está sendo comida.
// Guardrails: funciona pra entrada manual OU NF-e (não exige nota); só fala de
// insumo com 2 compras custeadas (parcial, honesto); silencioso sem dado.

export interface VariacaoCusto {
  ingredienteId: string;
  ingredienteNome: string;
  unidade: string;
  custoAnterior: number;
  custoAtual: number;
  pctChange: number;         // 0.18 = +18%
  fornecedorNome: string | null;
}

/** Alta mínima (fração) para virar alerta. +10% já dói na margem. */
const LIMIAR_VARIACAO_CUSTO = 0.10;

export async function getVariacaoCusto(barId: string, limiar = LIMIAR_VARIACAO_CUSTO): Promise<VariacaoCusto[]> {
  const supabase = await createClient();

  // Só colunas escalares (sem embed) — tipagem limpa e independente das relações
  // novas da NF-e. Nome do insumo vem numa segunda query enxuta.
  const { data: movs } = await supabase
    .from("ingrediente_movimentos")
    .select("ingrediente_id, custo_unitario")
    .eq("bar_id", barId)
    .eq("tipo", "entrada")
    .gt("custo_unitario", 0)
    .order("criado_em", { ascending: false })
    .limit(500)
    .returns<{ ingrediente_id: string; custo_unitario: number | null }[]>();

  if (!movs || movs.length === 0) return [];

  // Agrupa por insumo, guardando só as 2 entradas mais recentes (já vem desc).
  const porInsumo = new Map<string, number[]>();
  for (const row of movs) {
    if (row.custo_unitario == null) continue;
    const arr = porInsumo.get(row.ingrediente_id);
    if (!arr) porInsumo.set(row.ingrediente_id, [Number(row.custo_unitario)]);
    else if (arr.length < 2) arr.push(Number(row.custo_unitario));
  }

  // Calcula a variação por insumo (precisa de 2 compras custeadas).
  const variacoes = new Map<string, { custoAnterior: number; custoAtual: number; pctChange: number }>();
  for (const [ingredienteId, custos] of porInsumo) {
    if (custos.length < 2) continue;                    // parcial, honesto
    const [custoAtual, custoAnterior] = custos;
    if (!(custoAnterior > 0)) continue;
    const pctChange = (custoAtual - custoAnterior) / custoAnterior;
    if (pctChange < limiar) continue;                   // só alta relevante
    variacoes.set(ingredienteId, { custoAnterior, custoAtual, pctChange });
  }

  if (variacoes.size === 0) return [];

  // Nomes/unidades dos insumos que dispararam.
  const { data: ings } = await supabase
    .from("ingredientes")
    .select("id, nome, unidade")
    .in("id", [...variacoes.keys()]);

  const nomePorId = new Map((ings ?? []).map((i) => [i.id, { nome: i.nome, unidade: i.unidade }]));

  const out: VariacaoCusto[] = [];
  for (const [ingredienteId, v] of variacoes) {
    const info = nomePorId.get(ingredienteId);
    out.push({
      ingredienteId,
      ingredienteNome: info?.nome ?? "Insumo",
      unidade: info?.unidade ?? "",
      custoAnterior: v.custoAnterior,
      custoAtual: v.custoAtual,
      pctChange: v.pctChange,
      fornecedorNome: null,
    });
  }

  out.sort((a, b) => b.pctChange - a.pctChange);
  return out.slice(0, 5);
}

export interface TopDrink {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  faturamento: number;
  preco: number;
  custo: number | null;
  custoStatus: CustoStatus;
  /** true = categoria usa ficha (drink de verdade/cocktail). Água e comida = false.
   *  Usado só pra filtrar o widget "Top drinks"; CMV/margem contam tudo. */
  usaFicha?: boolean;
}

// Lista completa, sem limite — quem só precisa exibir um "top N" (a tabela
// de Top Drinks) corta a lista; cálculos agregados como CMV precisam de
// todos os produtos vendidos no turno, senão o número fica errado.
export async function getProdutosVendidosTurno(barId: string, turnoId: string): Promise<TopDrink[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comanda_items")
    .select("quantidade, preco_total, produto_id, produtos(nome, preco, custo, custo_status, categorias(usa_ficha)), comandas!inner(turno_id)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .eq("comandas.turno_id", turnoId)
    .returns<
      {
        quantidade: number;
        preco_total: number;
        produto_id: string;
        produtos: { nome: string; preco: number; custo: number | null; custo_status: CustoStatus; categorias: { usa_ficha: boolean } | null } | null;
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
        usaFicha: item.produtos.categorias?.usa_ficha ?? false,
      } satisfies TopDrink);

    atual.quantidadeVendida += Number(item.quantidade);
    atual.faturamento += Number(item.preco_total);
    porProduto.set(item.produto_id, atual);
  }

  return [...porProduto.values()].sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);
}

export interface KpisComparacao {
  faturamento: number | null;
  comandas: number | null;
  ticketMedio: number | null;
  alertasEstoque: number | null;
  cmv: number | null;
}

const SEM_COMPARACAO: KpisComparacao = {
  faturamento: null,
  comandas: null,
  ticketMedio: null,
  alertasEstoque: null,
  cmv: null,
};

// Compara o turno atual com o turno fechado mais recente. Pra alertas de
// estoque, reconstrói o nível de cada produto no momento em que o turno
// anterior fechou a partir do audit trail real (estoque_movimentos), em vez
// de inventar um número.
export async function getKpisComparacao(
  barId: string,
  turnoAtual: Turno,
  kpisAtual: KpisTurno,
  _alertasAtuaisCount: number, // reservado: comparativo de alertas vs turno anterior (ver getAlertasEstoque)
  produtosVendidosAtual: TopDrink[]
): Promise<KpisComparacao> {
  const supabase = await createClient();

  const { data: turnoAnterior } = await supabase
    .from("turnos")
    .select("id, total_vendas, total_comandas, fechado_em")
    .eq("bar_id", barId)
    .eq("status", "fechado")
    .neq("id", turnoAtual.id)
    .order("fechado_em", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      total_vendas: number;
      total_comandas: number;
      fechado_em: string | null;
    }>();

  if (!turnoAnterior) return SEM_COMPARACAO;

  const faturamento = percentChange(turnoAtual.total_vendas, turnoAnterior.total_vendas);

  const comandasAtual = kpisAtual.comandasAbertas + turnoAtual.total_comandas;
  const comandas = percentChange(comandasAtual, turnoAnterior.total_comandas);

  const ticketMedioAnterior =
    turnoAnterior.total_comandas > 0 ? turnoAnterior.total_vendas / turnoAnterior.total_comandas : 0;
  const ticketMedio = percentChange(kpisAtual.ticketMedio, ticketMedioAnterior);

  // Comparativo de alertas de estoque vs turno anterior fica de fora por ora:
  // exigiria reconstruir o nível histórico de cada INSUMO pelo audit trail
  // (ingrediente_movimentos), com o sinal certo por tipo. Sem isso é chute —
  // melhor não mostrar % do que mostrar errado (Princípio 9). O número ATUAL de
  // alertas segue vindo de getAlertasEstoque (agora sobre insumos reais).
  const alertasEstoque: number | null = null;

  const cmvAtual = calcularCmv(produtosVendidosAtual);
  const produtosVendidosAnterior = await getProdutosVendidosTurno(barId, turnoAnterior.id);
  const cmvAnterior = calcularCmv(produtosVendidosAnterior);
  const cmv = cmvAtual !== null && cmvAnterior !== null ? percentChange(cmvAtual, cmvAnterior) : null;

  return { faturamento, comandas, ticketMedio, alertasEstoque, cmv };
}

export interface LiveStats {
  mesas: number;
  drinks: number;
}

export async function getLiveStats(barId: string, turnoId: string): Promise<LiveStats> {
  const supabase = await createClient();

  const { data: comandas } = await supabase
    .from("comandas")
    .select("mesa_id")
    .eq("turno_id", turnoId)
    .eq("status", "aberta")
    .returns<{ mesa_id: string | null }[]>();

  const mesas = new Set((comandas ?? []).map(c => c.mesa_id).filter(Boolean)).size;

  const { data: items } = await supabase
    .from("comanda_items")
    .select("quantidade, comandas!inner(turno_id)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .eq("comandas.turno_id", turnoId)
    .returns<{ quantidade: number; comandas: { turno_id: string } | null }[]>();

  const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);

  return { mesas, drinks };
}

export async function getMetaMes(barId: string, metaMensalConfigurada?: number) {
  const supabase = await createClient()
  const agora = new Date()

  // Current month
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
  const fimMesAtual = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Last month
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString()
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59).toISOString()

  const [mesAtualResult, mesAnteriorResult] = await Promise.all([
    supabase
      .from('turnos')
      .select('total_vendas')
      .eq('bar_id', barId)
      .gte('aberto_em', inicioMesAtual)
      .lte('aberto_em', fimMesAtual)
      .returns<{ total_vendas: number }[]>(),
    supabase
      .from('turnos')
      .select('total_vendas')
      .eq('bar_id', barId)
      .gte('aberto_em', inicioMesAnterior)
      .lte('aberto_em', fimMesAnterior)
      .returns<{ total_vendas: number }[]>(),
  ])

  const faturamentoAtual = (mesAtualResult.data ?? []).reduce((sum, t) => sum + (t.total_vendas ?? 0), 0)
  const faturamentoAnterior = (mesAnteriorResult.data ?? []).reduce((sum, t) => sum + (t.total_vendas ?? 0), 0)

  // Meta: usa valor configurado pelo dono; fallback = mês anterior + 10%
  const meta = metaMensalConfigurada
    ?? (faturamentoAnterior > 0 ? faturamentoAnterior * 1.1 : 5000)
  const progresso = meta > 0 ? Math.min((faturamentoAtual / meta) * 100, 100) : 0
  const falta = Math.max(meta - faturamentoAtual, 0)

  return { faturamentoAtual, meta, progresso, falta, faturamentoAnterior }
}

export interface UltimoTurnoResumo {
  id: string;
  abertoEm: string;
  fechadoEm: string;
  faturamento: number;
  ticketMedio: number;
  cmv: number | null;
  topDrink: string | null;
  totalComandas: number;
}

export async function getUltimoTurnoFechado(barId: string): Promise<UltimoTurnoResumo | null> {
  const supabase = await createClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id, aberto_em, fechado_em, total_vendas, total_comandas")
    .eq("bar_id", barId)
    .eq("status", "fechado")
    .order("fechado_em", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; aberto_em: string; fechado_em: string; total_vendas: number; total_comandas: number }>();

  if (!turno) return null;

  const { data: items } = await supabase
    .from("comanda_items")
    .select("quantidade, preco_total, produto_id, produtos(nome, preco, custo), comandas!inner(turno_id)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .eq("comandas.turno_id", turno.id)
    .returns<Array<{
      quantidade: number;
      preco_total: number;
      produto_id: string;
      produtos: { nome: string; preco: number; custo: number | null } | null;
      comandas: { turno_id: string } | null;
    }>>();

  // Agrega por produto
  const porProduto = new Map<string, { nome: string; qtd: number; faturamento: number; preco: number; custo: number | null }>();
  for (const item of items ?? []) {
    if (!item.produtos) continue;
    const atual = porProduto.get(item.produto_id) ?? {
      nome: item.produtos.nome, qtd: 0, faturamento: 0,
      preco: item.produtos.preco, custo: item.produtos.custo,
    };
    atual.qtd += Number(item.quantidade);
    atual.faturamento += Number(item.preco_total);
    porProduto.set(item.produto_id, atual);
  }

  const lista = [...porProduto.values()];
  const topDrink = lista.sort((a, b) => b.qtd - a.qtd)[0]?.nome ?? null;

  // CMV: só produtos com custo cadastrado
  const comCusto = lista.filter(p => p.custo !== null);
  let cmv: number | null = null;
  if (comCusto.length > 0) {
    const totalCusto = comCusto.reduce((s, p) => s + (p.custo! * p.qtd), 0);
    const receitaComCusto = comCusto.reduce((s, p) => s + p.faturamento, 0);
    if (receitaComCusto > 0) cmv = Math.round((totalCusto / receitaComCusto) * 100);
  }

  return {
    id: turno.id,
    abertoEm: turno.aberto_em,
    fechadoEm: turno.fechado_em,
    faturamento: Number(turno.total_vendas),
    ticketMedio: turno.total_comandas > 0 ? Number(turno.total_vendas) / turno.total_comandas : 0,
    cmv,
    topDrink,
    totalComandas: turno.total_comandas,
  };
}

export interface PrimeirosPassosData {
  nProdutos: number;
  nProdutosComCusto: number;  // produtos ativos com custo_status != 'sem' (margem real — Princípio 10)
  nInsumosComCusto: number;   // insumos com custo > 0 (NF-e importada) — o passo de custo
  nMesas: number;
  nEquipe: number;    // membros ativos excluindo o próprio dono
  nTurnos: number;    // total de turnos já abertos (0 = bar novo)
}

export async function getPrimeirosPassos(barId: string, userId: string): Promise<PrimeirosPassosData> {
  const supabase = await createClient();

  const [produtos, produtosComCusto, insumosComCusto, mesas, equipe, turnos] = await Promise.all([
    supabase.from("produtos").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true),
    supabase.from("produtos").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true).neq("custo_status", "sem"),
    supabase.from("ingredientes").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true).gt("custo_atual", 0),
    supabase.from("mesas").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true),
    supabase.from("bar_members").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true).neq("user_id", userId),
    supabase.from("turnos").select("id", { count: "exact", head: true }).eq("bar_id", barId),
  ]);

  return {
    nProdutos:        produtos.count        ?? 0,
    nProdutosComCusto: produtosComCusto.count ?? 0,
    nInsumosComCusto: insumosComCusto.count  ?? 0,
    nMesas:           mesas.count           ?? 0,
    nEquipe:          equipe.count          ?? 0,
    nTurnos:          turnos.count          ?? 0,
  };
}

// ── Histórico de turnos para sparklines ────────────────────────────────────

export interface HistoricoTurnos {
  faturamento: number[];
  ticketMedio: number[];
}

/**
 * Retorna os últimos N turnos fechados (do mais antigo ao mais recente)
 * para exibir sparklines nos KPI cards do LiveBar.
 */
export async function getHistoricoTurnos(barId: string, limit = 7): Promise<HistoricoTurnos | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("turnos")
    .select("total_vendas, total_comandas")
    .eq("bar_id", barId)
    .eq("status", "fechado")
    .order("fechado_em", { ascending: false })
    .limit(limit)
    .returns<{ total_vendas: number; total_comandas: number }[]>();

  if (!data || data.length < 2) return null;

  const reversed = [...data].reverse(); // mais antigo → mais recente (esquerda → direita)
  return {
    faturamento: reversed.map(t => Number(t.total_vendas)),
    ticketMedio: reversed.map(t =>
      Number(t.total_comandas) > 0
        ? Number(t.total_vendas) / Number(t.total_comandas)
        : 0
    ),
  };
}
