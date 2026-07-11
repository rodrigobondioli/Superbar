"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, MonitorSmartphone } from "lucide-react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AlertasBell } from "./alertas-bell";
import { AppHeader } from "@/components/ui/app-header";
import type { BarRole, Bar } from "@/types/database";
import type { AlertaEstoque } from "@/lib/dashboard/queries";
import { ROLE_LABEL } from "@/lib/role-labels";

interface DashboardLayoutClientProps {
  barNome: string;
  userNome: string;
  role: BarRole;
  bar: Bar;
  barId: string;
  userId: string;
  userEmail: string;
  userAvatarUrl: string | null;
  alertas: AlertaEstoque[];
  insightCount?: number;
  autoPedido?: boolean;
  taxaServicoPct?: number;
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  barNome,
  userNome,
  role,
  bar,
  barId,
  userId,
  userEmail,
  userAvatarUrl,
  alertas,
  insightCount = 0,
  autoPedido = false,
  taxaServicoPct = 10,
  children,
}: DashboardLayoutClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div data-theme="dark" className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Mobile header (lg:hidden) ── */}
      <div className="lg:hidden flex-shrink-0">
        <AppHeader
          barNome={barNome}
          roleLabel={ROLE_LABEL[role] ?? role}
          right={
            <>
              <AlertasBell alertas={alertas} />
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36,
                  background: "none", border: "1px solid var(--border)",
                  borderRadius: 4, cursor: "pointer",
                  color: "var(--fg-muted)",
                }}
              >
                <Menu style={{ width: 18, height: 18 }} strokeWidth={1.75} />
              </button>
            </>
          }
        />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside
          className="hidden lg:block flex-shrink-0"
          style={{
            width: collapsed ? 52 : 220,
            height: "100%",
            // impeccable-disable-next-line layout-transition -- colapso push intencional da sidebar (200ms, one-shot)
            transition: "width 200ms ease",
          }}
        >
          <DashboardSidebar
            barNome={barNome}
            userNome={userNome}
            role={role}
            insightCount={insightCount}
            alertas={alertas}
            bar={bar}
            barId={barId}
            userId={userId}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
            autoPedido={autoPedido}
            taxaServicoPct={taxaServicoPct}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(c => !c)}
          />
        </aside>

        {/* Main */}
        <main className="px-6 lg:px-0" style={{ flex: 1, height: "100%", overflowY: "auto", background: "var(--bg)" }}>
          {children}
          {/* Abrir operação — mobile only, sticky bottom */}
          <div className="lg:hidden" style={{ padding: "16px 0 24px" }}>
            <Link
              href="/operacao"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "16px 0",
                background: "var(--accent)",
                color: "var(--accent-fg)",
                fontSize: 15, fontWeight: 600,
                textDecoration: "none",
                borderRadius: 999,
                letterSpacing: "0.02em",
                transition: "filter 150ms",
              }}
              className="hover:brightness-110"
            >
              <MonitorSmartphone style={{ width: 16, height: 16 }} />
              Modo Bartender
            </Link>
          </div>
        </main>
      </div>

      {/* ── Mobile drawer — sempre no DOM, animado via CSS ── */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: drawerOpen ? "auto" : "none",
        }}
        role="dialog"
        aria-modal={drawerOpen ? "true" : "false"}
        aria-hidden={!drawerOpen}
      >
        {/* Backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            opacity: drawerOpen ? 1 : 0,
            transition: "opacity 0.28s ease",
          }}
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer panel — 90vw, slide from right */}
        <div
          style={{
            position: "absolute",
            right: 0, top: 0, bottom: 0,
            width: "90vw",
            maxWidth: 400,
            background: "var(--bg)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
            overflowY: "auto",
          }}
        >
          {/* Drawer header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            height: 60,
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
              {barNome}
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40,
                background: "none", border: "none",
                cursor: "pointer", color: "var(--fg-muted)",
                borderRadius: 4,
              }}
            >
              <X style={{ width: 20, height: 20 }} strokeWidth={1.75} />
            </button>
          </div>

          {/* Sidebar content */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <DashboardSidebar
              barNome={barNome}
              userNome={userNome}
              role={role}
              insightCount={insightCount}
              onNavigate={() => setDrawerOpen(false)}
              hideHeader
              touchMode
              alertas={alertas}
              bar={bar}
              barId={barId}
              userId={userId}
              userEmail={userEmail}
              userAvatarUrl={userAvatarUrl}
              autoPedido={autoPedido}
              taxaServicoPct={taxaServicoPct}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
