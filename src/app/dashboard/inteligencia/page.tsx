import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getInsightsPendentes } from "@/lib/inteligencia/queries";
import { InsightCards } from "@/components/inteligencia/insight-cards";
import { H1, SUBTITLE } from "@/lib/ui";

export default async function InteligenciaPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const insights = await getInsightsPendentes(current.bar.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header — mesmo padrão das outras páginas ── */}
      <div className="py-6 lg:px-10 lg:py-8">
        <h1 style={H1}>Inteligência</h1>
        <p style={SUBTITLE}>O que precisa da sua atenção</p>
      </div>

      {/* ── Cards — centralizados vertical e horizontalmente ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 600 }}>
          <InsightCards insights={insights} />
        </div>
      </div>

    </div>
  );
}
