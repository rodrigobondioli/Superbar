import Link from "next/link";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getTurnos } from "@/lib/dashboard/turnos";
import { TurnoControles } from "@/components/dashboard/turno-controles";
import { EmptyState } from "@/components/ui/empty-state";

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
    <div className="py-6 lg:px-10 lg:py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
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

      {/* Table card — 4 colunas no mobile, 7 no sm+ */}
      <div className="overflow-x-auto" style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr>
              <th style={{ ...label, padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Status</th>
              <th style={{ ...label, padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Abertura</th>
              <th className="hidden sm:table-cell" style={{ ...label, padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Fechamento</th>
              <th className="hidden sm:table-cell" style={{ ...label, padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>Aberto por</th>
              <th className="hidden sm:table-cell" style={{ ...label, padding: "14px 20px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 500 }}>Comandas</th>
              <th style={{ ...label, padding: "14px 20px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 500 }}>Faturamento</th>
              <th style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }} />
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno, i) => (
              <tr key={turno.id} style={{ background: i % 2 === 1 ? "color-mix(in srgb, var(--fg) 2%, transparent)" : undefined }}>
                <td className="align-middle" style={{ padding: "14px 20px" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "2px",
                    whiteSpace: "nowrap",
                    background: turno.status === "aberto" ? "var(--ok-bg)" : "color-mix(in srgb, var(--fg) 8%, transparent)",
                    color: turno.status === "aberto" ? "var(--ok)" : "var(--fg-muted)",
                  }}>
                    {turno.status === "aberto" ? "Aberto" : "Fechado"}
                  </span>
                </td>
                <td className="align-middle" style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg)", whiteSpace: "nowrap" }}>
                  {dataHora.format(new Date(turno.abertoEm))}
                </td>
                <td className="hidden sm:table-cell align-middle" style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                  {turno.fechadoEm ? dataHora.format(new Date(turno.fechadoEm)) : "—"}
                </td>
                <td className="hidden sm:table-cell align-middle" style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg-muted)" }}>
                  {turno.abertoPorNome}
                </td>
                <td className="hidden sm:table-cell align-middle" style={{ padding: "14px 20px", fontSize: "14px", color: "var(--fg)", textAlign: "right" }}>
                  {turno.totalComandas}
                </td>
                <td className="align-middle" style={{ padding: "14px 16px 14px 20px", fontSize: "14px", color: "var(--fg)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {currency.format(turno.totalVendas)}
                </td>
                <td className="align-middle w-12 shrink-0" style={{ padding: "14px 20px 14px 8px", textAlign: "right" }}>
                  <Link href={`/dashboard/turnos/${turno.id}`} style={{
                    fontSize: "13px",
                    color: "var(--fg-subtle)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                    whiteSpace: "nowrap",
                  }}>
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {turnos.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="🕐"
                    title="Nenhum turno ainda"
                    description="Abra o primeiro turno para começar a registrar vendas. O histórico completo fica aqui."
                    action={!turnoAtual ? <TurnoControles turnoAtual={null} /> : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
