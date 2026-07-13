import type { CSSProperties } from "react";

/* ═══════════════════════════════════════════════════════════
   SUPERBAR — UI Tokens (CSSProperties)
   Fonte de verdade para inline styles.
   Para Tailwind, use as classes .t-* definidas em globals.css.
   ═══════════════════════════════════════════════════════════ */

/* ── Escala tipográfica ── */
export const T_DISPLAY: CSSProperties = {
  fontSize: 32, fontWeight: 800, lineHeight: 1.1,
  letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums",
};
export const T_TITLE_LG: CSSProperties = {
  fontSize: 24, fontWeight: 700, lineHeight: 1.15,
  letterSpacing: "-0.025em", color: "var(--fg)",
};
export const T_TITLE: CSSProperties = {
  fontSize: 20, fontWeight: 700, lineHeight: 1.2,
  letterSpacing: "-0.02em", color: "var(--fg)",
};
export const T_HEADING: CSSProperties = {
  fontSize: 16, fontWeight: 600, lineHeight: 1.3,
  letterSpacing: "-0.015em", color: "var(--fg)",
};
export const T_BODY:    CSSProperties = { fontSize: 14, fontWeight: 400, lineHeight: 1.55, color: "var(--fg)" };
export const T_BODY_SM: CSSProperties = { fontSize: 13, fontWeight: 400, lineHeight: 1.5,  color: "var(--fg-muted)" };
export const T_SMALL:   CSSProperties = { fontSize: 12, fontWeight: 400, lineHeight: 1.4,  color: "var(--fg-muted)" };
export const T_CAPTION: CSSProperties = { fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: "var(--fg-subtle)" };
export const T_OVERLINE: CSSProperties = {
  fontSize: 10, fontWeight: 500, lineHeight: 1,
  textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)",
};

/* ── Aliases mantidos para compatibilidade ── */
export const H1: CSSProperties = { ...T_TITLE, margin: 0 };
export const SUBTITLE: CSSProperties = { ...T_BODY_SM, marginTop: 4 };
export const LABEL: CSSProperties = { ...T_OVERLINE, margin: 0 };

/* ── Card ── */
export const CARD: CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "20px 24px",
};

/* ── Botões ── */
// Padrão SUPERBAR: botão é pill (rounded-full), ALTURA FIXA 40px (h-10) — ESPELHA
// EXATAMENTE o componente <Button> default (h-10 / px-6 / 15px / gap-8 / inline-flex
// centrado). height fixo (não padding vertical) pra não haver diferença de ~2px
// entre botão na mão e DS. Se mudar o <Button>, mudar aqui. Ver DESIGN.md § Botões.
const BTN_BASE: CSSProperties = {
  height: 40,
  padding: "0 24px",
  borderRadius: "var(--r-pill)",
  fontSize: 15,
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxSizing: "border-box" as CSSProperties["boxSizing"],
};
export const BTN_PRIMARY: CSSProperties = {
  ...BTN_BASE,
  background: "var(--accent)",
  color: "var(--accent-fg)",
  border: "none",
};
export const BTN_SECONDARY: CSSProperties = {
  ...BTN_BASE,
  background: "transparent",
  color: "var(--fg)",
  border: "1px solid var(--border-strong)",
};
export const BTN_ICON: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: "var(--radius-md)",
  color: "var(--fg-subtle)",
};

/* ── Input ── */
export const INPUT: CSSProperties = {
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--fg)",
  outline: "none",
  colorScheme: "dark" as CSSProperties["colorScheme"],
  boxSizing: "border-box" as CSSProperties["boxSizing"],
  width: "100%",
};

/* ── Page layout ── */
export const PAGE_PAD: CSSProperties        = { padding: "28px 32px 40px" };
export const PAGE_HEADER_MB: CSSProperties  = { marginBottom: 28 };

/* ── Legacy color aliases ── */
export const ACCENT   = "var(--accent)";
export const BG       = "var(--bg)";
export const C_WHITE  = "var(--fg)";
export const C_MUTED  = "var(--fg-muted)";
export const C_DIM    = "var(--fg-subtle)";
export const C_LABEL  = "var(--fg-subtle)";
