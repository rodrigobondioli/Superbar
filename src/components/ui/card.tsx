import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "hero" | "glass";

export interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "rounded-md border border-border bg-bg-elevated p-6 transition-[border-color] duration-150 hover:border-border-strong",
  hero: "bg-bg-elevated rounded-lg border border-border px-12 py-10",
  glass: "rounded-md border border-border bg-bg-elevated",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div ref={ref} className={cn(variantClasses[variant], className)} {...props} />
  )
);
Card.displayName = "Card";
