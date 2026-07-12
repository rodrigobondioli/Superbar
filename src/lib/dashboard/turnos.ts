import { createClient } from "@/lib/supabase/server";
import type { ComandaStatus, TurnoStatus } from "@/types/database";

export interface TurnoResumo {
  id: string;
  status: TurnoStatus;
  abertoEm: string;
  fechadoEm: string | null;
  totalVendas: number;
  totalComandas: number;
  abertoPorNome: string;
  fechadoPorNome: string | null;
}

interface TurnoRow {
  id: string;
  status: TurnoStatus;
  aberto_em: string;
  fechado_em: string | null;
  total_vendas: number;
  total_comandas: number;
  abertura: { nome: string } | null;
  fechamento: { nome: string } | null;
}

function toResumo(row: TurnoRow): TurnoResumo {
  return {
    id: row.id,
    status: row.status,
    abertoEm: row.aberto_em,
    fechadoEm: row.fechado_em,
    totalVendas: row.total_vendas,
    totalComandas: row.total_comandas,
    abertoPorNome: row.abertura?.nome ?? "—",
    fechadoPorNome: row.fechamento?.nome ?? null,
  };
}

const TURNO_SELECT =
  "id, status, aberto_em, fechado_em, total_vendas, total_comandas, observacoes, abertura:profiles!turnos_abertura_por_fkey(nome), fechamento:profiles!turnos_fechamento_por_fkey(nome)";

export async function getTurnos(barId: string, limit = 20): Promise<TurnoResumo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select(TURNO_SELECT)
    .eq("bar_id", barId)
    .order("aberto_em", { ascending: false })
    .limit(limit);

  return (data ?? []).map(toResumo);
}

export interface TurnoDetalhe extends TurnoResumo {
  observacoes: string | null;
}

export async function getTurnoDetalhe(turnoId: string): Promise<TurnoDetalhe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select(TURNO_SELECT)
    .eq("id", turnoId)
    .maybeSingle<TurnoRow & { observacoes: string | null }>();

  if (!data) return null;

  return { ...toResumo(data), observacoes: data.observacoes };
}

export interface ComandaResumo {
  id: string;
  identificador: string | null;
  status: ComandaStatus;
  total: number;
}

export async function getComandasDoTurno(turnoId: string): Promise<ComandaResumo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comandas")
    .select("id, identificador, status, total")
    .eq("turno_id", turnoId)
    .order("aberta_em", { ascending: false });

  return data ?? [];
}
