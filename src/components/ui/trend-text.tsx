interface TrendTextProps {
  percent: number | null;
  comparativoLabel?: string;
  colored?: boolean;
  invert?: boolean;
}

export function TrendText({ percent, comparativoLabel = "vs turno anterior", invert }: TrendTextProps) {
  if (percent === null) {
    return (
      <span style={{ fontSize: "12px", color: "var(--fg-subtle)", marginTop: "6px", display: "inline-block" }}>
        Sem comparação · {comparativoLabel}
      </span>
    );
  }

  const isPositive = percent >= 0;
  const isGood = invert ? !isPositive : isPositive;
  const arrow = isPositive ? "↑" : "↓";
  const arrowColor = isGood ? "var(--ok)" : "var(--danger)";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      fontSize: "12px", color: "var(--fg-subtle)", fontWeight: 500, marginTop: "6px",
    }}>
      <span style={{ color: arrowColor }}>{arrow}</span>
      {Math.abs(percent).toFixed(1)}% {comparativoLabel}
    </span>
  );
}
