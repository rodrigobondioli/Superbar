/**
 * Inteligência operacional — P3.
 * Queries declarativas: padrões de pico, mesas, pagamento e preparo.
 * SQL puro, sem LLM.
 */

import { createClient } from "@/lib/supabase/server";
import type { PagamentoMetodo } from "@/types/database";

// ─── Horário de pico ──────────────────────────────────────────────────────────

export interface PontoPico {
  hora: number; // 0–23
  drinks: number;
}

/**
 * Agrupa comanda_items por hora do dia no turno atual.
 * Retorna todos os slots com pelo menos 1 drink (sem zeros).
 */
export async function getHorarioPico(
  barId: string,
  turnoId: string,
): Promise<PontoPico[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("comanda_items")
    .select("quantidade, adicionado_em")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "ativo")
    .returns<{ quantidade: number; adicionado_em: string }[]>();

  const porHora = new Map<number, number>();
  for (const item of data ?? []) {
    const hora = new Date(item.adicionado_em).getHours();
    porHora.set(hora, (porHora.get(hora) ?? 0) + Number(item.quantidade));
  }

  return [...porHora.entries()]
    .map(([hora, drinks]) => ({ hora, drinks }))
    .sort((a, b) => a.hora - b.hora);
}

/** Retorna a hora de maior volume e a quantidade de drinks nessa hora. */
export function calcularPico(pontos: PontoPico[]): { hora: number; drinks: number } | null {
  if (!pontos.length) return null;
  return pontos.reduce((max, p) => (p.drinks > max.drinks ? p : max));
}

// ─── Ranking de mesas ─────────────────────────────────────────────────────────

export interface MesaRanking {
  mesaId: string;
  mesaLabel: string;
  faturamento: number;
  comandas: number;
}

/**
 * Receita por mesa no turno, ordenada decrescente.
 * Mesas sem comanda ou com apenas pedidos de balcão são excluídas.
 */
export async function getRankingMesas(
  barId: string,
  turnoId: string,
): Promise<MesaRanking[]> {
  const supabase = await createClient();

  // comanda_items → comandas → mesas
  const { data } = await supabase
    .from("comanda_items")
    .select(`
      quantidade, preco_total,
      comandas!inner (
        id,
        mesa_id,
        mesas ( numero, nome )
      )
    `)
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "ativo")
    .returns<{
      quantidade: number;
      preco_total: number;
      comandas: {
        id: string;
        mesa_id: string | null;
        mesas: { numero: number; nome: string | null } | null;
      };
    }[]>();

  const porMesa = new Map<
    string,
    { label: string; faturamento: number; comandaIds: Set<string> }
  >();

  for (const item of data ?? []) {
    const comanda = item.comandas;
    if (!comanda.mesa_id || !comanda.mesas) continue;

    const mesaId = comanda.mesa_id;
    const label = comanda.mesas.nome ?? `Mesa ${comanda.mesas.numero}`;
    const entrada = porMesa.get(mesaId) ?? { label, faturamento: 0, comandaIds: new Set() };
    entrada.faturamento += Number(item.preco_total);
    entrada.comandaIds.add(comanda.id);
    porMesa.set(mesaId, entrada);
  }

  return [...porMesa.entries()]
    .map(([mesaId, v]) => ({
      mesaId,
      mesaLabel: v.label,
      faturamento: v.faturamento,
      comandas: v.comandaIds.size,
    }))
    .sort((a, b) => b.faturamento - a.faturamento);
}

// ─── Mix de pagamento ─────────────────────────────────────────────────────────

export interface FatiaMetodo {
  metodo: PagamentoMetodo;
  valor: number;
  percentual: number; // 0–100
}

const METODO_LABEL: Record<PagamentoMetodo, string> = {
  pix:      "Pix",
  credito:  "Crédito",
  debito:   "Débito",
  dinheiro: "Dinheiro",
  cortesia: "Cortesia",
};

export function labelMetodo(metodo: PagamentoMetodo): string {
  return METODO_LABEL[metodo] ?? metodo;
}

/**
 * Distribuição de pagamentos por método no turno.
 * Inclui apenas `status = 'confirmado'`.
 */
export async function getMixPagamento(
  barId: string,
  turnoId: string,
): Promise<FatiaMetodo[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pagamentos")
    .select("metodo, valor")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "confirmado")
    .returns<{ metodo: PagamentoMetodo; valor: number }[]>();

  const porMetodo = new Map<PagamentoMetodo, number>();
  let total = 0;

  for (const p of data ?? []) {
    porMetodo.set(p.metodo, (porMetodo.get(p.metodo) ?? 0) + Number(p.valor));
    total += Number(p.valor);
  }

  if (total === 0) return [];

  return [...porMetodo.entries()]
    .map(([metodo, valor]) => ({
      metodo,
      valor,
      percentual: Math.round((valor / total) * 100),
    }))
    .sort((a, b) => b.valor - a.valor);
}

// ─── Tempo médio de preparo ───────────────────────────────────────────────────

export interface TemposPreparo {
  mediaMinutos: number | null; // null = sem pedidos entregues ainda
  totalEntregues: number;
  totalRecebidos: number; // pedidos recebidos no turno (inclui em preparo)
}

/**
 * Calcula o tempo médio entre criado_em e entregue_em dos pedidos do turno.
 * Só considera pedidos com status = 'entregue' (os únicos com entregue_em).
 */
export async function getTempoMedioPreparo(
  barId: string,
  turnoId: string,
): Promise<TemposPreparo> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pedidos")
    .select("status, criado_em, entregue_em")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .returns<{ status: string; criado_em: string; entregue_em: string | null }[]>();

  const todos = data ?? [];
  const totalRecebidos = todos.length;
  const entregues = todos.filter(p => p.status === "entregue" && p.entregue_em);

  if (!entregues.length) return { mediaMinutos: null, totalEntregues: 0, totalRecebidos };

  const somaMs = entregues.reduce((acc, p) => {
    const diff = new Date(p.entregue_em!).getTime() - new Date(p.criado_em).getTime();
    return acc + Math.max(diff, 0);
  }, 0);

  const mediaMs = somaMs / entregues.length;
  const mediaMinutos = Math.round(mediaMs / 60000);

  return { mediaMinutos, totalEntregues: entregues.length, totalRecebidos };
}

// ─── Helper: insight declarativo ─────────────────────────────────────────────

export interface InsightOperacional {
  texto: string;
  tipo: "action" | "opportunity" | "info";
  contexto?: string;
  sugestao?: string;
  impactoReais?: number;
}

export function gerarInsightsOperacionais({
  pico,
  mesas,
  mix,
  tempos,
  faturamentoTurno,
}: {
  pico: ReturnType<typeof calcularPico>;
  mesas: MesaRanking[];
  mix: FatiaMetodo[];
  tempos: TemposPreparo;
  faturamentoTurno: number;
}): InsightOperacional[] {
  const insights: InsightOperacional[] = [];

  // Pico de vendas
  if (pico && pico.drinks >= 5) {
    const h = pico.hora;
    insights.push({
      texto: `Pico desta noite: ${h}h–${h + 1}h (${pico.drinks} drinks). Reforce o bar nesse horário.`,
      tipo: "info",
    });
  }

  // Mesa top
  if (mesas.length > 0 && faturamentoTurno > 0) {
    const top = mesas[0];
    const pct = Math.round((top.faturamento / faturamentoTurno) * 100);
    if (pct >= 20) {
      insights.push({
        texto: `${top.mesaLabel} concentrou ${pct}% da receita do turno — a mesa mais rentável do momento.`,
        tipo: "opportunity",
      });
    }
  }

  // Método dominante
  if (mix.length > 0 && mix[0].percentual >= 60) {
    insights.push({
      texto: `${labelMetodo(mix[0].metodo)} representa ${mix[0].percentual}% dos pagamentos desta noite.`,
      tipo: "info",
      sugestao: "Confirme que as taxas de transação estão dentro do esperado.",
    });
  }

  // Tempo médio de preparo alto
  if (tempos.mediaMinutos !== null && tempos.mediaMinutos >= 8) {
    insights.push({
      texto: `Preparo médio em ${tempos.mediaMinutos}min — acima do ideal.`,
      contexto: `Média de ${tempos.totalEntregues} pedido${tempos.totalEntregues === 1 ? "" : "s"} entregues neste turno.`,
      tipo: "action",
      sugestao: "Bar pode estar sobrecarregado. Verifique a distribuição de tarefas.",
    });
  }

  // Tempo médio excelente
  if (tempos.mediaMinutos !== null && tempos.mediaMinutos <= 3 && tempos.totalEntregues >= 5) {
    insights.push({
      texto: `Preparo em ${tempos.mediaMinutos}min. Bar em ritmo ótimo esta noite.`,
      tipo: "opportunity",
    });
  }

  return insights;
}
