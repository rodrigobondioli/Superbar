import { getLeads } from "@/lib/admin/queries";
import { LeadsKanban } from "@/components/admin/leads-kanban";
import { LeadsAddForm } from "@/components/admin/leads-add-form";

export default async function AdminLeadsPage() {
  const leads = await getLeads();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Pipeline
        </h1>
        <LeadsAddForm />
      </div>
      <LeadsKanban leads={leads} />
    </div>
  );
}
