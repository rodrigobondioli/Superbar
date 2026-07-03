import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getInsightsPendentes } from "@/lib/inteligencia/queries";
import { InsightCards } from "@/components/inteligencia/insight-cards";

export default async function InteligenciaPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const insights = await getInsightsPendentes(current.bar.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header — padrão Figma ── */}
      <div className="py-6 lg:px-10 lg:py-8">
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Inteligência</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>O que precisa da sua atenção</p>
        </div>
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
