"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Users, Layers, DollarSign, PhoneCall } from "lucide-react";

// ─── Navegação ────────────────────────────────────────────────────────────────

const links = [
  { href: "/admin",            label: "Atenção",     icon: AlertTriangle, exact: true },
  { href: "/admin/clientes",   label: "Clientes",    icon: Users },
  { href: "/admin/implantacao",label: "Implantação", icon: Layers },
  { href: "/admin/financeiro", label: "Financeiro",  icon: DollarSign },
  { href: "/admin/leads",      label: "Leads",       icon: PhoneCall },
];

interface AdminSidebarProps {
  alertCount?: number; // bares com alertas
}

export function AdminSidebar({ alertCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="SUPERBAR" style={{ width: 44, height: 44, borderRadius: 10, display: "block", marginBottom: 10 }} />
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em", marginBottom: 6 }}>
          SUPERBAR
        </span>
        <span style={{
          display: "inline-block",
          fontSize: 10, fontWeight: 600,
          padding: "2px 10px", borderRadius: 20,
          background: "color-mix(in srgb, var(--accent-bright) 14%, transparent)",
          color: "var(--accent-bright)",
          letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 10px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? "var(--fg)" : "var(--fg-muted)",
                background: active ? "color-mix(in srgb, var(--fg) 6%, transparent)" : "transparent",
                textDecoration: "none",
                transition: "background 150ms, color 150ms",
              }}
            >
              <link.icon
                style={{
                  width: 15, height: 15, flexShrink: 0,
                  color: active ? "var(--accent-bright)" : "var(--fg-subtle)",
                  strokeWidth: 1.75,
                }}
              />
              {link.label}
              {/* Badge para Atenção */}
              {link.href === "/admin" && alertCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: "50%",
                  minWidth: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                }}>
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "14px 0",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          ← Meu bar
        </Link>
      </div>
    </aside>
  );
}
