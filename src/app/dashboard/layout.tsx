import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getAlertasEstoque } from "@/lib/dashboard/queries";
import { countInsightsPendentes } from "@/lib/inteligencia/queries";
import { isOperacional, homePath } from "@/lib/auth/roles";
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

  // Papéis operacionais (bartender/garçom/caixa) não entram no dashboard do dono.
  if (isOperacional(current.role)) redirect(homePath(current.role));

  const [alertas, insightCount] = await Promise.all([
    getAlertasEstoque(current.bar.id),
    countInsightsPendentes(current.bar.id),
  ]);

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
      insightCount={insightCount}
      autoPedido={current.bar.configuracoes?.auto_pedido ?? false}
      taxaServicoPct={current.bar.configuracoes?.taxa_servico_pct ?? 10}
    >
      {children}
    </DashboardLayoutClient>
  );
}
