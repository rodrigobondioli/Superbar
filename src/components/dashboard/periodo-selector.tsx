"use client";

import Link from "next/link";
import { useState } from "react";

const OPCOES = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7dias", label: "7 dias" },
] as const;

export function PeriodoSelector({ periodo }: { periodo: string }) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {OPCOES.map((o) => {
        const active = periodo === o.id;
        const isHover = hover === o.id;
        return (
          <Link
            key={o.id}
            href={o.id === "hoje" ? "/dashboard" : `/dashboard?periodo=${o.id}`}
            scroll={false}
            onMouseEnter={() => setHover(o.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              textDecoration: "none",
              transition: "background 120ms, border-color 120ms, color 120ms",
              background: active ? "var(--accent)" : isHover ? "rgba(255,255,255,0.06)" : "transparent",
              border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
              color: active ? "var(--accent-fg)" : isHover ? "var(--fg)" : "var(--fg-muted)",
            }}
          >
            {o.label}
          </Link>
        );
      })}
      <Link
        href="/dashboard/relatorios"
        onMouseEnter={() => setHover("rel")}
        onMouseLeave={() => setHover(null)}
        style={{
          padding: "8px 16px",
          fontSize: 13,
          textDecoration: "none",
          color: hover === "rel" ? "var(--fg)" : "var(--fg-muted)",
          transition: "color 120ms",
        }}
      >
        Ver relatório completo
      </Link>
    </div>
  );
}
