import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import { getMesasComStatus, getComandaBalcao } from "@/lib/bartender/queries";
import { MesasGrid } from "@/components/bartender/mesas-grid";

export default async function GarcomPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "color-mix(in srgb, var(--fg) 4%, transparent)", borderRadius: 8, padding: 32, border: "1px solid var(--border)", maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
            Erro ao iniciar turno. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const [mesas, comandaBalcao] = await Promise.all([
    getMesasComStatus(current.bar.id, turno.id),
    getComandaBalcao(current.bar.id, turno.id),
  ]);

  return (
    <MesasGrid
      barId={current.bar.id}
      initialMesas={mesas}
      initialBalcao={comandaBalcao}
    />
  );
}
