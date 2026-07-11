import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { podeVerAdminDashboard } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { OperadorShell } from "@/components/bartender/operador-shell";
import type { MembroSimples } from "@/components/bartender/operador-shell";

export default async function GarcomLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // getCurrentBar() tenta auth normal primeiro, depois cookie kiosk
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  // Usa service role para listar membros — funciona tanto em auth normal quanto kiosk
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("bar_members")
    .select("id, nome, role, pin, foto_url")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .not("nome", "is", null)
    .in("role", ["garcom", "dono", "gerente", "bar_manager"])
    .order("created_at", { ascending: true })
    .returns<{ id: string; nome: string | null; role: string; pin: string | null; foto_url: string | null }[]>();

  let membros: MembroSimples[] = (rows ?? []).map(r => ({
    id: r.id,
    nome: r.nome ?? "Sem nome",
    role: r.role,
    temPin: !!r.pin,
    fotoUrl: r.foto_url ?? (r.nome ? `/funcionarios/${encodeURIComponent(r.nome)}.png` : null),
  }));

  // Fallback: se não há membros na equipe, usa o perfil do usuário autenticado
  if (membros.length === 0 && !current.isKiosk) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, nome")
      .eq("id", current.userId)
      .maybeSingle<{ id: string; nome: string }>();
    if (profile) {
      membros = [{ id: profile.id, nome: profile.nome, role: current.role, temPin: false, fotoUrl: null }];
    }
  }

  return (
    <OperadorShell
      membros={membros}
      barNome={current.bar.nome}
      roleLabel="Garçom"
      isKiosk={current.isKiosk}
      voltarHref={!current.isKiosk && podeVerAdminDashboard(current.role) ? "/operacao" : undefined}
    >
      {children}
    </OperadorShell>
  );
}
