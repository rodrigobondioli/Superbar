"use client";

const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface ProximaMelhorAcaoProps {
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
  quantidadeVendida: number;
  categoria: string;
  ranking?: RankingItem[];
}

interface RankingItem {
  produtoId: string;
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function RadarChart({ items }: { items: RankingItem[] }) {
  const n = items.length;
  if (n < 2) return null;

  const W = 260, H = 250;
  const cx = W / 2, cy = H / 2 + 4;
  const R = 62;
  const labelR = R + 24;

  const maxMargem = Math.max(...items.map(i => i.margemPercentual ?? 0), 1);
  const angle = (i: number) => (2 * Math.PI * i / n) - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  const ringPolygon = (scale: number) =>
    items.map((_, i) => { const p = pt(i, R * scale); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");

  const dataPoints = items.map((item, i) => {
    const pct = Math.max((item.margemPercentual ?? 0) / maxMargem, 0.06);
    return pt(i, R * pct);
  });

  const polyPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const maxIdx = items.reduce((mi, p, i, arr) =>
    (p.margemPercentual ?? 0) > (arr[mi].margemPercentual ?? 0) ? i : mi, 0);

  const textAnchor = (i: number): "start" | "end" | "middle" => {
    const x = pt(i, 1).x;
    if (x < cx - 12) return "end";
    if (x > cx + 12) return "start";
    return "middle";
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="sbRadarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Grid rings */}
      {[0.33, 0.66, 1].map((scale, ri) => (
        <polygon key={ri} points={ringPolygon(scale)}
          fill="none" stroke="#2C2C2E" strokeWidth="1" />
      ))}

      {/* Spokes */}
      {items.map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={cx.toFixed(1)} y1={cy.toFixed(1)}
          x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
          stroke="#2C2C2E" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      <polygon points={polyPoints} fill="url(#sbRadarFill)" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i}
          cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r={i === maxIdx ? "4.5" : "3"}
          fill={i === maxIdx ? "#FF6F00" : "#F59E0B"}
        />
      ))}

      {/* Labels */}
      {items.map((item, i) => {
        const lp = pt(i, labelR);
        const anchor = textAnchor(i);
        const ang = angle(i);
        // nudge bottom items down a touch
        const yShift = ang > Math.PI * 0.2 && ang < Math.PI * 0.8 ? 4 : 0;

        return (
          <g key={i}>
            <text x={lp.x.toFixed(1)} y={(lp.y + yShift - 2).toFixed(1)}
              textAnchor={anchor} fontSize="9" fill="#A1A1AA"
              fontFamily="Inter, system-ui, sans-serif">
              {truncate(item.produtoNome, 14)}
            </text>
            <text x={lp.x.toFixed(1)} y={(lp.y + yShift + 10).toFixed(1)}
              textAnchor={anchor} fontSize="11" fill="#F59E0B" fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif">
              {item.margemPercentual != null ? `${Math.round(item.margemPercentual)}%` : "—"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ProximaMelhorAcao({
  produtoNome,
  margemPercentual,
  faturamento,
  categoria,
  ranking = [],
}: ProximaMelhorAcaoProps) {
  const isSubofertado = categoria !== "star" && categoria !== "cash_cow";
  const rankingFiltrado = ranking.filter(p => p.margemPercentual !== null).slice(0, 4);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>

      {/* ── Card esquerdo — destaque principal ── */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Overline */}
        <span style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#F59E0B",
          border: "1px solid #F59E0B",
          background: "transparent",
          padding: "3px 10px",
          borderRadius: 9999,
        }}>
          Superbar AI · Bebida mais lucrativa do momento
        </span>

        {/* Nome do produto */}
        <p style={{
          fontSize: "clamp(22px, 2.4vw, 32px)",
          fontWeight: 700,
          color: "#FFFFFF",
          margin: 0,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
        }}>
          {produtoNome}
        </p>

        {/* Margem + faturamento */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#22C55E",
            border: "1px solid var(--border)",
            borderRadius: 9999,
            padding: "2px 10px",
            fontVariantNumeric: "tabular-nums",
          }}>
            {percent.format(margemPercentual ?? 0)}% margem
          </span>
          {faturamento > 0 && (
            <span style={{ fontSize: 12, color: "#A1A1AA", fontVariantNumeric: "tabular-nums" }}>
              {currency.format(faturamento)} gerado hoje
            </span>
          )}
        </div>

        {/* Razão */}
        <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
          {isSubofertado
            ? `Apareceu pouco hoje — sugerir ativamente nas próximas 2h pode mais que dobrar as vendas com zero esforço.`
            : `Já lidera em vendas. Manter no topo das sugestões é o caminho de menor esforço para crescer a receita.`}
        </p>
      </div>

      {/* ── Card direito — radar de alta margem ── */}
      {rankingFiltrado.length > 1 && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "20px 20px 16px",
          display: "flex",
          flexDirection: "column",
          width: 300,
        }}>
          <p style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#A1A1AA",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            margin: "0 0 8px",
          }}>
            Outros de alta margem
          </p>

          <RadarChart items={rankingFiltrado} />
        </div>
      )}
    </div>
  );
}
