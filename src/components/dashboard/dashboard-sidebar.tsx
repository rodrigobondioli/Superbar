"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, History, UtensilsCrossed,
  TableProperties, Users, MonitorSmartphone, Wallet, Package, Sparkles,
} from "lucide-react";
import type { BarRole, Bar } from "@/types/database";
import { Drawer } from "@/components/ui/drawer";
import { SettingsButton } from "./settings-button";
import type { AlertaEstoque } from "@/lib/dashboard/queries";

const links = [
  { href: "/dashboard",                    label: "Operação ao Vivo", icon: LayoutDashboard },
  { href: "/dashboard/inteligencia",       label: "Inteligência",     icon: Sparkles, badge: true },
  { href: "/dashboard/relatorios",         label: "Relatórios",       icon: BarChart3 },
  { href: "/dashboard/turnos",             label: "Turnos",           icon: History },
  { href: "/dashboard/cardapio",           label: "Cardápio",         icon: UtensilsCrossed },
  { href: "/dashboard/mesas",              label: "Mesas",            icon: TableProperties },
  { href: "/dashboard/estoque",            label: "Estoque",          icon: Package },
  { href: "/dashboard/equipe",             label: "Equipe",           icon: Users },
  { href: "/caixa",                        label: "Caixa",            icon: Wallet },
];

const ROLE_LABEL: Record<string, string> = {
  dono: "Dono", gerente: "Gerente", bar_manager: "Gerente",
  caixa: "Caixa", bartender: "Bartender", garcom: "Garçom",
};

interface DashboardSidebarProps {
  barNome: string;
  userNome: string;
  role: BarRole;
  insightCount?: number;
  onNavigate?: () => void;
  hideHeader?: boolean;
  touchMode?: boolean;
  alertas?: AlertaEstoque[];
  bar?: Bar;
  barId?: string;
  userId?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  autoPedido?: boolean;
  taxaServicoPct?: number;
}

export function DashboardSidebar({
  barNome, userNome, role, insightCount = 0, onNavigate, hideHeader,
  touchMode, alertas = [], bar, barId, userId, userEmail = "",
  userAvatarUrl, autoPedido = false, taxaServicoPct = 10,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"suporte" | "sugestao">("suporte");

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className="flex flex-col"
      style={{
        width: touchMode ? "100%" : "220px",
        height: touchMode ? "100%" : "100dvh",
        overflow: "hidden",
        background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)",
      }}
    >

      {/* ── Logo + bar name ── */}
      {!hideHeader && (
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--accent-fg)", lineHeight: 1, letterSpacing: "-0.02em" }}>S</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em" }}>SUPERBAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {barNome}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              padding: "2px 8px", borderRadius: 20,
              background: "color-mix(in srgb, var(--accent) 14%, transparent)",
              color: "var(--accent)",
              flexShrink: 0,
            }}>
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ padding: touchMode ? "12px" : "10px 10px 0", flex: 1 }}>
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: touchMode ? 14 : 9,
                padding: touchMode ? "13px 14px" : "8px 10px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: touchMode ? "15px" : "13px",
                fontWeight: active ? 500 : 400,
                color: active ? "var(--fg)" : "var(--fg-muted)",
                background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
                textDecoration: "none",
                transition: "background 120ms, color 120ms",
              }}
              className={!active ? "hover:!bg-white/[0.05] hover:!text-[var(--fg)]" : ""}
            >
              <link.icon
                className={touchMode ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"}
                strokeWidth={1.75}
                style={{ color: active ? "var(--accent)" : "var(--fg-subtle)" }}
              />
              <span style={{ flex: 1 }}>{link.label}</span>
              {"badge" in link && link.badge && insightCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 10,
                  background: "var(--danger)",
                  color: "#fff",
                  minWidth: 18,
                  textAlign: "center",
                }}>
                  {insightCount > 9 ? "9+" : insightCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid var(--border)" }}>

        {/* User + settings */}
        {!touchMode && bar && barId && userId && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userNome}
                style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: "color-mix(in srgb, var(--accent) 20%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "var(--accent)",
              }}>
                {userNome.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 12, color: "var(--fg-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userNome.split(" ")[0]}
            </span>
            <SettingsButton
              bar={bar} barId={barId} userId={userId} userNome={userNome}
              userEmail={userEmail} userAvatarUrl={userAvatarUrl ?? null}
              autoPedido={autoPedido} taxaServicoPct={taxaServicoPct}
              alertCount={alertas.length}
            />
          </div>
        )}

        {/* Support links */}
        <div style={{ padding: touchMode ? "8px 12px" : "4px 10px" }}>
          {(["Suporte", "Sugestão"] as const).map((label) => (
            <button
              key={label}
              onClick={() => { setDrawerType(label === "Suporte" ? "suporte" : "sugestao"); setDrawerOpen(true); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: touchMode ? "12px 14px" : "7px 10px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: touchMode ? "14px" : "12px",
                color: "var(--fg-subtle)",
                borderRadius: 6,
              }}
              className="hover:!text-[var(--fg-muted)]"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Ver operação */}
        <Link
          href="/garcom"
          onClick={onNavigate}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            margin: touchMode ? "8px 12px 4px" : "6px 8px 2px",
            padding: touchMode ? "14px 0" : "10px 0",
            borderRadius: 9999,
            background: "var(--accent)",
            color: "#000000",
            fontSize: touchMode ? "14px" : "12px",
            fontWeight: 700,
            textDecoration: "none",
            transition: "opacity 150ms",
          }}
        >
          <MonitorSmartphone style={{ width: touchMode ? 15 : 13, height: touchMode ? 15 : 13 }} />
          Ver operação
        </Link>
      </div>

      <Drawer open={drawerOpen} type={drawerType} onClose={() => setDrawerOpen(false)} />
    </aside>
  );
}
