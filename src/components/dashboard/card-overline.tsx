import type { CSSProperties, ReactNode } from "react";

export function CardOverline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const base: CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "var(--fg-subtle)",
    display: "block",
    marginBottom: 10,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };
  return <span style={{ ...base, ...style }}>{children}</span>;
}
