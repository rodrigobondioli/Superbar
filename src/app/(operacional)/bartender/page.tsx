import { redirect } from "next/navigation";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getMesasComStatus, getComandaBalcao } from "@/lib/bartender/queries";
import { FilaPedidos } from "@/components/bartender/fila-pedidos";
import { MesasGrid } from "@/components/bartender/mesas-grid";

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
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Coluna esquerda: Fila de pedidos ── */}
      <div style={{
        width: 360, flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            Fila de pedidos
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", margin: "4px 0 0" }}>
            Tempo real
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px" }}>
          <FilaPedidos barId={current.bar.id} />
        </div>
      </div>

      {/* ── Coluna direita: Mesas (client component com realtime) ── */}
      <MesasGrid
        barId={current.bar.id}
        initialMesas={mesas}
        initialBalcao={comandaBalcao}
      />
    </div>
  );
}
