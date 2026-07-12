import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

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
      <AdminSidebar />
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
