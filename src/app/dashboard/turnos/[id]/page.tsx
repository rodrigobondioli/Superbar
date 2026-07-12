import Link from "next/link";
import { notFound } from "next/navigation";
import { getTurnoDetalhe, getComandasDoTurno } from "@/lib/dashboard/turnos";
import type { ComandaStatus } from "@/types/database";
import { currency } from "@/lib/format";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const sectionLabel: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: "var(--fg-muted)",
  margin: 0,
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "24px",
};

const statusConfig: Record<ComandaStatus, { bg: string; color: string; label: string }> = {
  aberta:                { bg: "var(--ok-bg)",                                                color: "var(--ok)",      label: "Aberta" },
  aguardando_pagamento:  { bg: "var(--warn-bg)",                                              color: "var(--warn)",    label: "Aguardando pagamento" },
  paga:                  { bg: "color-mix(in srgb, var(--fg) 8%, transparent)",              color: "var(--fg-muted)", label: "Paga" },
  cancelada:             { bg: "var(--danger-bg)",                                            color: "var(--danger)",  label: "Cancelada" },
};

export default async function TurnoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const turno = await getTurnoDetalhe(id);
  if (!turno) notFound();

  const comandas = await getComandasDoTurno(turno.id);

  const isAberto = turno.status === "aberto";

  return (
    <div className="py-6 lg:py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <Link href="/dashboard/turnos" style={{
          fontSize: "13px",
          color: "var(--fg-subtle)",
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "12px",
        }}>
          ← Turnos
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>
            Turno de {dataHora.format(new Date(turno.abertoEm))}
          </h1>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 999,
            background: isAberto ? "var(--ok-bg)" : "var(--bg-card-hi)",
            color: isAberto ? "var(--ok)" : "var(--fg-muted)",
          }}>
            {isAberto ? "Aberto" : "Fechado"}
          </span>
        </div>

        <p style={{ fontSize: "13px", color: "var(--fg-subtle)", margin: "6px 0 0" }}>
          Aberto por {turno.abertoPorNome}
          {turno.fechadoPorNome && <> · Fechado por {turno.fechadoPorNome}</>}
          {turno.fechadoEm && <> · {dataHora.format(new Date(turno.fechadoEm))}</>}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <div style={card}>
          <p style={sectionLabel}>Faturamento do turno</p>
          <p
            className="text-[22px] sm:text-[30px]"
            style={{ fontWeight: 600, color: "var(--fg)", margin: "10px 0 0", fontVariantNumeric: "tabular-nums" }}
          >
            {currency.format(turno.totalVendas)}
          </p>
        </div>
        <div style={card}>
          <p style={sectionLabel}>Comandas pagas</p>
          <p
            className="text-[22px] sm:text-[30px]"
            style={{ fontWeight: 600, color: "var(--fg)", margin: "10px 0 0" }}
          >
            {turno.totalComandas}
          </p>
        </div>
      </div>

      {/* Comandas card */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", margin: "0 0 16px" }}>
          Comandas
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
          {comandas.map((comanda, i) => {
            const cfg = statusConfig[comanda.status];
            return (
              <li key={comanda.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 8px",
                background: i % 2 === 1 ? "color-mix(in srgb, var(--fg) 2%, transparent)" : undefined,
              }}>
                <span style={{ fontSize: "14px", color: "var(--fg)" }}>
                  {comanda.identificador ?? "Sem identificação"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "13px", color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {currency.format(comanda.total)}
                  </span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: cfg.bg,
                    color: cfg.color,
                    whiteSpace: "nowrap",
                  }}>
                    {cfg.label}
                  </span>
                </div>
              </li>
            );
          })}
          {comandas.length === 0 && (
            <li style={{ fontSize: "14px", color: "var(--fg-subtle)", padding: "12px 8px" }}>
              Nenhuma comanda neste turno.
            </li>
          )}
        </ul>
      </div>

    </div>
  );
}
