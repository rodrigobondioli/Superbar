import type { ActionResult } from "@/lib/settings/actions";

// Estilos e feedback compartilhados pelas seções de configuração.
// NOTA: `inp` usa var(--bg-inset), token que o DESIGN.md marca como removido
// (deveria ser --bg-hover). Mantido como estava para não mudar o visual nesta
// extração — trocar num passo próprio, de propósito.

export const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: "var(--fg-muted)",
  display: "block", marginBottom: 8,
};

export const inp: React.CSSProperties = {
  width: "100%", background: "var(--bg-inset)",
  border: "1px solid var(--border)", borderRadius: 8,
  padding: "12px", fontSize: 14, color: "var(--fg)",
  outline: "none",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
  boxSizing: "border-box" as React.CSSProperties["boxSizing"],
  transition: "border-color 150ms",
};

export const inpReadonly: React.CSSProperties = {
  ...inp,
  color: "var(--fg-muted)",
  cursor: "not-allowed",
  opacity: 0.7,
};

export function Feedback({ result }: { result: ActionResult }) {
  if (!result) return null;
  const isOk = "ok" in result && result.ok;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, fontSize: 13,
      background: isOk ? "var(--ok-bg)" : "var(--danger-bg)",
      border: `1px solid color-mix(in srgb, ${isOk ? "var(--ok)" : "var(--danger)"} 30%, transparent)`,
      color: isOk ? "var(--ok)" : "var(--danger)",
    }}>
      {"error" in result ? result.error : "Salvo com sucesso."}
    </div>
  );
}
