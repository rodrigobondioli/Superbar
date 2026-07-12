// Skeleton genérico de página (header + toolbar + linhas).
// Usado por rotas de lista/tabela (cardápio, estoque, relatórios, admin…) que
// não têm um skeleton próprio. Evita blank screen no cold start / latência alta.
// O home do dashboard tem skeleton próprio (grade de KPI) — este é pro resto.
//
// A11y: o pulse é desligado sob prefers-reduced-motion.
export default function PageSkeleton() {
  const pulse: React.CSSProperties = {
    background: "color-mix(in srgb, var(--border) 60%, transparent)",
    borderRadius: 8,
    animation: "sb-skel-pulse 1.4s ease-in-out infinite",
  };
  const card: React.CSSProperties = {
    background: "color-mix(in srgb, var(--fg) 4%, transparent)",
    borderRadius: 12,
    padding: 20,
  };

  return (
    <>
      <style>{`
        @keyframes sb-skel-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-skel] * { animation: none !important; }
        }
      `}</style>

      <div data-skel className="py-6 lg:py-10" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ ...pulse, height: 12, width: 100, marginBottom: 12 }} />
          <div style={{ ...pulse, height: 26, width: 220 }} />
        </div>

        {/* Toolbar (busca + ação) */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div style={{ ...pulse, height: 40, width: 260, maxWidth: "60%" }} />
          <div style={{ ...pulse, height: 40, width: 120 }} />
        </div>

        {/* Lista de linhas */}
        <div style={card}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 16, padding: "14px 0",
                borderBottom: i < 5 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                <div style={{ ...pulse, height: 40, width: 40, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, maxWidth: 360 }}>
                  <div style={{ ...pulse, height: 13, width: "70%", marginBottom: 8 }} />
                  <div style={{ ...pulse, height: 11, width: "40%" }} />
                </div>
              </div>
              <div style={{ ...pulse, height: 14, width: 72, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
