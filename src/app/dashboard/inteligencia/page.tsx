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
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 48px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={H1}>Inteligência</h1>
        <p style={SUBTITLE}>O que precisa da sua atenção</p>
      </div>

      {/* ── Cards ── */}
      <InsightCards insights={insights} />

    </div>
  );
}
