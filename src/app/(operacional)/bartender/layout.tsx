import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { OperadorShell } from "@/components/bartender/operador-shell";
import type { MembroSimples } from "@/components/bartender/operador-shell";

export default async function BartenderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const current = await getCurrentBar();

  if (!current) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0a0a10", padding: "0 16px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.80)" }}>Nenhum bar vinculado a esse usuário ainda.</p>
      </div>
    );
  }

  // Busca membros ativos para a tela "Quem é você?"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase.from("bar_members") as any)
    .select("id, nome, role")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .order("created_at", { ascending: true }) as {
      data: { id: string; nome: string | null; role: string }[] | null;
    };

  const membros: MembroSimples[] = (rows ?? []).map(r => ({
    id: r.id,
    nome: r.nome ?? r.profiles?.nome ?? "Sem nome",
    role: r.role,
  }));

  return (
    <OperadorShell membros={membros} barNome={current.bar.nome}>
      {children}
    </OperadorShell>
  );
}
