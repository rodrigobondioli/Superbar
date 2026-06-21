import { redirect } from "next/navigation";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getMesasComStatus, getComandaBalcao } from "@/lib/bartender/queries";
import { BartenderTabs } from "@/components/bartender/bartender-tabs";

export default async function BartenderPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 32, maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Nenhum turno aberto. Peça para o gerente abrir o turno.
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
    <BartenderTabs
      barId={current.bar.id}
      turnoId={turno.id}
      initialMesas={mesas}
      initialBalcao={comandaBalcao}
    />
  );
}
