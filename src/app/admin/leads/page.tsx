import { getLeads, getStages } from "@/lib/admin/queries";
import { LeadsKanban } from "@/components/admin/leads-kanban";
import { LeadsAddForm } from "@/components/admin/leads-add-form";

export default async function AdminLeadsPage() {
  const [leads, stages] = await Promise.all([getLeads(), getStages()]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header — padrão */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Leads</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {leads.length} {leads.length === 1 ? "lead" : "leads"} no pipeline
          </p>
        </div>
        <LeadsAddForm />
      </div>

      <LeadsKanban leads={leads} stages={stages} />
    </div>
  );
}
