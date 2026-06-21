"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, History, UtensilsCrossed,
  TableProperties, Users, MonitorSmartphone, Wallet, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BarRole } from "@/types/database";
import { Drawer } from "@/components/ui/drawer";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/turnos", label: "Turnos", icon: History },
  { href: "/dashboard/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/dashboard/mesas", label: "Mesas", icon: TableProperties },
  { href: "/dashboard/estoque", label: "Estoque", icon: Package },
  { href: "/dashboard/equipe", label: "Equipe", icon: Users },
  { href: "/caixa", label: "Caixa", icon: Wallet },
];

interface DashboardSidebarProps {
  barNome: string;
  userNome: string;
  role: BarRole;
  onNavigate?: () => void;
  hideHeader?: boolean;
  touchMode?: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  dono: "Dono",
  gerente: "Gerente",
  bar_manager: "Gerente",
  caixa: "Caixa",
  bartender: "Bartender",
  garcom: "Garçom",
};

const footerItems = [
  { label: "Suporte", type: "suporte" as const },
  { label: "Sugestão", type: "sugestao" as const },
];

export function DashboardSidebar({ barNome, role, onNavigate, hideHeader, touchMode }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"suporte" | "sugestao">("suporte");

  const linkPad = touchMode ? "14px 16px" : "7px 10px";
  const linkFont = touchMode ? "16px" : "13px";
  const iconClass = touchMode ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0";

  return (
    <aside
      className="flex flex-col"
      style={{
        width: touchMode ? "100%" : "220px",
        height: touchMode ? "100%" : "100dvh",
        overflow: "hidden",
        background: "var(--bg)",
        borderRight: touchMode ? "none" : "1px solid var(--border)",
      }}
    >
      {/* Logo / bar name — oculto dentro do drawer mobile (já tem header próprio) */}
      {!hideHeader && (
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
            {barNome}
          </span>
          <span style={{
            fontSize: "10px",
            fontWeight: 500,
            padding: "2px 6px",
            borderRadius: "2px",
            background: "color-mix(in srgb, var(--accent-bright) 14%, transparent)",
            color: "var(--accent-bright)",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
          }}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav
        className="flex flex-col"
        style={{ padding: touchMode ? "12px 12px" : "12px 12px 0", gap: touchMode ? "2px" : "2px" }}
      >
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: touchMode ? "14px" : "10px",
                padding: linkPad,
                borderRadius: "4px",
                fontSize: linkFont,
                fontWeight: active ? 500 : 400,
                color: active ? "var(--fg)" : "var(--fg-muted)",
                background: active ? "color-mix(in srgb, var(--fg) 6%, transparent)" : "transparent",
                textDecoration: "none",
                transition: "background 150ms, color 150ms",
              }}
              className={cn(!active && "hover:bg-white/[0.04] hover:!text-[var(--fg)]")}
            >
              <link.icon
                className={iconClass}
                strokeWidth={1.75}
                style={{ color: active ? "var(--accent-bright)" : "var(--fg-subtle)" }}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: touchMode ? "8px 12px" : "6px 12px", borderTop: "1px solid var(--border)" }}>
          {footerItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { setDrawerType(item.type); setDrawerOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: touchMode ? "14px 16px" : "8px 10px",
                borderRadius: "4px",
                background: "none", border: "none",
                color: "var(--fg-subtle)",
                fontSize: touchMode ? "15px" : "13px",
                cursor: "pointer",
                width: "100%", textAlign: "left",
                transition: "color 150ms",
              }}
              className="hover:!text-[var(--fg-muted)]"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Modo Garçom — CTA */}
        <Link
          href="/garcom"
          onClick={onNavigate}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: touchMode ? "18px 0" : "14px 0",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            fontSize: touchMode ? "15px" : "13px",
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.02em",
            transition: "filter 150ms",
          }}
          className="hover:brightness-110"
        >
          <MonitorSmartphone style={{ width: touchMode ? "16px" : "14px", height: touchMode ? "16px" : "14px" }} />
          Modo Bartender
        </Link>
      </div>

      <Drawer open={drawerOpen} type={drawerType} onClose={() => setDrawerOpen(false)} />
    </aside>
  );
}
