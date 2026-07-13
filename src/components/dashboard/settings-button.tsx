"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import { SettingsPanel } from "./settings-panel";
import type { Bar } from "@/types/database";

interface SettingsButtonProps {
  bar: Bar;
  barId: string;
  userId: string;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
  autoPedido?: boolean;
  taxaServicoPct?: number;
  alertCount?: number;
  linkMode?: boolean;
  /** Linha de perfil (avatar + nome + setinha) que abre as Configurações. */
  profileMode?: boolean;
  touchMode?: boolean;
}

export function SettingsButton({
  bar, barId, userId, userNome, userEmail, userAvatarUrl, autoPedido = false, taxaServicoPct = 10, alertCount = 0, linkMode = false, profileMode = false, touchMode = false,
}: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const inicial = userNome.split(" ")[0].charAt(0).toUpperCase();

  return (
    <>
      {profileMode ? (
        <button
          type="button"
          title="Configurações"
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
            padding: touchMode ? "10px 12px" : "6px 10px", background: "none", border: "none",
            cursor: "pointer", borderRadius: 8,
          }}
          className="hover:!bg-white/[0.05]"
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatarUrl} alt={userNome} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-card-hi)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                {inicial}
              </div>
            )}
            {alertCount > 0 && (
              <span style={{ position: "absolute", top: -3, right: -3, minWidth: 15, height: 15, borderRadius: "50%", background: "#FF6F00", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, color: "var(--fg)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userNome}</span>
          <ChevronRight style={{ width: 18, height: 18, color: "var(--accent)", flexShrink: 0 }} strokeWidth={2.5} />
        </button>
      ) : linkMode ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: touchMode ? 12 : 8, width: "100%", textAlign: "left",
            padding: touchMode ? "12px 14px" : "7px 10px", background: "none", border: "none", cursor: "pointer",
            fontSize: touchMode ? 14 : 12, color: touchMode ? "var(--fg-muted)" : "var(--fg-subtle)", borderRadius: 8,
          }}
          className="hover:!text-[var(--fg-muted)]"
        >
          <Settings style={{ width: touchMode ? 15 : 13, height: touchMode ? 15 : 13, flexShrink: 0 }} strokeWidth={1.75} />
          Configurações
        </button>
      ) : (
      <button
        type="button"
        title="Configurações"
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "none", border: "none",
          cursor: "pointer", padding: 0,
          borderRadius: 8,
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatarUrl}
              alt={userNome}
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "var(--accent-fg)",
            }}>
              {inicial}
            </div>
          )}
          {alertCount > 0 && (
            <span style={{
              position: "absolute", top: -3, right: -3,
              minWidth: 15, height: 15, borderRadius: "50%",
              background: "#FF6F00", color: "#fff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px", lineHeight: 1,
            }}>
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </div>
        <ChevronDown style={{ width: 13, height: 13, color: "var(--fg-subtle)", flexShrink: 0 }} strokeWidth={2} />
      </button>
      )}

      <SettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        bar={bar}
        barId={barId}
        userId={userId}
        userNome={userNome}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
        autoPedido={autoPedido}
        taxaServicoPct={taxaServicoPct}
      />
    </>
  );
}
