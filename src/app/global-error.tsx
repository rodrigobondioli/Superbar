"use client";

// Boundary de último recurso — pega erro no próprio layout raiz (quando nem o
// app chrome renderiza). Precisa trazer <html>/<body> próprios.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#111113", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center",
        }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Algo deu errado</p>
          <p style={{ fontSize: 14, color: "#898989", maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
            Ocorreu um erro inesperado. Tente de novo ou recarregue a página.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 8, background: "#FF3500", color: "#000",
              border: "none", borderRadius: 9999, padding: "10px 24px",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
