import { getAdminBares } from "@/lib/admin/queries";
import { AdminBaresTable } from "@/components/admin/admin-bares-table";

export default async function AdminClientesPage() {
  const { bares, stats } = await getAdminBares();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header — padrão */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Clientes</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {stats.total_bares} {stats.total_bares === 1 ? "bar" : "bares"} na plataforma
          </p>
        </div>
        <time style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </time>
      </div>

      <AdminBaresTable bares={bares} />
    </div>
  );
}
