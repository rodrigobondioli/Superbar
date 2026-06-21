"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
}

export function SettingsButton({
  bar, barId, userId, userNome, userEmail, userAvatarUrl, autoPedido = false,
}: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const inicial = userNome.split(" ")[0].charAt(0).toUpperCase();

  return (
    <>
      <button
        type="button"
        title="Configurações"
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "none", border: "none",
          cursor: "pointer", padding: 0,
          borderRadius: 4,
        }}
      >
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatarUrl}
            alt={userNome}
            style={{ width: 41, height: 41, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 41, height: 41, borderRadius: "50%",
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "var(--accent-fg)", flexShrink: 0,
          }}>
            {inicial}
          </div>
        )}
        <ChevronDown style={{ width: 13, height: 13, color: "var(--fg-subtle)", flexShrink: 0 }} strokeWidth={2} />
      </button>

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
      />
    </>
  );
}
