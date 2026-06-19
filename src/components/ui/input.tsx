import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-bg-inset px-4 py-3 font-sans text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-fg-subtle",
        "focus:border-border-strong focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--ring)_25%,transparent)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
