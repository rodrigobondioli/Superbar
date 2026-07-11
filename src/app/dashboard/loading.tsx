// Skeleton exibido enquanto o dashboard carrega (9 queries em paralelo).
// Evita blank screen no cold start ou latência alta.
export default function DashboardLoading() {
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

      <div className="py-6 lg:py-10" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...pulse, height: 14, width: 120, marginBottom: 10 }} />
          <div style={{ ...pulse, height: 28, width: 260 }} />
        </div>

        {/* KPI cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              borderRadius: 8, padding: 20,
            }}>
              <div style={{ ...pulse, height: 12, width: 80, marginBottom: 14 }} />
              <div style={{ ...pulse, height: 36, width: 140, marginBottom: 8 }} />
              <div style={{ ...pulse, height: 12, width: 100 }} />
            </div>
          ))}
        </div>

        {/* Wide card (chart placeholder) */}
        <div style={{
          background: "color-mix(in srgb, var(--fg) 4%, transparent)",
          borderRadius: 8, padding: 24, marginBottom: 24,
        }}>
          <div style={{ ...pulse, height: 14, width: 160, marginBottom: 20 }} />
          <div style={{ ...pulse, height: 160, width: "100%" }} />
        </div>

        {/* Two-column row */}
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              borderRadius: 8, padding: 20,
            }}>
              <div style={{ ...pulse, height: 14, width: 120, marginBottom: 16 }} />
              {[1, 2, 3, 4].map(j => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ ...pulse, height: 12, width: "55%" }} />
                  <div style={{ ...pulse, height: 12, width: "25%" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
