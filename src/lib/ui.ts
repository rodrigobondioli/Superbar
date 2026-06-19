import type { CSSProperties } from "react";

export const CARD: CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 4,
};

export const LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  margin: 0,
};

export const H1: CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "var(--fg)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "-0.01em",
  margin: 0,
};

export const SUBTITLE: CSSProperties = {
  fontSize: 14,
  color: "var(--fg-muted)",
  margin: "6px 0 0",
};

export const BTN_PRIMARY: CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-fg)",
  border: "none",
  borderRadius: 4,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const BTN_SECONDARY: CSSProperties = {
  background: "transparent",
  color: "var(--fg-muted)",
  border: "1px solid var(--border-strong)",
  borderRadius: 4,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const BTN_ICON: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 4,
  color: "var(--fg-subtle)",
};

export const INPUT: CSSProperties = {
  background: "var(--bg-inset)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--fg)",
  outline: "none",
  colorScheme: "dark" as CSSProperties["colorScheme"],
  boxSizing: "border-box" as CSSProperties["boxSizing"],
  width: "100%",
};

export const PAGE_PAD: CSSProperties = { padding: "32px 40px" };
export const PAGE_HEADER_MB: CSSProperties = { marginBottom: 32 };

// Legacy aliases for backward compat
export const ACCENT = "var(--accent)";
export const BG = "var(--bg)";
export const C_WHITE = "var(--fg)";
export const C_MUTED = "var(--fg-muted)";
export const C_DIM = "var(--fg-subtle)";
export const C_LABEL = "var(--fg-subtle)";
