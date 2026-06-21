/**
 * Header padrão do SUPERBAR — usado em TODAS as superfícies (Bartender, Caixa, Dashboard).
 * Uma única fonte de verdade para garantir consistência de altura, tipografia e badge.
 *
 * Uso:
 *   <AppHeader barNome="Aurora Bar" roleLabel="Bartender" right={<TrocarButton />} />
 */
export function AppHeader({
  barNome,
  roleLabel,
  right,
}: {
  barNome: string;
  /** Label do papel/superfície — ex: "Bartender", "Caixa", "Dono" */
  roleLabel: string;
  /** Slot direito opcional: botões, nome do operador, alertas etc. */
  right?: React.ReactNode;
}) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", height: 52, flexShrink: 0,
      borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
    }}>
      {/* Esquerda: nome do bar + badge de papel */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--fg)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {barNome}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: "3px 9px", borderRadius: 4,
          background: "color-mix(in srgb, var(--accent) 30%, transparent)",
          color: "var(--accent-bright)",
          letterSpacing: "0.06em", textTransform: "uppercase",
          flexShrink: 0,
        }}>
          {roleLabel}
        </span>
      </div>

      {/* Direita */}
      {right && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {right}
        </div>
      )}
    </header>
  );
}
