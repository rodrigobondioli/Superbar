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
  color: "var(--fg-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
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
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.01em", margin: 0 }}>
            Turnos
          </h1>
          <p style={{ fontSize: "14px", color: "var(--fg-muted)", margin: "6px 0 0" }}>
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
                  borderBottom: "1px solid var(--border)",
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
              <tr key={turno.id} style={{ background: i % 2 === 1 ? "color-mix(in srgb, var(--fg) 2%, transparent)" : undefined }}>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "2px",
                    background: turno.status === "aberto" ? "var(--ok-bg)" : "color-mix(in srgb, var(--fg) 8%, transparent)",
                    color: turno.status === "aberto" ? "var(--ok)" : "var(--fg-muted)",
                  }}>
                    {turno.status === "aberto" ? "Aberto" : "Fechado"}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg)" }}>
                  {dataHora.format(new Date(turno.abertoEm))}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg-muted)" }}>
                  {turno.fechadoEm ? dataHora.format(new Date(turno.fechadoEm)) : "—"}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg-muted)" }}>
                  {turno.abertoPorNome}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg)", textAlign: "right" }}>
                  {turno.totalComandas}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                  {currency.format(turno.totalVendas)}
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <Link href={`/dashboard/turnos/${turno.id}`} style={{
                    fontSize: "13px",
                    color: "var(--fg-subtle)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}>
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {turnos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "32px 20px", textAlign: "center", fontSize: "14px", color: "var(--fg-subtle)" }}>
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
