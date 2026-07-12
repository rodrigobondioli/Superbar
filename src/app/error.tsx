"use client";

import { useEffect } from "react";

// Boundary de erro raiz — pega qualquer exceção não tratada abaixo do layout
// e dá uma saída ("tentar de novo") em vez de tela branca/crash.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[boundary raiz]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "80vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      padding: 24, textAlign: "center",
      background: "var(--bg)", color: "var(--fg)", fontFamily: "var(--font-sans)",
    }}>
      <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Algo deu errado</p>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
        Não foi possível carregar esta tela. Tente de novo — se continuar, recarregue a página.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: 8, background: "var(--accent)", color: "var(--accent-fg)",
          border: "none", borderRadius: 9999, padding: "10px 24px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}
      >
        Tentar de novo
      </button>
    </div>
  );
}
