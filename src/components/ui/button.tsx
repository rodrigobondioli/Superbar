import * as React from "react";
import { cn } from "@/lib/utils";

/*
  SUPERBAR — Padrão de botões
  ──────────────────────────────────────────────────────────
  primary      → fundo accent cheio (#FF3500), texto preto
  secondary    → transparente + borda, texto claro
  ghost        → sem fundo nem borda, texto muted
  danger       → fundo danger (#EF4444), texto branco
  op           → operacional iPad — accent, touch target ≥52px
  op-secondary → operacional iPad — transparente + borda, ≥52px
*/

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "op" | "op-secondary";
type ButtonSize    = "sm" | "default" | "lg";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-[background,opacity,transform] duration-150 " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 " +
  "select-none whitespace-nowrap [-webkit-tap-highlight-color:transparent]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-lg bg-accent text-accent-fg hover:brightness-105",
  secondary:
    "rounded-lg border border-border-strong bg-transparent text-fg " +
    "hover:bg-bg-hover hover:border-fg-subtle",
  ghost:
    "rounded-lg bg-transparent text-fg-muted " +
    "hover:bg-bg-hover hover:text-fg",
  danger:
    "rounded-lg bg-danger text-white hover:brightness-105",
  op:
    "rounded-[10px] bg-accent text-accent-fg hover:brightness-105",
  "op-secondary":
    "rounded-[10px] border border-border bg-transparent text-fg-muted " +
    "hover:bg-bg-hover hover:border-fg-subtle",
};

const sizes: Record<ButtonSize, string> = {
  sm:      "h-7 px-3 text-xs",
  default: "h-9 px-[18px] text-[13px]",
  lg:      "h-11 px-6 text-[15px]",
};

/* Variantes op: min-height para touch iPad (≥52px) */
const opSizes: Record<ButtonSize, string> = {
  sm:      "min-h-10 px-4 text-sm",
  default: "min-h-[52px] px-5 text-[15px]",
  lg:      "min-h-[56px] px-6 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const isOp = variant === "op" || variant === "op-secondary";
    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          isOp ? opSizes[size] : sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
