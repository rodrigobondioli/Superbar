import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { getAdminBares } from "@/lib/admin/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");
  if (!isPlatformAdmin(auth.user.email)) {
    redirect("/dashboard");
  }

  // Badge da sidebar: bares que precisam de atenção (algum alerta ativo).
  // getAdminBares é cache()-ado, então divide a query com a página.
  const { bares } = await getAdminBares();
  const alertCount = bares.filter((b) => b.alertas.length > 0).length;

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <AdminSidebar adminEmail={auth.user.email ?? ""} alertCount={alertCount} />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: "32px 40px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
