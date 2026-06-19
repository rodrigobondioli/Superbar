import Link from "next/link";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getTurnos } from "@/lib/dashboard/turnos";
import { TurnoControles } from "@/components/dashboard/turno-controles";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const label: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(255,255,255,0.38)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: "12px",
  overflow: "hidden",
};

export default async function TurnosPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const [turnos, turnoAtual] = await Promise.all([
    getTurnos(current.bar.id),
    getTurnoAtual(current.bar.id),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "32px 40px", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={label}>Histórico</p>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#ffffff", margin: "6px 0 0" }}>
            Turnos
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", margin: "6px 0 0" }}>
            Registro de todos os turnos abertos e fechados.
          </p>
        </div>
        <TurnoControles turnoAtual={turnoAtual} />
      </div>

      {/* Table card */}
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr>
              {["Status", "Abertura", "Fechamento", "Aberto por", "Comandas", "Faturamento", ""].map((h, i) => (
                <th key={i} style={{
                  ...label,
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  textAlign: i >= 4 && i <= 5 ? "right" : "left",
                  fontWeight: 500,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno, i) => (
              <tr key={turno.id} style={{ background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : undefined }}>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "99px",
                    background: turno.status === "aberto" ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.07)",
                    color: turno.status === "aberto" ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.45)",
                  }}>
                    {turno.status === "aberto" ? "Aberto" : "Fechado"}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                  {dataHora.format(new Date(turno.abertoEm))}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>
                  {turno.fechadoEm ? dataHora.format(new Date(turno.fechadoEm)) : "—"}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>
                  {turno.abertoPorNome}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "rgba(255,255,255,0.85)", textAlign: "right" }}>
                  {turno.totalComandas}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "#ffffff", textAlign: "right", fontFamily: "monospace" }}>
                  {currency.format(turno.totalVendas)}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <Link href={`/dashboard/turnos/${turno.id}`} style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.40)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                    onMouseOver={undefined}
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {turnos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "32px 20px", textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>
                  Nenhum turno registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
