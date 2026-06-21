// Skeleton do garçom — iPad em pico de serviço não pode ver tela em branco.
export default function GarcomLoading() {
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

      <div style={{ padding: 16 }}>
        {/* Grid de mesas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              border: "1px solid var(--border)", borderRadius: 8, padding: 16,
              aspectRatio: "1 / 0.9",
            }}>
              <div style={{ ...pulse, height: 14, width: "60%", marginBottom: 10 }} />
              <div style={{ ...pulse, height: 11, width: "40%", marginBottom: 8 }} />
              <div style={{ ...pulse, height: 11, width: "50%" }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
