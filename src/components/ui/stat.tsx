import { cn } from "@/lib/utils";

interface StatProps {
  value: string;
  label: string;
  size?: "lg" | "xl";
}

const sizeClasses: Record<"lg" | "xl", string> = {
  lg: "text-[1.75rem]",
  xl: "text-[2.5rem]",
};

export function Stat({ value, label, size = "xl" }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn(sizeClasses[size], "font-mono font-bold tabular-nums leading-none text-fg")}>
        {value}
      </span>
      <span className="text-xs uppercase tracking-[0.1em] text-fg-subtle">{label}</span>
    </div>
  );
}
