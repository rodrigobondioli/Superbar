import * as React from "react";
import { cn } from "@/lib/utils";

/*
  SUPERBAR — Chip (Figma DS · Components/Base → Chip)
  ──────────────────────────────────────────────────
  Default → bg/surface (bg-card) + border/default, texto muted
  Active  → brand/primary (accent) + texto on-brand (accent-fg)
  Pill · px16/py8 · Inter SemiBold 13px
*/

export interface ChipProps extends React.ComponentPropsWithoutRef<"button"> {
  active?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2 text-[13px] font-semibold " +
          "transition-[background,color,border-color] duration-150 [-webkit-tap-highlight-color:transparent] " +
          "disabled:pointer-events-none disabled:opacity-40",
        // Ativo e inativo têm 1px de borda → mesma caixa/altura (sem "pulo" de tamanho).
        // Inativo é transparente (pega o fundo do container) — divergência consciente do
        // Figma (que usa bg/surface), decidida com o Rodrigo pra o chip "vazar" no fundo.
        active
          ? "border border-accent bg-accent text-accent-fg"
          : "border border-border-strong bg-transparent text-fg-muted hover:border-fg-subtle hover:text-fg",
        className
      )}
      {...props}
    />
  )
);
Chip.displayName = "Chip";
