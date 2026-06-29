import * as React from "react";
import { cn } from "@/lib/utils";

/*
  SUPERBAR — Toggle
  ─────────────────────────────────────────────
  Touch-friendly: track 52×30, thumb 24×24
  Uso: <Toggle checked={v} onChange={setV} label="Serviço 10%" />
*/

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Toggle({ checked, onChange, disabled = false, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center",
        "h-[30px] w-[52px] rounded-full border-none p-0",
        "transition-colors duration-200 ease-in-out",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "[-webkit-tap-highlight-color:transparent]",
        checked ? "bg-accent" : "bg-[rgba(255,255,255,0.12)]",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-6 w-6 rounded-full transition-[left] duration-200",
          "absolute top-[3px]",
          checked
            ? "left-[23px] bg-accent-fg"
            : "left-[3px] bg-white"
        )}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}
