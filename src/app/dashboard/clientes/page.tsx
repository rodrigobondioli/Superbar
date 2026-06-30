import React from "react";
import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { listarClientes, getClientesStats, getAniversariantesDoMes, getClientesInativos } from "@/lib/clientes/queries";
import { H1, SUBTITLE, CARD } from "@/lib/ui";
import { ClientesTable } from "@/components/clientes/clientes-table";
import { NovoClienteButton } from "@/components/clientes/novo-cliente-button";

const fmt   = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN  = (v: number) => v.toLocaleString("pt-BR");
// Remove prefixo "Mesa X - " / "Balcão - " gerado pelo seed antigo
const nomeDisplay = (nome: string) => nome.replace(/^[^-]+ - /, "");

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
  textTransform: "uppercase", color: "var(--fg-subtle)", margin: 0,
};

export default async function ClientesPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const [clientes, stats, aniversariantes, inativos] = await Promise.all([
    listarClientes(),
    getClientesStats(),
    getAniversariantesDoMes(),
    getClientesInativos(30),
  ]);

  const mesAtual = new Date().toLocaleString("pt-BR", { month: "long" });

  return (
    <div className="py-6 lg:px-10 lg:py-8">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={H1}>Clientes</h1>
          <p style={SUBTITLE}>
            {stats?.total ?? 0} cliente{(stats?.total ?? 0) !== 1 ? "s" : ""} cadastrado{(stats?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <NovoClienteButton />
      </div>

      {/* Cards de inteligência */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>

        {/* Aniversariantes */}
        <div style={{ ...CARD, padding: 24 }}>
          <p style={{ ...LABEL, marginBottom: 8 }}>🎂 Aniversariantes</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)", margin: "0 0 4px", lineHeight: 1 }}>
            {stats?.aniversariantes ?? 0}
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>em {mesAtual}</p>
          {aniversariantes.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {aniversariantes.slice(0, 3).map(c => (
                <p key={c.id} style={{ fontSize: 12, color: "var(--fg-muted)", margin: "0 0 2px" }}>
                  {nomeDisplay(c.nome)}
                  {c.data_nascimento ? ` · ${new Date(c.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}` : ""}
                </p>
              ))}
              {aniversariantes.length > 3 && (
                <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "4px 0 0" }}>
                  +{aniversariantes.length - 3} mais
                </p>
              )}
            </div>
          )}
        </div>

        {/* VIPs inativos */}
        <div style={{ ...CARD, padding: 24 }}>
          <p style={{ ...LABEL, marginBottom: 8 }}>😴 Inativos há +30 dias</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: inativos.length > 0 ? "var(--warning, #f59e0b)" : "var(--fg)", margin: "0 0 4px", lineHeight: 1 }}>
            {inativos.length}
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>clientes para reconquistar</p>
          {inativos.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {inativos.slice(0, 3).map(c => (
                <p key={c.id} style={{ fontSize: 12, color: "var(--fg-muted)", margin: "0 0 2px" }}>
                  {nomeDisplay(c.nome)} · {fmt(c.total_gasto)}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Ticket médio */}
        <div style={{ ...CARD, padding: 24 }}>
          <p style={{ ...LABEL, marginBottom: 8 }}>💳 Ticket médio</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)", margin: "0 0 4px", lineHeight: 1 }}>
            {fmt(stats?.ticketMedio ?? 0)}
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>por visita por cliente</p>
          {clientes.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
                Top: {clientes[0]?.nome} · {fmt(clientes[0]?.total_gasto ?? 0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <ClientesTable clientes={clientes} />
    </div>
  );
}
