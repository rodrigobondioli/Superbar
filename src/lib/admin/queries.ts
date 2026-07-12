/**
 * Queries do painel admin da plataforma SUPERBAR.
 * Usa createAdminClient() (service role) — bypassa RLS.
 * Nunca expor ao cliente.
 */

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AssinaturaStatus } from "@/types/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RiskLevel  = "red" | "yellow" | "ok";
export type HealthScore = "green" | "yellow" | "red";
export type ImplantacaoScore = "completo" | "parcial" | "abandonado";

export interface RiskAlert {
  level: RiskLevel;
  label: string;
}

export interface BarResumo {
  id: string;
  nome: string;
  slug: string;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  // Plano e cobrança
  plano_nome: string | null;
  plano_preco: number | null;
  assinatura_status: AssinaturaStatus | null;
  // Atividade
  ultimo_turno_em: string | null;
  dias_sem_uso: number | null;
  // Últimos 7 dias
  turnos_7d: number;
  comandas_7d: number;
  faturamento_7d: number;
  // Totais
  total_turnos: number;
  total_membros: number;
  total_produtos: number;
  cobertura_custo_pct: number; // 0-100 (% de produtos com custo cadastrado)
  // CMV real (calculado via comanda_items × produtos.custo)
  cmv_custo_total: number;          // soma dos custos reais dos itens vendidos
  cmv_receita_total: number;        // receita dos itens que têm custo cadastrado
  cmv_receita_all: number;          // receita total de todos os itens não cancelados
  cmv_pct: number | null;           // cmv_custo_total / cmv_receita_total × 100 (null se sem dado)
  cmv_cobertura_receita_pct: number; // cmv_receita_total / cmv_receita_all × 100
  // Faturamento real (pagamentos confirmados)
  faturamento_total: number;        // histórico completo
  faturamento_30d: number;          // últimos 30 dias
  faturamento_mes_atual: number;    // mês corrente (1º ao hoje)
  faturamento_mes_anterior: number; // mês anterior completo
  // Ticket médio (faturamento / count pagamentos)
  ticket_medio_total: number | null;  // histórico (null se sem pagamentos)
  ticket_medio_30d: number | null;    // últimos 30 dias
  ticket_count_total: number;
  ticket_count_30d: number;
  // Crescimento mês atual vs mês anterior
  crescimento_fat_mes_pct: number | null; // null se mês anterior = 0
  // Margem estimada (= 100 - cmv_pct), confiável quando cobertura >= 60%
  margem_pct: number | null;
  margem_confiavel: boolean; // true quando cmv_cobertura_receita_pct >= 60
  // Scores
  healthScore: HealthScore;
  healthScoreNumerico: number; // 0-100
  implantacaoScore: ImplantacaoScore;
  alertas: RiskAlert[];
}

export interface AdminStats {
  total_bares: number;
  mrr: number;
  // Saúde
  bares_saudaveis: number;
  bares_atencao: number;
  bares_risco: number;
  // Implantação
  implantacao_completo: number;
  implantacao_parcial: number;
  implantacao_abandonado: number;
  // Outros
  bares_sem_uso_7d: number;
  bares_inadimplentes: number;
  // CMV plataforma
  cmv_plataforma_custo: number;
  cmv_plataforma_receita: number;
  cmv_plataforma_pct: number | null;
  // Faturamento plataforma (todos os bares, pagamentos confirmados)
  faturamento_plataforma_total: number;
  faturamento_plataforma_mes_atual: number;
  faturamento_plataforma_mes_anterior: number;
  faturamento_plataforma_crescimento_pct: number | null; // null se mês anterior = 0
  // Ticket médio plataforma
  ticket_medio_plataforma_total: number | null;
  ticket_medio_plataforma_30d: number | null;
  // Margem média ponderada da plataforma
  margem_plataforma_pct: number | null;
}

export interface BarDetalhe {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  configuracoes: Record<string, unknown>;
  // Plano e cobrança
  plano_id: string | null;
  plano_nome: string | null;
  plano_preco: number | null;
  assinatura_id: string | null;
  assinatura_status: AssinaturaStatus | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  // Atividade
  ultimo_turno_em: string | null;
  dias_sem_uso: number | null;
  // 7d
  turnos_7d: number;
  comandas_7d: number;
  faturamento_7d: number;
  // Operação total
  total_turnos: number;
  total_comandas: number;
  total_pagamentos: number;
  total_produtos: number;
  total_produtos_com_custo: number;
  cobertura_custo_pct: number;
  // Scores
  healthScore: HealthScore;
  healthScoreNumerico: number; // 0-100
  implantacaoScore: ImplantacaoScore;
  alertas: RiskAlert[];
  // Equipe
  membros: {
    id: string;
    nome: string | null;
    role: string;
    ativo: boolean;
    created_at: string;
  }[];
}

// ─── Score numérico 0-100 ─────────────────────────────────────────────────────
// Uso (40pts) + Implantação (30pts) + Cobrança (30pts)

function computeScoreNumerico({
  assinatura_status,
  dias_sem_uso,
  total_turnos,
  cobertura_custo_pct,
  total_membros,
}: {
  assinatura_status: AssinaturaStatus | null;
  dias_sem_uso: number | null;
  total_turnos: number;
  cobertura_custo_pct: number;
  total_membros: number;
}): number {
  let score = 0;

  // Uso (40pts)
  if (total_turnos > 0 && dias_sem_uso !== null) {
    if (dias_sem_uso === 0)       score += 40;
    else if (dias_sem_uso < 3)   score += 28;
    else if (dias_sem_uso < 7)   score += 12;
    // ≥7d: 0pts
  }

  // Implantação (30pts): custo 0-20pts + membros 0-10pts
  score += Math.round(cobertura_custo_pct * 0.2); // 0-20
  if (total_membros >= 2)       score += 10;
  else if (total_membros === 1) score += 5;

  // Cobrança (30pts)
  if (assinatura_status === "ativa") {
    score += 30;
  }

  return Math.min(100, score);
}

// ─── Score de saúde ───────────────────────────────────────────────────────────
// 🔴 Risco:    inadimplente | cancelada | sem uso ≥ 7d
// 🟡 Atenção:  custo < 60% | sem uso 3–6d
// 🟢 Saudável: tudo certo

function computeHealth({
  assinatura_status,
  dias_sem_uso,
  total_turnos,
  cobertura_custo_pct,
  ativo,
}: {
  assinatura_status: AssinaturaStatus | null;
  dias_sem_uso: number | null;
  total_turnos: number;
  cobertura_custo_pct: number;
  ativo: boolean;
}): HealthScore {
  if (!ativo) return "red";
  if (assinatura_status === "inadimplente" || assinatura_status === "cancelada") return "red";

  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 7) return "red";

  // Yellow
  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 3) return "yellow";
  if (cobertura_custo_pct < 60 && total_turnos > 0) return "yellow";

  return "green";
}

// ─── Score de implantação ─────────────────────────────────────────────────────
// Completo:   ≥3 turnos + custo ≥60% + ≥2 membros
// Parcial:    algum uso mas incompleto
// Abandonado: 0 turnos

function computeImplantacao({
  total_turnos,
  cobertura_custo_pct,
  total_membros,
}: {
  total_turnos: number;
  cobertura_custo_pct: number;
  total_membros: number;
}): ImplantacaoScore {
  if (total_turnos === 0) return "abandonado";
  if (total_turnos >= 3 && cobertura_custo_pct >= 60 && total_membros >= 2) return "completo";
  return "parcial";
}

// ─── Alertas detalhados ───────────────────────────────────────────────────────

function computeAlertas({
  assinatura_status,
  dias_sem_uso,
  total_turnos,
  cobertura_custo_pct,
  ativo,
}: {
  assinatura_status: AssinaturaStatus | null;
  dias_sem_uso: number | null;
  total_turnos: number;
  cobertura_custo_pct: number;
  ativo: boolean;
}): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  if (!ativo) { alerts.push({ level: "red", label: "Bar inativo" }); return alerts; }
  if (assinatura_status === "inadimplente") alerts.push({ level: "red", label: "Inadimplente" });
  if (assinatura_status === "cancelada") alerts.push({ level: "red", label: "Cancelada" });

  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 7)
    alerts.push({ level: "red", label: `${dias_sem_uso}d sem uso` });
  else if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 3)
    alerts.push({ level: "yellow", label: `${dias_sem_uso}d sem uso` });

  if (cobertura_custo_pct < 60 && total_turnos > 0)
    alerts.push({ level: "yellow", label: `Custo ${cobertura_custo_pct}%` });

  return alerts;
}

// ─── Lista de bares + stats globais ──────────────────────────────────────────
// cache(): dedupe por request — o layout (badge de alerta) e a página chamam
// getAdminBares no mesmo request; sem isso a query pesada rodaria 2x.

async function getAdminBaresImpl(): Promise<{
  bares: BarResumo[];
  stats: AdminStats;
}> {
  const admin = createAdminClient();
  const now   = new Date();
  const ago7d  = new Date(Date.now() - 7 * 86400000).toISOString();
  const ago30d = new Date(Date.now() - 30 * 86400000).toISOString();
  // Limites de mês
  const mesAtualInicio    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const { data: bares } = await admin
    .from("bars")
    .select("id, nome, slug, endereco, ativo, created_at")
    .order("created_at", { ascending: false });

  if (!bares?.length) {
    return {
      bares: [],
      stats: {
        total_bares: 0, mrr: 0,
        bares_saudaveis: 0, bares_atencao: 0, bares_risco: 0,
        implantacao_completo: 0, implantacao_parcial: 0, implantacao_abandonado: 0,
        bares_sem_uso_7d: 0, bares_inadimplentes: 0,
        cmv_plataforma_custo: 0, cmv_plataforma_receita: 0, cmv_plataforma_pct: null,
        faturamento_plataforma_total: 0, faturamento_plataforma_mes_atual: 0,
        faturamento_plataforma_mes_anterior: 0, faturamento_plataforma_crescimento_pct: null,
        ticket_medio_plataforma_total: null, ticket_medio_plataforma_30d: null,
        margem_plataforma_pct: null,
      },
    };
  }

  const barIds = bares.map((b) => b.id);

  const [
    { data: assinaturas },
    { data: turnos },
    { data: membros },
    { data: produtos },
    { data: pagamentos7d },
    { data: comandas7d },
    { data: cmvItems },
    { data: pagamentosTodos },
  ] = await Promise.all([
    admin.from("assinaturas")
      .select("bar_id, status, planos(nome, preco_mensal)")
      .in("bar_id", barIds),
    admin.from("turnos")
      .select("id, bar_id, aberto_em")
      .in("bar_id", barIds)
      .order("aberto_em", { ascending: false }),
    admin.from("bar_members")
      .select("bar_id, id")
      .in("bar_id", barIds)
      .eq("ativo", true),
    admin.from("produtos")
      .select("bar_id, custo")
      .in("bar_id", barIds)
      .eq("ativo", true),
    admin.from("pagamentos")
      .select("bar_id, valor, taxa_servico_valor")
      .in("bar_id", barIds)
      .eq("status", "confirmado")
      .gte("processado_em", ago7d),
    admin.from("comandas")
      .select("bar_id, id")
      .in("bar_id", barIds)
      .gte("criado_em", ago7d),
    // CMV real: itens vendidos × custo do produto. JANELA: só desde o início do
    // mês anterior — o CMV exibido é dos ~2 meses correntes, não da história toda.
    // Sem isso, esta query carregava TODOS os comanda_items da plataforma em
    // memória (não escala; arrasta já com dezenas de bares com meses de dado).
    admin.from("comanda_items")
      .select("bar_id, quantidade, preco_total, produtos(custo)")
      .in("bar_id", barIds)
      .neq("status", "cancelado")
      .gte("adicionado_em", mesAnteriorInicio),
    // Pagamentos confirmados dos ~2 meses correntes (mês atual + anterior) — que
    // é o único recorte de faturamento que a UI exibe. JANELA pelo mesmo motivo
    // acima: antes lia todos os pagamentos confirmados da plataforma inteira.
    admin.from("pagamentos")
      .select("bar_id, valor, taxa_servico_valor, processado_em")
      .in("bar_id", barIds)
      .eq("status", "confirmado")
      .gte("processado_em", mesAnteriorInicio),
  ]);

  // ── Indexar por bar ──────────────────────────────────────────────────────

  type AssRow = { bar_id: string; status: AssinaturaStatus; planos: { nome: string; preco_mensal: number } | null };
  const assPorBar = new Map(((assinaturas as AssRow[] | null) ?? []).map((a) => [a.bar_id, a]));

  const turnosMap = new Map<string, { ultimo: string | null; total: number; total7d: number }>();
  for (const t of turnos ?? []) {
    const cur = turnosMap.get(t.bar_id);
    const is7d = new Date(t.aberto_em) >= new Date(ago7d);
    if (!cur) turnosMap.set(t.bar_id, { ultimo: t.aberto_em, total: 1, total7d: is7d ? 1 : 0 });
    else turnosMap.set(t.bar_id, { ultimo: cur.ultimo, total: cur.total + 1, total7d: cur.total7d + (is7d ? 1 : 0) });
  }

  const membrosPorBar = new Map<string, number>();
  for (const m of membros ?? []) membrosPorBar.set(m.bar_id, (membrosPorBar.get(m.bar_id) ?? 0) + 1);

  const produtosMap = new Map<string, { total: number; comCusto: number }>();
  for (const p of produtos ?? []) {
    const cur = produtosMap.get(p.bar_id) ?? { total: 0, comCusto: 0 };
    produtosMap.set(p.bar_id, { total: cur.total + 1, comCusto: cur.comCusto + (p.custo !== null && Number(p.custo) > 0 ? 1 : 0) });
  }

  const fat7dMap = new Map<string, number>();
  for (const p of pagamentos7d ?? []) {
    fat7dMap.set(p.bar_id, (fat7dMap.get(p.bar_id) ?? 0) + Number(p.valor) + Number(p.taxa_servico_valor ?? 0));
  }

  const cmd7dMap = new Map<string, number>();
  for (const c of comandas7d ?? []) cmd7dMap.set(c.bar_id, (cmd7dMap.get(c.bar_id) ?? 0) + 1);

  // ── CMV por bar ───────────────────────────────────────────────────────────
  // custo_total = Σ(quantidade × produto.custo) apenas onde produto.custo > 0
  // receita_com_custo = Σ(preco_total) desses mesmos itens
  // receita_all = Σ(preco_total) de todos os itens não cancelados

  type CmvRow = { bar_id: string; quantidade: number; preco_total: number; produtos: { custo: number | null } | null };
  interface CmvAgg { custo: number; receita_com_custo: number; receita_all: number }

  const cmvMap = new Map<string, CmvAgg>();
  for (const row of (cmvItems as CmvRow[] | null) ?? []) {
    const cur = cmvMap.get(row.bar_id) ?? { custo: 0, receita_com_custo: 0, receita_all: 0 };
    const receitaItem = Number(row.preco_total ?? 0);
    cur.receita_all += receitaItem;
    const custo = row.produtos?.custo != null ? Number(row.produtos.custo) : null;
    if (custo !== null && custo > 0) {
      cur.custo += custo * Number(row.quantidade ?? 1);
      cur.receita_com_custo += receitaItem;
    }
    cmvMap.set(row.bar_id, cur);
  }

  // ── Faturamento e ticket médio por bar ───────────────────────────────────
  // Calculado sobre pagamentos confirmados (valor + taxa_servico_valor)

  type PagRow = { bar_id: string; valor: number; taxa_servico_valor: number | null; processado_em: string };
  interface FatAgg {
    total: number;          // histórico completo
    total_count: number;    // nº pagamentos total
    mes30d: number;         // últimos 30 dias
    mes30d_count: number;
    mes_atual: number;      // mês corrente
    mes_atual_count: number;
    mes_anterior: number;   // mês anterior completo
    mes_anterior_count: number;
  }

  const fatMap = new Map<string, FatAgg>();
  for (const p of (pagamentosTodos as PagRow[] | null) ?? []) {
    const cur = fatMap.get(p.bar_id) ?? {
      total: 0, total_count: 0,
      mes30d: 0, mes30d_count: 0,
      mes_atual: 0, mes_atual_count: 0,
      mes_anterior: 0, mes_anterior_count: 0,
    };
    const val = Number(p.valor ?? 0) + Number(p.taxa_servico_valor ?? 0);
    const dt  = p.processado_em;

    cur.total += val;
    cur.total_count++;
    if (dt >= ago30d)                               { cur.mes30d += val; cur.mes30d_count++; }
    if (dt >= mesAtualInicio)                       { cur.mes_atual += val; cur.mes_atual_count++; }
    if (dt >= mesAnteriorInicio && dt < mesAtualInicio) { cur.mes_anterior += val; cur.mes_anterior_count++; }

    fatMap.set(p.bar_id, cur);
  }

  // ── Montar lista ──────────────────────────────────────────────────────────

  const result: BarResumo[] = bares.map((b) => {
    const end     = b.endereco as { cidade?: string; estado?: string } | null;
    const ass     = assPorBar.get(b.id);
    const t       = turnosMap.get(b.id);
    const prod    = produtosMap.get(b.id) ?? { total: 0, comCusto: 0 };
    const membros = membrosPorBar.get(b.id) ?? 0;
    const plano   = ass?.planos as { nome: string; preco_mensal: number } | null | undefined;

    const ultimoTurno  = t?.ultimo ?? null;
    const diasSemUso   = ultimoTurno ? Math.floor((Date.now() - new Date(ultimoTurno).getTime()) / 86400000) : null;
    const coberturaPct = prod.total > 0 ? Math.round((prod.comCusto / prod.total) * 100) : 0;
    const totalTurnos  = t?.total ?? 0;

    const scoreArgs = { assinatura_status: ass?.status ?? null, dias_sem_uso: diasSemUso, total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, ativo: b.ativo };
    const healthScore         = computeHealth(scoreArgs);
    const healthScoreNumerico = computeScoreNumerico({ ...scoreArgs, total_membros: membros });
    const implantacaoScore    = computeImplantacao({ total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, total_membros: membros });
    const alertas             = computeAlertas(scoreArgs);

    const cmv = cmvMap.get(b.id) ?? { custo: 0, receita_com_custo: 0, receita_all: 0 };
    const cmv_pct = cmv.receita_com_custo > 0
      ? Math.round((cmv.custo / cmv.receita_com_custo) * 1000) / 10
      : null;
    const cmv_cobertura_receita_pct = cmv.receita_all > 0
      ? Math.round((cmv.receita_com_custo / cmv.receita_all) * 100)
      : 0;

    const fat = fatMap.get(b.id) ?? {
      total: 0, total_count: 0,
      mes30d: 0, mes30d_count: 0,
      mes_atual: 0, mes_atual_count: 0,
      mes_anterior: 0, mes_anterior_count: 0,
    };

    const ticket_medio_total = fat.total_count > 0 ? Math.round(fat.total / fat.total_count) : null;
    const ticket_medio_30d   = fat.mes30d_count > 0 ? Math.round(fat.mes30d / fat.mes30d_count) : null;
    const crescimento_fat_mes_pct = fat.mes_anterior > 0
      ? Math.round(((fat.mes_atual - fat.mes_anterior) / fat.mes_anterior) * 1000) / 10
      : null;

    const margem_pct       = cmv_pct !== null ? Math.round((100 - cmv_pct) * 10) / 10 : null;
    const margem_confiavel = cmv_cobertura_receita_pct >= 60;

    return {
      id: b.id, nome: b.nome, slug: b.slug,
      cidade: end?.cidade ?? null, estado: end?.estado ?? null,
      ativo: b.ativo, created_at: b.created_at,
      plano_nome: plano?.nome ?? null, plano_preco: plano?.preco_mensal ?? null,
      assinatura_status: ass?.status ?? null,
      ultimo_turno_em: ultimoTurno, dias_sem_uso: diasSemUso,
      turnos_7d: t?.total7d ?? 0, comandas_7d: cmd7dMap.get(b.id) ?? 0, faturamento_7d: fat7dMap.get(b.id) ?? 0,
      total_turnos: totalTurnos, total_membros: membros,
      total_produtos: prod.total, cobertura_custo_pct: coberturaPct,
      cmv_custo_total: cmv.custo,
      cmv_receita_total: cmv.receita_com_custo,
      cmv_receita_all: cmv.receita_all,
      cmv_pct,
      cmv_cobertura_receita_pct,
      faturamento_total: fat.total,
      faturamento_30d: fat.mes30d,
      faturamento_mes_atual: fat.mes_atual,
      faturamento_mes_anterior: fat.mes_anterior,
      ticket_medio_total,
      ticket_medio_30d,
      ticket_count_total: fat.total_count,
      ticket_count_30d: fat.mes30d_count,
      crescimento_fat_mes_pct,
      margem_pct,
      margem_confiavel,
      healthScore, healthScoreNumerico, implantacaoScore, alertas,
    };
  });

  // ── Stats globais ─────────────────────────────────────────────────────────

  const mrr = result.reduce((acc, b) => acc + (b.assinatura_status === "ativa" && b.plano_preco ? b.plano_preco : 0), 0);

  const cmvPlataformaCusto   = result.reduce((acc, b) => acc + b.cmv_custo_total, 0);
  const cmvPlataformaReceita = result.reduce((acc, b) => acc + b.cmv_receita_total, 0);
  const cmvPlataformaPct     = cmvPlataformaReceita > 0
    ? Math.round((cmvPlataformaCusto / cmvPlataformaReceita) * 1000) / 10
    : null;

  // Faturamento plataforma (somar sobre todos os bares)
  const fatTotalGlobal      = result.reduce((a, b) => a + b.faturamento_total, 0);
  const fatMesAtualGlobal   = result.reduce((a, b) => a + b.faturamento_mes_atual, 0);
  const fatMesAnteriorGlobal = result.reduce((a, b) => a + b.faturamento_mes_anterior, 0);
  const fatCrescimentoPct   = fatMesAnteriorGlobal > 0
    ? Math.round(((fatMesAtualGlobal - fatMesAnteriorGlobal) / fatMesAnteriorGlobal) * 1000) / 10
    : null;

  // Ticket médio plataforma
  const ticketCountTotalGlobal = result.reduce((a, b) => a + b.ticket_count_total, 0);
  const ticketCount30dGlobal   = result.reduce((a, b) => a + b.ticket_count_30d, 0);
  const fat30dGlobal           = result.reduce((a, b) => a + b.faturamento_30d, 0);
  const ticketMedioTotal = ticketCountTotalGlobal > 0 ? Math.round(fatTotalGlobal / ticketCountTotalGlobal) : null;
  const ticketMedio30d   = ticketCount30dGlobal   > 0 ? Math.round(fat30dGlobal   / ticketCount30dGlobal)   : null;

  // Margem média ponderada da plataforma (apenas bares com cobertura >= 60%)
  const baresComMargem = result.filter((b) => b.margem_pct !== null && b.margem_confiavel);
  const margemPlatPct = baresComMargem.length > 0
    ? Math.round(baresComMargem.reduce((a, b) => a + b.margem_pct!, 0) / baresComMargem.length * 10) / 10
    : null;

  return {
    bares: result,
    stats: {
      total_bares:             result.length,
      mrr,
      bares_saudaveis:         result.filter((b) => b.healthScore === "green").length,
      bares_atencao:           result.filter((b) => b.healthScore === "yellow").length,
      bares_risco:             result.filter((b) => b.healthScore === "red").length,
      implantacao_completo:    result.filter((b) => b.implantacaoScore === "completo").length,
      implantacao_parcial:     result.filter((b) => b.implantacaoScore === "parcial").length,
      implantacao_abandonado:  result.filter((b) => b.implantacaoScore === "abandonado").length,
      bares_sem_uso_7d:        result.filter((b) => b.ativo && (b.dias_sem_uso === null || b.dias_sem_uso >= 7)).length,
      bares_inadimplentes:     result.filter((b) => b.assinatura_status === "inadimplente").length,
      cmv_plataforma_custo:    cmvPlataformaCusto,
      cmv_plataforma_receita:  cmvPlataformaReceita,
      cmv_plataforma_pct:      cmvPlataformaPct,
      faturamento_plataforma_total:          fatTotalGlobal,
      faturamento_plataforma_mes_atual:      fatMesAtualGlobal,
      faturamento_plataforma_mes_anterior:   fatMesAnteriorGlobal,
      faturamento_plataforma_crescimento_pct: fatCrescimentoPct,
      ticket_medio_plataforma_total:         ticketMedioTotal,
      ticket_medio_plataforma_30d:           ticketMedio30d,
      margem_plataforma_pct:                 margemPlatPct,
    },
  };
}

export const getAdminBares = cache(getAdminBaresImpl);

// ─── Detalhe de um bar ────────────────────────────────────────────────────────

export async function getAdminBarDetalhe(barId: string): Promise<BarDetalhe | null> {
  const admin = createAdminClient();
  const ago7d = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    { data: bar },
    { data: ass },
    { data: membros },
    { data: turnos },
    { data: produtos },
    { data: comandas },
    { data: pagamentos },
    { data: turnos7d },
    { data: pagamentos7d },
    { data: comandas7d },
  ] = await Promise.all([
    admin.from("bars").select("*").eq("id", barId).single(),
    admin.from("assinaturas").select("id, status, periodo_inicio, periodo_fim, plano_id, planos(nome, preco_mensal)").eq("bar_id", barId).maybeSingle(),
    admin.from("bar_members").select("id, nome, role, ativo, created_at").eq("bar_id", barId).order("created_at"),
    admin.from("turnos").select("id, aberto_em").eq("bar_id", barId).order("aberto_em", { ascending: false }),
    admin.from("produtos").select("id, custo").eq("bar_id", barId).eq("ativo", true),
    admin.from("comandas").select("id").eq("bar_id", barId),
    admin.from("pagamentos").select("id").eq("bar_id", barId).eq("status", "confirmado"),
    admin.from("turnos").select("id").eq("bar_id", barId).gte("aberto_em", ago7d),
    admin.from("pagamentos").select("valor, taxa_servico_valor").eq("bar_id", barId).eq("status", "confirmado").gte("processado_em", ago7d),
    admin.from("comandas").select("id").eq("bar_id", barId).gte("criado_em", ago7d),
  ]);

  if (!bar) return null;

  const end          = bar.endereco as { cidade?: string; estado?: string } | null;
  const totalTurnos  = turnos?.length ?? 0;
  const ultimoTurno  = totalTurnos ? (turnos![0].aberto_em as string) : null;
  const diasSemUso   = ultimoTurno ? Math.floor((Date.now() - new Date(ultimoTurno).getTime()) / 86400000) : null;
  const totalProd    = produtos?.length ?? 0;
  const comCusto     = (produtos ?? []).filter((p) => p.custo !== null && Number(p.custo) > 0).length;
  const coberturaPct = totalProd > 0 ? Math.round((comCusto / totalProd) * 100) : 0;
  const fat7d        = (pagamentos7d ?? []).reduce((acc, p) => acc + Number(p.valor) + Number(p.taxa_servico_valor ?? 0), 0);
  const memAtivos    = (membros ?? []).filter((m) => m.ativo).length;

  type AssRow = { id: string; status: AssinaturaStatus; periodo_inicio: string | null; periodo_fim: string | null; plano_id: string; planos: { nome: string; preco_mensal: number } | null };
  const assTyped  = ass as AssRow | null;
  const planoData = assTyped?.planos as { nome: string; preco_mensal: number } | null | undefined;

  const detailScoreArgs = { assinatura_status: assTyped?.status ?? null, dias_sem_uso: diasSemUso, total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, ativo: bar.ativo };
  const healthScore         = computeHealth(detailScoreArgs);
  const healthScoreNumerico = computeScoreNumerico({ ...detailScoreArgs, total_membros: memAtivos });
  const implantacaoScore    = computeImplantacao({ total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, total_membros: memAtivos });
  const alertas             = computeAlertas(detailScoreArgs);

  return {
    id: bar.id, nome: bar.nome, slug: bar.slug,
    cnpj: bar.cnpj ?? null, telefone: bar.telefone ?? null,
    cidade: end?.cidade ?? null, estado: end?.estado ?? null,
    ativo: bar.ativo, created_at: bar.created_at,
    configuracoes: (bar.configuracoes ?? {}) as Record<string, unknown>,
    plano_id: assTyped?.plano_id ?? null,
    plano_nome: planoData?.nome ?? null, plano_preco: planoData?.preco_mensal ?? null,
    assinatura_id: assTyped?.id ?? null,
    assinatura_status: assTyped?.status ?? null,
    periodo_inicio: assTyped?.periodo_inicio ?? null, periodo_fim: assTyped?.periodo_fim ?? null,
    ultimo_turno_em: ultimoTurno, dias_sem_uso: diasSemUso,
    turnos_7d: turnos7d?.length ?? 0, comandas_7d: comandas7d?.length ?? 0, faturamento_7d: fat7d,
    total_turnos: totalTurnos, total_comandas: comandas?.length ?? 0, total_pagamentos: pagamentos?.length ?? 0,
    total_produtos: totalProd, total_produtos_com_custo: comCusto, cobertura_custo_pct: coberturaPct,
    healthScore, healthScoreNumerico, implantacaoScore, alertas,
    membros: (membros ?? []).map((m) => ({ id: m.id, nome: m.nome, role: m.role, ativo: m.ativo, created_at: m.created_at })),
  };
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  nome_bar: string;
  cidade: string;
  tipo_bar: string;
  whatsapp: string | null;
  instagram: string | null;
  site: string | null;
  nome_responsavel: string | null;
  email: string | null;
  status: string;
  notas: string | null;
  follow_up_at: string | null;
  origem: string | null;
  ordem: number | null;
  created_at: string;
}

export interface Stage {
  id: string;
  label: string;
  ordem: number;
}

const DEFAULT_STAGES: Stage[] = [
  { id: "novo", label: "Novo", ordem: 1 },
  { id: "contatado", label: "Contatado", ordem: 2 },
  { id: "demo", label: "Demo", ordem: 3 },
  { id: "convertido", label: "Convertido", ordem: 4 },
  { id: "perdido", label: "Perdido", ordem: 5 },
];

export async function getStages(): Promise<Stage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_stages")
    .select("id, label, ordem")
    .order("ordem", { ascending: true })
    .returns<Stage[]>();
  // Fallback caso a migration ainda não tenha rodado — o kanban nunca fica sem colunas.
  if (error || !data || data.length === 0) return DEFAULT_STAGES;
  return data;
}

export async function getLeads(): Promise<Lead[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, nome_bar, cidade, tipo_bar, whatsapp, instagram, site, nome_responsavel, email, status, notas, follow_up_at, origem, ordem, created_at")
    .order("ordem", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Lead[]>();
  if (error) return [];
  return data ?? [];
}

// ─── Evolução mensal por bar (prova de valor pra retenção/upsell) ──────────────
export interface EvolucaoMes {
  mes: string;          // "2026-03"
  label: string;        // "mar/26"
  faturamento: number;
  ticket: number | null;
  cmv: number | null;    // %
  margem: number | null; // %
}

/**
 * Série mensal de faturamento, ticket médio, CMV e margem de um bar.
 * Base da prova de valor: "seu ticket subiu X% desde que entrou no SUPERBAR".
 * Service role — só admin da plataforma.
 */
export async function getBarEvolucaoMensal(barId: string, meses = 6): Promise<EvolucaoMes[]> {
  const admin = createAdminClient();

  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (meses - 1));
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);

  const [{ data: pagamentos }, { data: itens }] = await Promise.all([
    admin.from("pagamentos")
      .select("valor, comanda_id, processado_em")
      .eq("bar_id", barId).eq("status", "confirmado")
      .gte("processado_em", inicio.toISOString())
      .returns<{ valor: number; comanda_id: string; processado_em: string }[]>(),
    admin.from("comanda_items")
      .select("quantidade, preco_total, adicionado_em, produtos(custo)")
      .eq("bar_id", barId).eq("status", "ativo")
      .gte("adicionado_em", inicio.toISOString())
      .returns<{ quantidade: number; preco_total: number; adicionado_em: string; produtos: { custo: number | null } | null }[]>(),
  ]);

  const mesKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

  type Bucket = { fat: number; comandas: Set<string>; custo: number; receitaComCusto: number };
  const buckets = new Map<string, Bucket>();
  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio); d.setMonth(inicio.getMonth() + i);
    buckets.set(mesKey(d.toISOString()), { fat: 0, comandas: new Set(), custo: 0, receitaComCusto: 0 });
  }

  for (const p of pagamentos ?? []) {
    const b = buckets.get(mesKey(p.processado_em)); if (!b) continue;
    b.fat += Number(p.valor); b.comandas.add(p.comanda_id);
  }
  for (const it of itens ?? []) {
    const b = buckets.get(mesKey(it.adicionado_em)); if (!b) continue;
    if (it.produtos?.custo != null) {
      b.custo += Number(it.produtos.custo) * Number(it.quantidade);
      b.receitaComCusto += Number(it.preco_total);
    }
  }

  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return [...buckets.entries()].map(([mes, b]) => {
    const [ano, m] = mes.split("-");
    const cmv = b.receitaComCusto > 0 ? Math.round((b.custo / b.receitaComCusto) * 100) : null;
    return {
      mes,
      label: `${nomes[Number(m) - 1]}/${ano.slice(2)}`,
      faturamento: Math.round(b.fat),
      ticket: b.comandas.size > 0 ? Math.round(b.fat / b.comandas.size) : null,
      cmv,
      margem: cmv !== null ? 100 - cmv : null,
    };
  });
}
