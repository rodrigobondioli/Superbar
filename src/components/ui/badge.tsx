import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral" | "indigo";

export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
  /** Ponto colorido à esquerda — padrão "status badge" do Figma (bg + dot + texto colorido).
   *  Opcional pra não conflitar com badges que já trazem ícone próprio (ex.: TrendBadge). */
  dot?: boolean;
}

// Fundo tingido + texto colorido (usado por CategoriaBadge/TrendBadge). O ponto
// colorido do Figma vem ao ligar `dot`.
const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-ok-bg text-ok",
  error: "bg-danger-bg text-danger",
  warning: "bg-warn-bg text-warn",
  info: "bg-ok-bg text-ok",
  neutral: "bg-[color-mix(in_srgb,var(--fg)_8%,transparent)] text-fg-muted",
  indigo: "bg-[color-mix(in_srgb,var(--accent-bright)_16%,transparent)] text-accent-bright",
};

const dotClasses: Record<BadgeVariant, string> = {
  success: "bg-ok",
  error: "bg-danger",
  warning: "bg-warn",
  info: "bg-ok",
  neutral: "bg-fg-muted",
  indigo: "bg-accent-bright",
};

export function Badge({ className, variant = "neutral", dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      // Figma DS (Components/Base → Badge): raio pill. Padding/texto mantidos pra não crescer os badges atuais.
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("size-2 shrink-0 rounded-full", dotClasses[variant])} aria-hidden />}
      {children}
    </span>
  );
}
