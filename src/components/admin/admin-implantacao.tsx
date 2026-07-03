import type { BarResumo } from "@/lib/admin/queries";

// ─── Setup: o que o fundador configura no onboarding ────────────────────────────
// Implantação = SÓ setup (cardápio, custos, equipe). Uso (pedidos) vive na Visão Geral.

const CUSTOS_OK = 90; // % de cobertura de ficha técnica para considerar "ok"

function dims(bar: BarResumo) {
  return {
    cardapio: bar.total_produtos > 0 ? 100 : 0,
    custos: bar.cobertura_custo_pct,
    equipe: bar.total_membros === 0 ? 0 : bar.total_membros === 1 ? 50 : 100,
  };
}

export function setupStatus(bar: BarResumo): { pronto: boolean; faltando: string[] } {
  const faltando: string[] = [];
  if (bar.total_produtos === 0) faltando.push("cardápio");
  if (bar.cobertura_custo_pct < CUSTOS_OK) faltando.push("custos");
  if (bar.total_membros === 0) faltando.push("equipe");
  return { pronto: faltando.length === 0, faltando };
}

// ─── Barra de dimensão ──────────────────────────────────────────────────────────

function DimBar({ label, pct, ok }: { label: string; pct: number; ok: boolean }) {
  const cor = ok ? "var(--fg-muted)" : "var(--warn)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <span style={{ fontSize: 13, color: "var(--fg-subtle)", width: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 13, color: cor, fontVariantNumeric: "tabular-nums", width: 40, textAlign: "right", flexShrink: 0 }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Lista ──────────────────────────────────────────────────────────────────────

export function AdminImplantacao({ bares }: { bares: BarResumo[] }) {
  // Pendentes (mais faltando) no topo — é pra saber pra quem ligar primeiro.
  const rows = bares
    .map((bar) => ({ bar, st: setupStatus(bar), d: dims(bar) }))
    .sort((a, b) => b.st.faltando.length - a.st.faltando.length);

  return (
    <div>
      {rows.map(({ bar, st, d }, i) => (
        <a
          key={bar.id}
          href={`/admin/${bar.id}`}
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr 200px",
            gap: 32,
            alignItems: "center",
            padding: "20px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--border-strong)",
            textDecoration: "none",
          }}
        >
          {/* Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: `hsl(${hashCode(bar.id) % 360}, 40%, 20%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600,
                color: `hsl(${hashCode(bar.id) % 360}, 55%, 72%)`,
              }}
            >
              {bar.nome.slice(0, 2).toUpperCase()}
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {bar.nome}
            </p>
          </div>

          {/* Dimensões de setup */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <DimBar label="Cardápio" pct={d.cardapio} ok={d.cardapio === 100} />
            <DimBar label="Custos"   pct={d.custos}   ok={d.custos >= CUSTOS_OK} />
            <DimBar label="Equipe"   pct={d.equipe}   ok={d.equipe >= 50} />
          </div>

          {/* Status / bloqueio */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {st.pronto ? (
              <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>Pronto pra operar</span>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--warn)" }}>
                Falta {st.faltando.join(", ")}
              </span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
