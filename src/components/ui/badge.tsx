import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral" | "indigo";

export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-ok-bg text-ok",
  error: "bg-danger-bg text-danger",
  warning: "bg-warn-bg text-warn",
  info: "bg-ok-bg text-ok",
  neutral: "bg-[color-mix(in_srgb,var(--fg)_8%,transparent)] text-fg-muted",
  indigo: "bg-[color-mix(in_srgb,var(--accent-bright)_16%,transparent)] text-accent-bright",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
