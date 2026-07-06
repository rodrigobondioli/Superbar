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

export async function getCurrentBar(): Promise<CurrentBar | null> {
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
}

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

export async function getAlertasEstoque(barId: string): Promise<AlertaEstoque[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estoque")
    .select("quantidade_atual, quantidade_minima, produtos(nome)")
    .eq("bar_id", barId)
    .eq("abaixo_minimo", true)  // filtrado no banco via coluna gerada + índice parcial
    .returns<{ quantidade_atual: number; quantidade_minima: number; produtos: { nome: string } | null }[]>();

  if (!data) return [];

  return data.map((row) => ({
    produtoNome: row.produtos?.nome ?? "Produto",
    quantidadeAtual: row.quantidade_atual,
    quantidadeMinima: row.quantidade_minima,
  }));
}

export interface TopDrink {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  faturamento: number;
  preco: number;
  custo: number | null;
  custoStatus: CustoStatus;
}

// Lista completa, sem limite — quem só precisa exibir um "top N" (a tabela
// de Top Drinks) corta a lista; cálculos agregados como CMV precisam de
// todos os produtos vendidos no turno, senão o número fica errado.
export async function getProdutosVendidosTurno(barId: string, turnoId: string): Promise<TopDrink[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comanda_items")
    .select("quantidade, preco_total, produto_id, produtos(nome, preco, custo, custo_status), comandas!inner(turno_id)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .eq("comandas.turno_id", turnoId)
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
  alertasAtuaisCount: number,
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

  let alertasEstoque: number | null = null;
  if (turnoAnterior.fechado_em) {
    const [{ data: estoqueAtual }, { data: movimentos }] = await Promise.all([
      supabase
        .from("estoque")
        .select("produto_id, quantidade_atual, quantidade_minima")
        .eq("bar_id", barId)
        .returns<{ produto_id: string; quantidade_atual: number; quantidade_minima: number }[]>(),
      supabase
        .from("estoque_movimentos")
        .select("produto_id, quantidade")
        .eq("bar_id", barId)
        .gt("criado_em", turnoAnterior.fechado_em)
        .returns<{ produto_id: string; quantidade: number }[]>(),
    ]);

    const consumidoDesdeOFechamento = new Map<string, number>();
    for (const movimento of movimentos ?? []) {
      consumidoDesdeOFechamento.set(
        movimento.produto_id,
        (consumidoDesdeOFechamento.get(movimento.produto_id) ?? 0) + Number(movimento.quantidade)
      );
    }

    const alertasNoFechamentoAnterior = (estoqueAtual ?? []).filter((item) => {
      const quantidadeNaEpoca =
        item.quantidade_atual - (consumidoDesdeOFechamento.get(item.produto_id) ?? 0);
      return quantidadeNaEpoca < item.quantidade_minima;
    }).length;

    alertasEstoque = percentChange(alertasAtuaisCount, alertasNoFechamentoAnterior);
  }

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
  nMesas: number;
  nEquipe: number;    // membros ativos excluindo o próprio dono
  nTurnos: number;    // total de turnos já abertos (0 = bar novo)
}

export async function getPrimeirosPassos(barId: string, userId: string): Promise<PrimeirosPassosData> {
  const supabase = await createClient();

  const [produtos, mesas, equipe, turnos] = await Promise.all([
    supabase.from("produtos").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true),
    supabase.from("mesas").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true),
    supabase.from("bar_members").select("id", { count: "exact", head: true }).eq("bar_id", barId).eq("ativo", true).neq("user_id", userId),
    supabase.from("turnos").select("id", { count: "exact", head: true }).eq("bar_id", barId),
  ]);

  return {
    nProdutos: produtos.count ?? 0,
    nMesas:    mesas.count    ?? 0,
    nEquipe:   equipe.count   ?? 0,
    nTurnos:   turnos.count   ?? 0,
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
