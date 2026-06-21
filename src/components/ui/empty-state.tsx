import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Quando true, centraliza verticalmente no espaço disponível (padrão: true) */
  fill?: boolean;
}

/**
 * Estado vazio padronizado — igual em todas as telas.
 * Usa `fill` para centralizar verticalmente na área de conteúdo.
 */
export function EmptyState({ icon, title, description, action, fill = true }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "64px 24px",
        minHeight: fill ? "40vh" : undefined,
        width: "100%",
      }}
    >
      <p style={{ fontSize: 36, margin: "0 0 18px", lineHeight: 1 }}>{icon}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px" }}>
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-subtle)",
            margin: "0 0 24px",
            lineHeight: 1.65,
            maxWidth: 300,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/** Botão primário reutilizável dentro de EmptyState */
export function EmptyStateButton({
  onClick,
  href,
  children,
  variant = "primary",
}: {
  onClick?: () => void;
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    border: "none",
    background:
      variant === "primary"
        ? "var(--accent)"
        : "color-mix(in srgb, var(--fg) 6%, transparent)",
    color:
      variant === "primary" ? "var(--accent-fg)" : "var(--fg-muted)",
    ...(variant === "secondary" && { border: "1px solid var(--border)" }),
  };

  if (href) {
    return (
      <a href={href} style={style}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  );
}
