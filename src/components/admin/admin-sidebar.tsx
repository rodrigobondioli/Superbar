"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Layers, PhoneCall } from "lucide-react";

// ─── Navegação ────────────────────────────────────────────────────────────────

const links = [
  { href: "/admin",            label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/clientes",   label: "Clientes",    icon: Users },
  { href: "/admin/implantacao",label: "Implantação", icon: Layers },
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
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="SUPERBAR" style={{ width: 72, height: 72, borderRadius: 18, display: "block", marginBottom: 12 }} />
        <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em", marginBottom: 8 }}>
          SUPERBAR
        </span>
        <span style={{
          display: "inline-block",
          fontSize: 10, fontWeight: 600,
          padding: "3px 12px", borderRadius: 20,
          background: "color-mix(in srgb, var(--accent) 14%, transparent)",
          color: "var(--accent)",
          letterSpacing: "0.06em", textTransform: "uppercase",
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
                  color: active ? "var(--accent)" : "var(--fg-subtle)",
                  strokeWidth: 1.75,
                }}
              />
              {link.label}
              {/* Badge para Atenção */}
              {link.href === "/admin" && alertCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "var(--danger)",
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

    </aside>
  );
}
