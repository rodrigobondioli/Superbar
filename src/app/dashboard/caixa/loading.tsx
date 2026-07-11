// Skeleton do caixa no dashboard — estrutura igual à página real.
export default function DashboardCaixaLoading() {
  const pulse: React.CSSProperties = {
    background: "color-mix(in srgb, var(--border) 60%, transparent)",
    borderRadius: 8,
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

      <div className="py-6 lg:py-8">
        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ ...pulse, height: 11, width: 90, marginBottom: 10 }} />
            <div style={{ ...pulse, height: 26, width: 80, marginBottom: 8 }} />
            <div style={{ ...pulse, height: 13, width: 220 }} />
          </div>
          <div style={{
            background: "color-mix(in srgb, var(--fg) 4%, transparent)",
            borderRadius: 8, padding: "10px 16px",
          }}>
            <div style={{ ...pulse, height: 11, width: 60, marginBottom: 8 }} />
            <div style={{ ...pulse, height: 32, width: 40 }} />
          </div>
        </div>

        {/* Comanda cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              borderRadius: 8, overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ ...pulse, height: 16, width: 70, marginBottom: 8 }} />
                  <div style={{ ...pulse, height: 11, width: 90 }} />
                </div>
              </div>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                    <div style={{ ...pulse, height: 12, width: "55%" }} />
                    <div style={{ ...pulse, height: 12, width: "18%" }} />
                  </div>
                ))}
              </div>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ ...pulse, height: 13, width: 50 }} />
                <div style={{ ...pulse, height: 28, width: 110, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
