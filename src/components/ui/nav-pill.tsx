import * as React from "react";
import { cn } from "@/lib/utils";

export type NavPillProps = React.ComponentPropsWithoutRef<"nav">;

export const NavPill = React.forwardRef<HTMLElement, NavPillProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg px-8 py-3",
        className
      )}
      {...props}
    />
  )
);
NavPill.displayName = "NavPill";
