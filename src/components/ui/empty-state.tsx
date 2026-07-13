import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Quando true, centraliza verticalmente no espaço disponível (padrão: true) */
  fill?: boolean;
  /** Largura máxima da descrição em px (padrão: 460 — folga p/ ~2 linhas). */
  descriptionMaxWidth?: number;
}

/**
 * Estado vazio padronizado — igual em todas as telas.
 * Usa `fill` para centralizar verticalmente na área de conteúdo.
 */
export function EmptyState({ icon, title, description, action, fill = true, descriptionMaxWidth = 460 }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "64px 24px",
        // Cresce pra ocupar a altura disponível quando o pai é flex-col (centraliza
        // de verdade, H+V); minHeight é o piso quando não há espaço pra crescer.
        flex: fill ? "1 1 auto" : undefined,
        minHeight: fill ? "52vh" : undefined,
        width: "100%",
      }}
    >
      <p style={{ fontSize: 36, margin: "0 0 16px", lineHeight: 1 }}>{icon}</p>
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
            maxWidth: descriptionMaxWidth,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Botão dentro de EmptyState. Renderiza EXATAMENTE o DS `<Button>` (pill, h-10,
 * peso 500) — mesmas classes de `components/ui/button`. Nunca inventar estilo
 * próprio aqui: se o Button mudar, isto acompanha.
 */
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
  const cls =
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium " +
    "no-underline whitespace-nowrap transition-[background,filter,border-color] duration-150 active:scale-[0.97] " +
    (variant === "primary"
      ? "bg-accent text-accent-fg hover:brightness-105"
      : "border border-border-strong bg-bg-card text-fg hover:bg-bg-hover hover:border-fg-subtle");

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
