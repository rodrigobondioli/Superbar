"use client";

import { useState } from "react";
import { ImportarNfePanel } from "@/components/estoque/importar-nfe-panel";

/** Ações do cabeçalho de Estoque: contagem (secundário) + importar NF-e (primário). */
export function EstoqueHeaderActions() {
  const [nfeAberto, setNfeAberto] = useState(false);

  return (
    <>
      <div style={{ marginLeft: "auto", alignSelf: "center", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <a
          href="/contagem"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--border-strong)", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "var(--fg)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Fazer contagem
        </a>
        <button
          onClick={() => setNfeAberto(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 500, color: "var(--accent-fg)", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Importar nota fiscal (NF-e)
        </button>
      </div>
      <ImportarNfePanel open={nfeAberto} onClose={() => setNfeAberto(false)} />
    </>
  );
}
