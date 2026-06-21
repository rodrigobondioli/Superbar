"use client";

import { useState } from "react";
import { MesasGrid } from "./mesas-grid";
import { ProducaoTab } from "./producao-tab";
import type { MesaComStatus } from "@/lib/bartender/queries";
import type { Comanda } from "@/types/database";

type Tab = "mesas" | "producao";

interface Props {
  barId: string;
  turnoId: string;
  initialMesas: MesaComStatus[];
  initialBalcao: Comanda | null;
}

export function BartenderTabs({ barId, turnoId, initialMesas, initialBalcao }: Props) {
  const [tab, setTab] = useState<Tab>("mesas");

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "0 20px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: tab === t ? 700 : 400,
    color: tab === t ? "var(--fg)" : "var(--fg-subtle)",
    borderBottom: tab === t ? "2px solid var(--accent-bright)" : "2px solid transparent",
    transition: "color 0.15s, border-color 0.15s",
    flexShrink: 0,
    letterSpacing: tab === t ? "-0.2px" : "0",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        height: 44,
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <button type="button" style={tabStyle("mesas")} onClick={() => setTab("mesas")}>
          Mesas
        </button>
        <button type="button" style={tabStyle("producao")} onClick={() => setTab("producao")}>
          Produção
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: tab === "mesas" ? "block" : "flex", flexDirection: "column" }}>
        {tab === "mesas" ? (
          <MesasGrid
            barId={barId}
            initialMesas={initialMesas}
            initialBalcao={initialBalcao}
          />
        ) : (
          <ProducaoTab barId={barId} turnoId={turnoId} />
        )}
      </div>
    </div>
  );
}
