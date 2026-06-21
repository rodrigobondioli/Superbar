import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getAlertasEstoque } from "@/lib/dashboard/queries";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const current = await getCurrentBar();
  if (!current) redirect("/onboarding");

  const alertas = await getAlertasEstoque(current.bar.id);

  return (
    <DashboardLayoutClient
      barNome={current.bar.nome}
      userNome={current.userNome}
      role={current.role}
      bar={current.bar}
      barId={current.bar.id}
      userId={current.userId}
      userEmail={current.userEmail}
      userAvatarUrl={current.userAvatarUrl}
      alertas={alertas}
      autoPedido={current.bar.configuracoes?.auto_pedido ?? false}
    >
      {children}
    </DashboardLayoutClient>
  );
}
