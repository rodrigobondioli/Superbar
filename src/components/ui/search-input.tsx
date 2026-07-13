"use client";

import { Search } from "lucide-react";

// Busca padrão do app (ícone à esquerda). Mesmo visual em Estoque e Contagem.
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", ...style }}>
      <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "9px 12px 9px 34px", fontSize: 13, color: "var(--fg)",
          outline: "none", colorScheme: "dark", boxSizing: "border-box",
        }}
      />
    </div>
  );
}
