"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("[boundary dashboard]", error); }, [error]);

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center",
    }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Não foi possível carregar</p>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
        Tivemos um problema ao buscar seus dados. Tente de novo.
      </p>
      <button
        onClick={reset}
        style={{ marginTop: 8, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 9999, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
      >
        Tentar de novo
      </button>
    </div>
  );
}
