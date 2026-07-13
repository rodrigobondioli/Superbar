"use client";

import { Tablet } from "lucide-react";

export function DispositivosSection() {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Tablet style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
          Dispositivos
        </h3>
      </div>

      <div style={{
        background: "var(--bg-hover)",
        borderRadius: 8, padding: "16px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 4px" }}>
            Configurar iPad do bar
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
            No iPad que garçons e caixa vão usar, abra o app e faça login uma vez
            com a conta do bar. A sessão fica salva no aparelho — não precisa logar
            de novo. Depois, cada pessoa toca no próprio nome na tela “Quem está
            operando agora?” para que os pedidos fiquem atribuídos a ela.
          </p>
        </div>
      </div>
    </section>
  );
}
