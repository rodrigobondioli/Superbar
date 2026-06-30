import type { CSSProperties, ReactNode } from "react";

interface DashCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function DashCard({ children, style, className }: DashCardProps) {
  const base: CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 24px",
  };
  return (
    <div style={{ ...base, ...style }} className={className}>
      {children}
    </div>
  );
}
