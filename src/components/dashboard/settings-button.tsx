"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { SettingsPanel } from "./settings-panel";
import type { Bar } from "@/types/database";

interface SettingsButtonProps {
  bar: Bar;
  barId: string;
  userId: string;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

export function SettingsButton({
  bar, barId, userId, userNome, userEmail, userAvatarUrl,
}: SettingsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Configurações"
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          color: "var(--fg-muted)",
          background: "transparent",
          cursor: "pointer",
          transition: "border-color 150ms, color 150ms",
        }}
        className="hover:border-[var(--border-strong)] hover:!text-[var(--fg)]"
      >
        <Settings className="h-4 w-4" strokeWidth={1.75} />
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
      />
    </>
  );
}
