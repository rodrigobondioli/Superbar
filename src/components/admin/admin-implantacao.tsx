import type { BarResumo } from "@/lib/admin/queries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DimBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: "var(--fg-subtle)", width: 68, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color, fontWeight: 600, width: 32, textAlign: "right", flexShrink: 0 }}>
        {pct}%
      </span>
    </div>
  );
}

function dimColor(pct: number): string {
  if (pct >= 80) return "var(--ok)";
  if (pct >= 50) return "var(--warn)";
  return "var(--danger)";
}

// Dimensões: Pedidos / Cardápio / Custos / Equipe → score 0-100
function implantacaoPct(bar: BarResumo): {
  pedidos: number;
  cardapio: number;
  custos: number;
  equipe: number;
  total: number;
} {
  // Pedidos: pagamentos confirmados (uso real do sistema)
  const pedidos = bar.ticket_count_total === 0 ? 0
    : bar.ticket_count_total < 5  ? 40
    : bar.ticket_count_total < 20 ? 70
    : 100;

  // Cardápio: binário — tem produto cadastrado ou não
  const cardapio = bar.total_produtos > 0 ? 100 : 0;

  // Custos: direto da cobertura
  const custos = bar.cobertura_custo_pct;

  // Equipe: 0 membro = 0%, 1 = 50%, 2+ = 100%
  const equipe = bar.total_membros === 0 ? 0
    : bar.total_membros === 1 ? 50
    : 100;

  const total = Math.round((pedidos + cardapio + custos + equipe) / 4);

  return { pedidos, cardapio, custos, equipe, total };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AdminImplantacao({ bares }: { bares: BarResumo[] }) {
  // Ordenar por implantação total desc
  const sorted = [...bares].sort((a, b) => implantacaoPct(b).total - implantacaoPct(a).total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.map((bar) => {
        const dim = implantacaoPct(bar);
        const totalColor = dimColor(dim.total);

        return (
          <a key={bar.id} href={`/admin/${bar.id}`} style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "200px 1fr auto",
              gap: 24,
              alignItems: "center",
            }}>
              {/* Bar info */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                  background: `hsl(${hashCode(bar.id) % 360}, 40%, 18%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: `hsl(${hashCode(bar.id) % 360}, 60%, 70%)`,
                }}>
                  {bar.nome.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bar.nome}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: 0 }}>
                    {bar.implantacaoScore === "completo" ? "Completo" : bar.implantacaoScore === "parcial" ? "Em implantação" : "Não implantado"}
                  </p>
                </div>
              </div>

              {/* Dimensões */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <DimBar label="Pedidos"  pct={dim.pedidos}  color={dimColor(dim.pedidos)} />
                <DimBar label="Cardápio" pct={dim.cardapio} color={dimColor(dim.cardapio)} />
                <DimBar label="Custos"   pct={dim.custos}   color={dimColor(dim.custos)} />
                <DimBar label="Equipe"   pct={dim.equipe}   color={dimColor(dim.equipe)} />
              </div>

              {/* Score total */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: totalColor, margin: 0, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {dim.total}
                </p>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "2px 0 0" }}>
                  /100
                </p>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}
