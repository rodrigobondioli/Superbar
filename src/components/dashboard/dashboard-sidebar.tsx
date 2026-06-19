"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, History, UtensilsCrossed, TableProperties, Users, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BarRole } from "@/types/database";
import { Drawer } from "@/components/ui/drawer";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/turnos", label: "Turnos", icon: History },
  { href: "/dashboard/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/dashboard/mesas", label: "Mesas", icon: TableProperties },
  { href: "/dashboard/equipe", label: "Equipe", icon: Users },
];

interface DashboardSidebarProps {
  barNome: string;
  userNome: string;
  role: BarRole;
}

export function DashboardSidebar({ barNome }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'suporte' | 'sugestao'>('suporte');

  return (
    <aside
      className="flex flex-col"
      style={{
        width: "220px",
        height: "100vh",
        overflowY: "auto",
        background: "#0a0a10",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>{barNome}</span>
        <span style={{
          fontSize: "11px",
          fontWeight: 500,
          padding: "3px 10px",
          borderRadius: "99px",
          background: "rgba(38,0,120,0.30)",
          color: "rgba(160,130,255,0.9)",
          whiteSpace: "nowrap",
        }}>
          Dono
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {links.map((link) => {
          const active =
            link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: active ? 500 : 400,
                color: active ? "#ffffff" : "rgba(255,255,255,0.45)",
                background: active ? "rgba(255,255,255,0.07)" : "transparent",
                textDecoration: "none",
                transition: "all 150ms",
              }}
              className={cn(!active && "hover:bg-white/[0.04] hover:!text-white/70")}
            >
              <link.icon className="h-4 w-4" strokeWidth={1.75} style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.45)" }} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé — empurrado pro fundo */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Suporte + Sugestão */}
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { icon: '🎧', label: 'Suporte', type: 'suporte' as const },
            { icon: '💡', label: 'Sugestão', type: 'sugestao' as const },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { setDrawerType(item.type); setDrawerOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.30)', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'color 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.30)'; }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Modo Bartender — bloco fixo no fundo, full width */}
        <Link
          href="/bartender"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '16px 0',
            background: '#4c1d95',
            color: '#ede9fe',
            fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          <MonitorSmartphone style={{ width: 15, height: 15 }} />
          Modo Bartender
        </Link>

      </div>

      <Drawer open={drawerOpen} type={drawerType} onClose={() => setDrawerOpen(false)} />
    </aside>
  );
}
