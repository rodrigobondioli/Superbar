// Skeleton do caixa operacional — lista de comandas aguardando pagamento.
export default function CaixaOperacionalLoading() {
  const pulse: React.CSSProperties = {
    background: "color-mix(in srgb, var(--border) 60%, transparent)",
    borderRadius: 6,
    animation: "pulse 1.4s ease-in-out infinite",
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            background: "color-mix(in srgb, var(--fg) 4%, transparent)",
            border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ ...pulse, height: 16, width: 80, marginBottom: 8 }} />
                <div style={{ ...pulse, height: 11, width: 100 }} />
              </div>
              <div style={{ ...pulse, height: 16, width: 60 }} />
            </div>
            {/* Total */}
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ ...pulse, height: 12, width: 60 }} />
              <div style={{ ...pulse, height: 32, width: 120, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
