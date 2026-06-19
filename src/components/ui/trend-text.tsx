interface TrendTextProps {
  percent: number | null;
  comparativoLabel?: string;
  colored?: boolean;
  invert?: boolean;
}

export function TrendText({ percent, comparativoLabel = "vs turno anterior" }: TrendTextProps) {
  if (percent === null) {
    return (
      <span style={{ fontSize: "12px", color: "var(--fg-subtle)", marginTop: "6px", display: "inline-block" }}>
        Sem comparação · {comparativoLabel}
      </span>
    );
  }

  const isPositive = percent >= 0;
  const arrow = isPositive ? "↑" : "↓";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      fontSize: "12px", color: "var(--fg-subtle)", fontWeight: 500, marginTop: "6px",
    }}>
      {arrow} {Math.abs(percent).toFixed(1)}% {comparativoLabel}
    </span>
  );
}
