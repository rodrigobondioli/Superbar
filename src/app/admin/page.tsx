import Link from "next/link";
import { getAdminBares } from "@/lib/admin/queries";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", maximumFractionDigits: 0,
});

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const cardLabel: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", margin: 0 };
const cardMetric: React.CSSProperties = { fontSize: 32, fontWeight: 700, color: "var(--fg)", lineHeight: 1, margin: 0, fontVariantNumeric: "tabular-nums" };

function Cifrao() {
  return <span style={{ fontSize: "0.5em", fontWeight: 600, color: "var(--fg-muted)", marginRight: "0.16em" }}>R$</span>;
}

export default async function AdminPage() {
  const { bares } = await getAdminBares();

  // ── Métricas de receita/retenção (dado real da tabela assinaturas) ──
  const pagantes = bares.filter(b => b.assinatura_status === "ativa");
  const trials = bares.filter(b => b.assinatura_status === "trial");
  const inadimplentes = bares.filter(b => b.assinatura_status === "inadimplente");
  const cancelados = bares.filter(b => b.assinatura_status === "cancelada");

  const mrr = pagantes.reduce((s, b) => s + (b.plano_preco ?? 0), 0);

  // Receita em risco: pagante que parou de usar (>7 dias) OU inadimplente.
  const emRisco = bares
    .filter(b =>
      (b.assinatura_status === "ativa" && (b.dias_sem_uso ?? 0) > 7) ||
      b.assinatura_status === "inadimplente"
    )
    .sort((a, b) => (b.plano_preco ?? 0) - (a.plano_preco ?? 0));
  const mrrEmRisco = emRisco.reduce((s, b) => s + (b.plano_preco ?? 0), 0);

  const motivoRisco = (b: (typeof bares)[number]) => {
    if (b.assinatura_status === "inadimplente") return { txt: "Inadimplente — pagamento em atraso", cor: "var(--danger)" };
    const d = b.dias_sem_uso ?? 0;
    return { txt: `${d} dias sem abrir turno`, cor: "var(--warn)" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Visão geral</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {bares.length} {bares.length === 1 ? "cliente" : "clientes"} na plataforma
          </p>
        </div>
        <time style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </time>
      </div>

      {/* KPIs de receita */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 24 }}>

        {/* MRR */}
        <div style={card}>
          <p style={cardLabel}>MRR (receita recorrente)</p>
          <p style={{ ...cardMetric, color: "var(--accent)" }}><Cifrao />{mrr.toLocaleString("pt-BR")}</p>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {pagantes.length} {pagantes.length === 1 ? "assinatura ativa" : "assinaturas ativas"}
          </p>
        </div>

        {/* Clientes */}
        <div style={card}>
          <p style={cardLabel}>Clientes</p>
          <p style={cardMetric}>{bares.length}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: "var(--ok)" }}>● {pagantes.length} pagantes</span>
            {trials.length > 0 && <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>● {trials.length} em trial</span>}
            {inadimplentes.length > 0 && <span style={{ fontSize: 13, color: "var(--danger)" }}>● {inadimplentes.length} inadimplente{inadimplentes.length !== 1 ? "s" : ""}</span>}
            {cancelados.length > 0 && <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>● {cancelados.length} cancelado{cancelados.length !== 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* Receita em risco */}
        <div style={card}>
          <p style={cardLabel}>Receita em risco</p>
          <p style={{ ...cardMetric, color: mrrEmRisco > 0 ? "var(--danger)" : "var(--ok)" }}><Cifrao />{mrrEmRisco.toLocaleString("pt-BR")}</p>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {emRisco.length === 0 ? "nenhuma conta em risco" : `${emRisco.length} conta${emRisco.length !== 1 ? "s" : ""} (inadimplente ou parada)`}
          </p>
        </div>
      </div>

      {/* Lista: receita em risco */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, paddingTop: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Receita em risco</h2>
          <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>pagantes que pararam de usar ou estão inadimplentes</span>
        </div>

        {emRisco.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--fg-muted)", padding: "24px 0" }}>
            Nenhum cliente pagante em risco. Toda a receita recorrente está ativa e sendo usada. ✅
          </p>
        ) : (
          <div>
            {emRisco.map((b, i) => {
              const m = motivoRisco(b);
              return (
                <Link key={b.id} href={`/admin/${b.id}`} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center",
                  padding: "16px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-strong)",
                  textDecoration: "none",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.nome}
                      {(b.cidade || b.estado) && (
                        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--fg-subtle)", marginLeft: 8 }}>
                          {[b.cidade, b.estado].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 13, color: m.cor, display: "block", marginTop: 2 }}>{m.txt}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", fontVariantNumeric: "tabular-nums", textAlign: "right", whiteSpace: "nowrap" }}>
                    {b.plano_preco ? `${currency.format(b.plano_preco)}/mês` : "—"}
                  </span>
                  <span style={{ color: "var(--accent)", fontSize: 18 }}>→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
