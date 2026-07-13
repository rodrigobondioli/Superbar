import React from "react";
import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { podeVerFinanceiro } from "@/lib/auth/roles";
import { listarClientes, getClientesStats, getAniversariantesDoMes, getClientesInativos } from "@/lib/clientes/queries";
import { ClientesTable } from "@/components/clientes/clientes-table";
import { NovoClienteButton } from "@/components/clientes/novo-cliente-button";
import { formatBRL as fmt } from "@/lib/format";

// Remove prefixo "Mesa X - " / "Balcão - " gerado pelo seed antigo
const nomeDisplay = (nome: string) => nome.replace(/^[^-]+ - /, "");

const insightCard: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24,
  display: "flex", flexDirection: "column", gap: 16,
};
const insightLabel: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", margin: 0 };
const insightMetric: React.CSSProperties = { fontSize: 32, fontWeight: 700, color: "var(--fg)", lineHeight: 1, margin: 0, fontVariantNumeric: "tabular-nums" };

export default async function ClientesPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");
  if (!podeVerFinanceiro(current.role)) redirect("/dashboard/estoque");

  const [clientes, stats, aniversariantes, inativos] = await Promise.all([
    listarClientes(),
    getClientesStats(),
    getAniversariantesDoMes(),
    getClientesInativos(30),
  ]);

  const mesAtual = new Date().toLocaleString("pt-BR", { month: "long" });

  return (
    <div className="py-6 lg:py-8 flex flex-col gap-6 min-h-full">
      {/* Header — padrão Figma */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Clientes</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>{stats?.total ?? 0} clientes cadastrados</p>
        </div>
        <NovoClienteButton />
      </div>

      {/* Cards de insight — somem quando não há cliente (aí o empty state manda) */}
      {clientes.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 24 }}>

        {/* Aniversariantes */}
        <div style={insightCard}>
          <p style={insightLabel}>Aniversariantes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={insightMetric}>{stats?.aniversariantes ?? 0}</p>
            <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>em {mesAtual}</p>
          </div>
          {aniversariantes.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border-strong)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {aniversariantes.slice(0, 3).map(c => (
                <p key={c.id} style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                  {nomeDisplay(c.nome)}
                  {c.data_nascimento ? ` · ${new Date(c.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Inativos +30 dias */}
        <div style={insightCard}>
          <p style={insightLabel}>Inativos há +30 dias</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ ...insightMetric, color: inativos.length > 0 ? "var(--warn)" : "var(--fg)" }}>{inativos.length}</p>
            <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>clientes para reconquistar</p>
          </div>
          {inativos.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border-strong)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {inativos.slice(0, 3).map(c => (
                <p key={c.id} style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                  {nomeDisplay(c.nome)} · {fmt(c.total_gasto)}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Ticket médio */}
        <div style={insightCard}>
          <p style={insightLabel}>Ticket médio</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={insightMetric}>{fmt(stats?.ticketMedio ?? 0)}</p>
            <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>por visita por cliente</p>
          </div>
          {clientes.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border-strong)", paddingTop: 16 }}>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                Top: {nomeDisplay(clientes[0]?.nome ?? "")} · {fmt(clientes[0]?.total_gasto ?? 0)}
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Tabela */}
      <ClientesTable clientes={clientes} />
    </div>
  );
}
