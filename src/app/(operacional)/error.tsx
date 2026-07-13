"use client";

import { useEffect } from "react";

// Operacional (bartender/caixa/garçom) — não pode ficar preso no pico.
export default function OperacionalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("[boundary operacional]", error); }, [error]);

  return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center",
      background: "var(--bg)", color: "var(--fg)", fontFamily: "var(--font-sans)",
    }}>
      <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Deu um problema aqui</p>
      <p style={{ fontSize: 15, color: "var(--fg-muted)", maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
        Toque no botão abaixo. Se não voltar, recarregue a tela — nenhuma comanda é perdida.
      </p>
      <button
        onClick={reset}
        style={{ marginTop: 8, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: "var(--r-pill)", padding: "14px 28px", fontSize: 16, fontWeight: 600, cursor: "pointer", minHeight: 52 }}
      >
        Tentar de novo
      </button>
    </div>
  );
}
