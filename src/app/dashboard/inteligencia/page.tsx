import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getInsightsAtuais } from "@/lib/inteligencia/insights-atuais";
import { podeVerFinanceiro } from "@/lib/auth/roles";
import { CentralInsights } from "@/components/inteligencia/central-insights";

export default async function InteligenciaPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");
  if (!podeVerFinanceiro(current.role)) redirect("/dashboard/estoque");

  const insights = await getInsightsAtuais(current.bar.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 48 }}>

      {/* ── Header — padrão ── */}
      <div className="py-6 lg:py-8" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Central de Inteligência</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>O que os seus dados dizem que precisa da sua atenção</p>
        </div>
      </div>

      {/* Lista priorizada — largura de leitura confortável, alinhada à esquerda */}
      <div style={{ width: "100%", maxWidth: 780 }}>
        <CentralInsights insights={insights} />
      </div>

    </div>
  );
}
