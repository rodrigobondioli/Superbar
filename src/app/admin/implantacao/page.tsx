import { getAdminBares } from "@/lib/admin/queries";
import { AdminImplantacao, setupStatus } from "@/components/admin/admin-implantacao";

export default async function AdminImplantacaoPage() {
  const { bares } = await getAdminBares();

  const prontos = bares.filter((b) => setupStatus(b).pronto).length;
  const pendentes = bares.length - prontos;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header — padrão */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Implantação</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {prontos} pronto{prontos !== 1 ? "s" : ""} pra operar
            {pendentes > 0 && ` · ${pendentes} em setup`}
          </p>
        </div>
        <time style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </time>
      </div>

      <AdminImplantacao bares={bares} />
    </div>
  );
}
