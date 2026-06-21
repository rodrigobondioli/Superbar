import { redirect } from "next/navigation";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { ProducaoTab } from "@/components/bartender/producao-tab";

export default async function ProducaoPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "color-mix(in srgb, var(--fg) 4%, transparent)",
          borderRadius: 8, padding: 32,
          border: "1px solid var(--border)",
          maxWidth: 400, textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
            Nenhum turno aberto. Peça para o gerente abrir o turno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ProducaoTab barId={current.bar.id} turnoId={turno.id} />
    </div>
  );
}
