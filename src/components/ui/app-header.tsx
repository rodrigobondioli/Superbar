/**
 * Header padrão do SUPERBAR — usado em TODAS as superfícies operacionais.
 * Estrutura: logo | "SUPERBAR" / barNome + badge | [right slot]
 * Espelha o padrão do DashboardSidebar para consistência.
 */
export function AppHeader({
  barNome,
  roleLabel,
  right,
}: {
  barNome: string;
  roleLabel: string;
  right?: React.ReactNode;
}) {
  return (
    <header style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
      paddingTop: "env(safe-area-inset-top)",
      height: "calc(64px + env(safe-area-inset-top))",
      flexShrink: 0,
      background: "var(--bg)",
      borderBottom: "1px solid var(--border-strong)",
    }}>
      {/* Esquerda: logo + SUPERBAR + badge de função */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.svg"
          alt="SUPERBAR"
          style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "block" }}
        />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "0.01em", flexShrink: 0 }}>
          SUPERBAR
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          padding: "3px 10px", borderRadius: 999, flexShrink: 0,
          background: "var(--bg-card-hi)",
          color: "var(--fg-muted)",
        }}>
          {roleLabel}
        </span>
      </div>

      {/* Centro: nome do bar */}
      <span className="hidden md:block" style={{
        position: "absolute", left: "50%", transform: "translateX(-50%)",
        fontSize: 18, fontWeight: 500, color: "var(--fg)", whiteSpace: "nowrap",
      }}>
        {barNome}
      </span>

      {/* Direita */}
      {right && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {right}
        </div>
      )}
    </header>
  );
}
