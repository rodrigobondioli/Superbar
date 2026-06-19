"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <span
      ref={containerRef}
      onClick={() => setOpen((v) => !v)}
      className={cn("group relative inline-flex cursor-default", className)}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-fg opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100",
          open && "opacity-100"
        )}
      >
        {content}
      </span>
    </span>
  );
}
