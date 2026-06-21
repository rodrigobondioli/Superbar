import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { OperadorShell } from "@/components/bartender/operador-shell";
import type { MembroSimples } from "@/components/bartender/operador-shell";

export default async function GarcomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const current = await getCurrentBar();
  if (!current) redirect("/onboarding");

  const { data: rows } = await supabase
    .from("bar_members")
    .select("id, nome, role")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .not("nome", "is", null)
    .order("created_at", { ascending: true })
    .returns<{ id: string; nome: string | null; role: string }[]>();

  let membros: MembroSimples[] = (rows ?? []).map(r => ({
    id: r.id,
    nome: r.nome ?? "Sem nome",
    role: r.role,
  }));

  if (membros.length === 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("id", current.userId)
      .maybeSingle();
    if (profile) {
      membros = [{ id: profile.id, nome: profile.nome, role: current.role }];
    }
  }

  return (
    <OperadorShell membros={membros} barNome={current.bar.nome} roleLabel="Garçom">
      {children}
    </OperadorShell>
  );
}
