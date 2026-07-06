"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, History, UtensilsCrossed,
  TableProperties, Users, MonitorSmartphone, Wallet, Package, Sparkles,
  HeadphonesIcon, Lightbulb, Contact, PanelLeft,
} from "lucide-react";
import type { BarRole, Bar } from "@/types/database";
import { Drawer } from "@/components/ui/drawer";
import { SettingsButton } from "./settings-button";
import type { AlertaEstoque } from "@/lib/dashboard/queries";
import { ROLE_LABEL } from "@/lib/role-labels";

const links = [
  { href: "/dashboard",                    label: "Operação ao vivo", icon: LayoutDashboard },
  { href: "/dashboard/inteligencia",       label: "Inteligência",     icon: Sparkles, badge: true },
  { href: "/dashboard/relatorios",         label: "Relatórios",       icon: BarChart3 },
  { href: "/dashboard/turnos",             label: "Turnos",           icon: History },
  { href: "/dashboard/cardapio",           label: "Cardápio",         icon: UtensilsCrossed },
  { href: "/dashboard/mesas",              label: "Mesas",            icon: TableProperties },
  { href: "/dashboard/estoque",            label: "Estoque",          icon: Package },
  { href: "/dashboard/clientes",           label: "Clientes",         icon: Contact },
  { href: "/dashboard/equipe",             label: "Equipe",           icon: Users },
  { href: "/caixa",                        label: "Caixa",            icon: Wallet },
];

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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({
  barNome, userNome, role, insightCount = 0, onNavigate, hideHeader,
  touchMode, alertas = [], bar, barId, userId, userEmail = "",
  userAvatarUrl, autoPedido = false, taxaServicoPct = 10,
  collapsed = false, onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"suporte" | "sugestao">("suporte");

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const iconSize = touchMode ? "h-5 w-5" : "h-4 w-4";

  return (
    <aside
      className="flex flex-col"
      style={{
        width: touchMode ? "100%" : collapsed ? 52 : 220,
        height: touchMode ? "100%" : "100dvh",
        overflow: "hidden",
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        transition: "width 200ms ease",
      }}
    >

      {/* ── Logo + toggle ── */}
      {!hideHeader && (
        <div style={{
          padding: collapsed ? "14px 0" : "28px 20px 24px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: collapsed ? 8 : 0,
          position: "relative",
        }}>
          {!collapsed && (
            <>
              {onToggleCollapse && (
                <button onClick={onToggleCollapse} aria-label="Colapsar menu" style={{
                  position: "absolute", top: 14, right: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 6,
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--fg-subtle)", flexShrink: 0,
                }} className="hover:!text-[var(--fg)] hover:!bg-white/[0.06]">
                  <PanelLeft style={{ width: 15, height: 15 }} strokeWidth={1.75} />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.svg" alt={barNome} style={{ width: 72, height: 72, borderRadius: "50%", display: "block", marginBottom: 12 }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em", textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {barNome}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, marginTop: 6,
                padding: "3px 10px", borderRadius: 999,
                background: "var(--bg-card-hi)", color: "var(--fg-muted)",
              }}>
                Dono
              </span>
            </>
          )}
          {collapsed && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.svg" alt="SUPERBAR" style={{ width: 28, height: 28, borderRadius: 7, display: "block" }} />
              {onToggleCollapse && (
                <button onClick={onToggleCollapse} aria-label="Expandir menu" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 6,
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--fg-subtle)",
                }} className="hover:!text-[var(--fg)] hover:!bg-white/[0.06]">
                  <PanelLeft style={{ width: 15, height: 15, transform: "scaleX(-1)" }} strokeWidth={1.75} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ padding: touchMode ? "12px" : collapsed ? "10px 8px 0" : "10px 10px 0", flex: 1 }}>
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              title={collapsed ? link.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: touchMode ? 14 : 9,
                padding: collapsed ? "9px 0" : touchMode ? "13px 14px" : "8px 10px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: touchMode ? "15px" : "13px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--accent)" : "var(--fg)",
                background: "transparent",
                textDecoration: "none",
                transition: "background 120ms, color 120ms",
              }}
              className={!active ? "hover:!bg-white/[0.05] hover:!text-[var(--fg)]" : ""}
            >
              <link.icon
                className={`${iconSize} shrink-0`}
                strokeWidth={1.75}
                style={{ color: active ? "var(--accent)" : "var(--fg-subtle)" }}
              />
              {!collapsed && <span style={{ flex: 1 }}>{link.label}</span>}
              {!collapsed && "badge" in link && link.badge && insightCount > 0 && (
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
              {collapsed && "badge" in link && link.badge && insightCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: 6, right: 6,
                  width: 6, height: 6,
                  borderRadius: "50%",
                  background: "var(--danger)",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid var(--border)" }}>

        {/* Configurações / Suporte / Sugestão — só expandido */}
        {!collapsed && (
          <div style={{ padding: touchMode ? "8px 12px 16px" : "8px 10px 12px" }}>
            {!touchMode && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 10px" }}>
                {userAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatarUrl} alt={userNome} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block" }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-card-hi)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--fg)", flexShrink: 0 }}>
                    {userNome.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 13, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userNome}</span>
              </div>
            )}
            {!touchMode && <div style={{ height: 1, background: "var(--border)", margin: "0 -10px 8px" }} />}
            {bar && barId && userId && (
              <SettingsButton
                linkMode
                touchMode={touchMode}
                bar={bar} barId={barId} userId={userId} userNome={userNome}
                userEmail={userEmail} userAvatarUrl={userAvatarUrl ?? null}
                autoPedido={autoPedido} taxaServicoPct={taxaServicoPct}
                alertCount={alertas.length}
              />
            )}
            {([
              { label: "Suporte",   type: "suporte",   Icon: HeadphonesIcon },
              { label: "Sugestão",  type: "sugestao",  Icon: Lightbulb },
            ] as const).map(({ label, type, Icon }) => (
              <button
                key={label}
                onClick={() => { setDrawerType(type); setDrawerOpen(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  padding: touchMode ? "12px 14px" : "7px 10px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: touchMode ? "14px" : "12px",
                  color: "var(--fg-subtle)",
                  borderRadius: 6,
                }}
                className="hover:!text-[var(--fg-muted)]"
              >
                <Icon style={{ width: touchMode ? 15 : 13, height: touchMode ? 15 : 13, flexShrink: 0 }} strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Modo Bartender */}
        <Link
          href="/garcom"
          onClick={onNavigate}
          title={collapsed ? "Modo Bartender" : undefined}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: collapsed ? 0 : 7,
            padding: collapsed ? "12px 0" : touchMode ? "16px 0" : "12px 0",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            fontSize: touchMode ? "14px" : "12px",
            fontWeight: 700,
            textDecoration: "none",
            borderRadius: 0,
            transition: "opacity 150ms",
          }}
        >
          <MonitorSmartphone style={{ width: touchMode ? 15 : 13, height: touchMode ? 15 : 13 }} />
          {!collapsed && "Modo Bartender"}
        </Link>
      </div>

      <Drawer open={drawerOpen} type={drawerType} onClose={() => setDrawerOpen(false)} />
    </aside>
  );
}
