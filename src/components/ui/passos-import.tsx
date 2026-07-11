import type { ReactNode } from "react";

/** Lista numerada "como funciona" — usada nas telas de importação (cardápio, NF-e). */
export function PassosImport({ passos }: { passos: ReactNode[] }) {
  return (
    <ol style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0, padding: 0, listStyle: "none" }}>
      {passos.map((p, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
            background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)",
            fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
          }}>{i + 1}</span>
          <span style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5 }}>{p}</span>
        </li>
      ))}
    </ol>
  );
}
