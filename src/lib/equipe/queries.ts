import { createClient } from "@/lib/supabase/server";
import type { BarRole } from "@/types/database";

export interface MembroEquipe {
  id: string; // bar_members.id
  userId: string | null; // null = staff operacional sem conta de auth
  nome: string;
  role: BarRole;
  ativo: boolean;
  desde: string;
  fotoUrl: string | null;
  ordem: number;
  // ranking
  totalComandas: number;
  totalVendas: number;
  ticketMedio: number;
}

export async function getMembrosEquipe(barId: string): Promise<MembroEquipe[]> {
  const supabase = await createClient();

  const { data: membros } = await supabase
    .from("bar_members")
    .select(`
      id,
      user_id,
      role,
      ativo,
      nome,
      foto_url,
      ordem,
      created_at,
      profiles!bar_members_user_id_fkey(nome, avatar_url)
    `)
    .eq("bar_id", barId)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<{
      id: string;
      user_id: string | null;
      role: BarRole;
      ativo: boolean;
      nome: string | null;
      foto_url: string | null;
      ordem: number;
      created_at: string;
      profiles: { nome: string; avatar_url: string | null } | null;
    }[]>();

  if (!membros?.length) return [];

  // Busca ranking: comandas fechadas por bartender (últimos 30 dias)
  const trinta = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stats } = await supabase
    .from("comandas")
    .select("bartender_id, total")
    .eq("bar_id", barId)
    .eq("status", "paga")
    .gte("aberta_em", trinta)
    .returns<{ bartender_id: string; total: number }[]>();

  const statsMap = new Map<string, { count: number; total: number }>();
  for (const s of stats ?? []) {
    const prev = statsMap.get(s.bartender_id) ?? { count: 0, total: 0 };
    statsMap.set(s.bartender_id, { count: prev.count + 1, total: prev.total + s.total });
  }

  return membros.map((m) => {
    const stat = m.user_id ? (statsMap.get(m.user_id) ?? { count: 0, total: 0 }) : { count: 0, total: 0 };
    return {
      id:           m.id,
      userId:       m.user_id ?? null,
      nome:         m.nome || m.profiles?.nome || "—",
      role:         m.role,
      ativo:        m.ativo,
      desde:        m.created_at,
      fotoUrl:      m.foto_url ?? m.profiles?.avatar_url ?? null,
      ordem:        m.ordem,
      totalComandas: stat.count,
      totalVendas:   stat.total,
      ticketMedio:   stat.count > 0 ? stat.total / stat.count : 0,
    };
  });
}
