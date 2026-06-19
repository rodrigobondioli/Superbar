"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AlertasBell } from "./alertas-bell";
import { SettingsButton } from "./settings-button";
import type { BarRole, Bar } from "@/types/database";
import type { AlertaEstoque } from "@/lib/dashboard/queries";

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
  children,
}: DashboardLayoutClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Mobile header (lg:hidden) ── */}
      <header
        className="lg:hidden flex-shrink-0 flex items-center justify-between"
        style={{
          height: 52,
          padding: "0 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        {/* Bar name */}
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: "var(--fg)", fontFamily: "var(--font-mono)",
        }}>
          {barNome}
        </span>

        {/* Right side: controls + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertasBell alertas={alertas} />
          <SettingsButton
            bar={bar}
            barId={barId}
            userId={userId}
            userNome={userNome}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
          />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32,
              background: "none", border: "1px solid var(--border)",
              borderRadius: 4, cursor: "pointer",
              color: "var(--fg-muted)",
            }}
          >
            <Menu style={{ width: 16, height: 16 }} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside
          className="hidden lg:block flex-shrink-0"
          style={{ width: 220, height: "100%", borderRight: "1px solid var(--border)" }}
        >
          <DashboardSidebar barNome={barNome} userNome={userNome} role={role} />
        </aside>

        {/* Main */}
        <main style={{ flex: 1, height: "100%", overflowY: "auto", background: "var(--bg)" }}>
          {children}
        </main>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: 260,
            background: "var(--bg)",
            borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Drawer header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 16px", height: 52, flexShrink: 0,
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
                {barNome}
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32,
                  background: "none", border: "none",
                  cursor: "pointer", color: "var(--fg-muted)",
                }}
              >
                <X style={{ width: 16, height: 16 }} strokeWidth={1.75} />
              </button>
            </div>

            {/* Sidebar content inside drawer */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <DashboardSidebar
                barNome={barNome}
                userNome={userNome}
                role={role}
                onNavigate={() => setDrawerOpen(false)}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
