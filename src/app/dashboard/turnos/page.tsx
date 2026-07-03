import Link from "next/link";
import { ChevronsRight } from "lucide-react";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getTurnos } from "@/lib/dashboard/turnos";
import { EmptyState } from "@/components/ui/empty-state";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const th: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: "var(--fg)",
  textAlign: "left",
  padding: "0 24px 20px 0",
  borderBottom: "1px solid var(--border-strong)",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: "var(--fg-muted)",
  padding: "24px 24px 24px 0",
  borderBottom: "1px solid var(--border-strong)",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export default async function TurnosPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const [turnos] = await Promise.all([
    getTurnos(current.bar.id),
    getTurnoAtual(current.bar.id),
  ]);

  return (
    <div className="py-6 lg:px-10 lg:py-8 flex flex-col gap-6">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>
            Turnos
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            Registro de todos os turnos abertos e fechados.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "8px 16px", borderRadius: 999, background: "var(--accent)", color: "var(--accent-fg)", fontSize: 13, fontWeight: 500 }}>Hoje</span>
          <span style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border)", color: "var(--fg-muted)", fontSize: 13 }}>Ontem</span>
          <span style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border)", color: "var(--fg-muted)", fontSize: 13 }}>7 dias</span>
          <a href="/dashboard/relatorios" style={{ padding: "8px 16px", fontSize: 13, color: "var(--fg-muted)", textDecoration: "none" }}>Ver relatório completo</a>
        </div>
      </div>

      {/* divisória abaixo do cabeçalho (Line 16 do Figma) */}
      <div style={{ height: 1, background: "var(--border-strong)" }} />

      {/* Tabela (sem card — direto no canvas, igual ao Figma) */}
      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr>
              <th style={th}>Status</th>
              <th style={th}>Abertura</th>
              <th className="hidden sm:table-cell" style={th}>Fechamento</th>
              <th className="hidden sm:table-cell" style={th}>Aberto por</th>
              <th className="hidden sm:table-cell" style={th}>Comandas</th>
              <th style={th}>Faturamento</th>
              <th style={{ ...th, padding: "0 0 20px" }} />
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => {
              const aberto = turno.status === "aberto";
              return (
                <tr key={turno.id}>
                  <td style={td}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--bg-card-hi)",
                      borderRadius: 999,
                      padding: "6px 12px",
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: aberto ? "var(--ok)" : "var(--fg-muted)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: aberto ? "var(--ok)" : "var(--fg-muted)" }}>
                        {aberto ? "Aberto" : "Fechado"}
                      </span>
                    </span>
                  </td>
                  <td style={td}>{dataHora.format(new Date(turno.abertoEm))}</td>
                  <td className="hidden sm:table-cell" style={td}>
                    {turno.fechadoEm ? dataHora.format(new Date(turno.fechadoEm)) : "—"}
                  </td>
                  <td className="hidden sm:table-cell" style={td}>{turno.abertoPorNome}</td>
                  <td className="hidden sm:table-cell" style={td}>{turno.totalComandas}</td>
                  <td style={{ ...td, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>
                    {currency.format(turno.totalVendas)}
                  </td>
                  <td style={{ ...td, padding: "24px 0", textAlign: "right", width: 40 }}>
                    <Link href={`/dashboard/turnos/${turno.id}`} aria-label="Ver turno" style={{ display: "inline-flex", color: "var(--accent)" }}>
                      <ChevronsRight size={20} strokeWidth={2.25} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {turnos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ borderBottom: "none" }}>
                  <EmptyState
                    icon="🕐"
                    title="Nenhum turno ainda"
                    description="Abra o primeiro turno para começar a registrar vendas. O histórico completo fica aqui."
                    action={
                      <a href="/dashboard/caixa" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-bright)", textDecoration: "none" }}>
                        O caixa abre o turno pela página de Caixa →
                      </a>
                    }
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
