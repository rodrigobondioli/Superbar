import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";

export default async function CaixaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const current = await getCurrentBar();
  if (!current) redirect("/login");

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--fg)",
    }}>
      {children}
    </div>
  );
}
