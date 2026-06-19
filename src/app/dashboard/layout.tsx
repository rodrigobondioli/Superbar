import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { signOut } from "@/lib/auth/actions";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-center">
        <p className="text-body text-white-80">Nenhum bar vinculado a esse usuário ainda.</p>
        <form action={signOut}>
          <button className="text-body-sm text-white-50 underline transition-colors duration-150 active:scale-[0.97] hover:text-white">
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a10" }}>
      <aside style={{ width: "220px", flexShrink: 0, height: "100vh", overflowY: "auto", background: "#0a0a10", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <DashboardSidebar barNome={current.bar.nome} userNome={current.userNome} role={current.role} />
      </aside>
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", background: "#0a0a10" }}>{children}</main>
    </div>
  );
}
