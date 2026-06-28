import * as React from "react";
import { cn } from "@/lib/utils";

/*
  SUPERBAR — Padrão de botões
  ─────────────────────────────────────────────
  primary   → fundo amber cheio, texto preto
  secondary → fundo transparente, borda sutil, texto claro
  ghost     → sem fundo nem borda
  op        → operacional (iPad, altura mínima maior)
*/

type ButtonVariant = "primary" | "secondary" | "ghost" | "op";
type ButtonSize    = "sm" | "default" | "lg";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition duration-150 " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 " +
  "select-none whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-lg bg-accent text-accent-fg font-semibold " +
    "hover:brightness-105",
  secondary:
    "rounded-lg border border-border-strong bg-transparent text-fg " +
    "hover:bg-bg-hover hover:border-fg-subtle",
  ghost:
    "rounded-lg bg-transparent text-fg-muted " +
    "hover:bg-bg-hover hover:text-fg",
  op:
    "rounded-lg bg-accent text-accent-fg font-semibold " +
    "hover:brightness-105",
};

const sizes: Record<ButtonSize, string> = {
  sm:      "h-7 px-3 text-xs",
  default: "h-9 px-[18px] text-[13px]",
  lg:      "h-11 px-6 text-[15px]",
};

const opSizes: Record<ButtonSize, string> = {
  sm:      "min-h-10 px-4 text-sm",
  default: "min-h-12 px-5 text-base",
  lg:      "min-h-14 px-6 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        base,
        variants[variant],
        variant === "op" ? opSizes[size] : sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
