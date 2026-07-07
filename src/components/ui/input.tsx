import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // Figma DS (Components/Base → Input): bg/surface, border/default, raio 12, padding 16/14.
        "w-full rounded-xl border border-border-strong bg-bg-card px-4 py-3.5 font-sans text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-fg-muted",
        // Foco = borda laranja (Figma: border 2px brand/primary). Borda accent + 1px de sombra accent
        // = 2px visuais sem reflow de layout.
        "focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
