import type { BarResumo, AdminStats } from "@/lib/admin/queries";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function MetricBlock({
  label,
  value,
  sub,
  color,
  note,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  note?: string;
}) {
  return (
    <div style={{
      background: "var(--bg-elevated)",
      borderRadius: 8,
      padding: "22px 24px",
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 800, fontFamily: "var(--font-mono)", color: color ?? "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>{sub}</p>}
      {note && <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "6px 0 0", fontStyle: "italic" }}>{note}</p>}
    </div>
  );
}

export function AdminFinanceiro({ bares, stats }: { bares: BarResumo[]; stats: AdminStats }) {
  const trialMrrPotencial = bares
    .filter((b) => b.assinatura_status === "trial" && b.plano_preco)
    .reduce((acc, b) => acc + (b.plano_preco ?? 0), 0);

  const inadimplenteValor = bares
    .filter((b) => b.assinatura_status === "inadimplente" && b.plano_preco)
    .reduce((acc, b) => acc + (b.plano_preco ?? 0), 0);

  const totalPotencial = stats.mrr + trialMrrPotencial;

  // ARR
  const arr = stats.mrr * 12;

  // Distribuição por plano
  const porPlano = new Map<string, { count: number; mrr: number }>();
  for (const b of bares) {
    if (b.assinatura_status === "ativa" && b.plano_nome && b.plano_preco) {
      const cur = porPlano.get(b.plano_nome) ?? { count: 0, mrr: 0 };
      porPlano.set(b.plano_nome, { count: cur.count + 1, mrr: cur.mrr + b.plano_preco });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Métricas principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        <MetricBlock
          label="MRR"
          value={currency.format(stats.mrr)}
          sub={`${stats.bares_saudaveis + stats.bares_atencao} ativas`}
          color="var(--accent-bright)"
        />
        <MetricBlock
          label="ARR (estimado)"
          value={currency.format(arr)}
          sub="MRR × 12"
        />
        <MetricBlock
          label="Potencial MRR"
          value={currency.format(totalPotencial)}
          sub={`+${currency.format(trialMrrPotencial)} se trials converterem`}
          color={trialMrrPotencial > 0 ? "#3b82f6" : "var(--fg-muted)"}
        />
        <MetricBlock
          label="Em risco"
          value={currency.format(inadimplenteValor)}
          sub={`${stats.bares_inadimplentes} inadimplente${stats.bares_inadimplentes !== 1 ? "s" : ""}`}
          color={inadimplenteValor > 0 ? "#ef4444" : "var(--fg-muted)"}
          note={inadimplenteValor > 0 ? "Cobrar ou suspender" : undefined}
        />
      </div>

      {/* Distribuição por plano */}
      {porPlano.size > 0 && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 12px" }}>
            Distribuição por plano
          </p>
          <div style={{
            background: "var(--bg-elevated)",
            borderRadius: 8,
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {(["Plano", "Clientes", "MRR", "% do total"] as const).map((h, i) => (
                    <th key={h} style={{ padding: "8px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-subtle)", textAlign: i >= 1 ? "right" : "left", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...porPlano.entries()]
                  .sort(([, a], [, b]) => b.mrr - a.mrr)
                  .map(([nome, data]) => (
                    <tr key={nome}>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--fg)", fontWeight: 500 }}>{nome}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--fg-muted)", textAlign: "right", fontFamily: "var(--font-mono)" }}>{data.count}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--fg)", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{currency.format(data.mrr)}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--fg-muted)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                        {stats.mrr > 0 ? `${Math.round((data.mrr / stats.mrr) * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status de todos os bares */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 12px" }}>
          Status de assinaturas
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {[
            { label: "Ativas",         count: stats.bares_saudaveis + stats.bares_atencao, color: "#22c55e" },
            { label: "Trial",          count: bares.filter(b => b.assinatura_status === "trial").length, color: "#3b82f6" },
            { label: "Inadimplentes",  count: stats.bares_inadimplentes, color: "#ef4444" },
            { label: "Sem assinatura", count: bares.filter(b => !b.assinatura_status).length, color: "var(--fg-subtle)" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ background: "var(--bg-elevated)", borderRadius: 6, padding: "12px 16px" }}>
              <p style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: count > 0 ? color : "var(--fg-subtle)", margin: "0 0 2px", letterSpacing: "-0.03em" }}>{count}</p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
