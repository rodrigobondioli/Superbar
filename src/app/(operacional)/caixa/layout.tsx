export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { podeVerAdminDashboard } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { OperadorShell } from "@/components/bartender/operador-shell";
import type { MembroSimples } from "@/components/bartender/operador-shell";

export default async function CaixaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("bar_members")
    .select("id, nome, role, pin, foto_url")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .not("nome", "is", null)
    .in("role", ["caixa", "dono", "gerente", "bar_manager"])
    .order("created_at", { ascending: true })
    .returns<{ id: string; nome: string | null; role: string; pin: string | null; foto_url: string | null }[]>();

  let membros: MembroSimples[] = (rows ?? []).map(r => ({
    id: r.id,
    nome: r.nome ?? "Sem nome",
    role: r.role,
    temPin: !!r.pin,
    fotoUrl: r.foto_url ?? (r.nome ? `/funcionarios/${encodeURIComponent(r.nome)}.png` : null),
  }));

  // Garante que o dono logado sempre aparece — mesmo sem bar_members com nome cadastrado
  if (!current.isKiosk) {
    const jaIncluso = membros.some(m => m.id === current.memberId);
    if (!jaIncluso) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, nome")
        .eq("id", current.userId)
        .maybeSingle<{ id: string; nome: string }>();
      if (profile) {
        membros = [
          { id: current.memberId ?? profile.id, nome: profile.nome ?? current.userNome, role: current.role, temPin: false, fotoUrl: current.userAvatarUrl },
          ...membros,
        ];
      }
    }
  }

  return (
    <OperadorShell
      membros={membros}
      barNome={current.bar.nome}
      roleLabel="Caixa"
      isKiosk={current.isKiosk}
      voltarHref={!current.isKiosk && podeVerAdminDashboard(current.role) ? "/operacao" : undefined}
    >
      {children}
    </OperadorShell>
  );
}
