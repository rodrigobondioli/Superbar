import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "op";
type ButtonSize = "default" | "lg";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "rounded-md bg-accent px-[18px] py-[10px] font-medium text-accent-fg hover:brightness-110",
  secondary: "rounded-md border border-border-strong bg-transparent px-[18px] py-[10px] text-fg hover:border-fg-muted",
  ghost: "px-[14px] py-[10px] text-fg-muted hover:text-fg",
  op: "min-h-12 rounded-md bg-accent font-semibold text-accent-fg hover:brightness-110",
};

const opSizeClasses: Record<ButtonSize, string> = {
  default: "text-base",
  lg: "min-h-14 px-6 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        variant === "op" && opSizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
