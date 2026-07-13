"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { AlertaEstoque } from "@/lib/dashboard/queries";

interface AlertasBellProps {
  alertas: AlertaEstoque[];
}

export function AlertasBell({ alertas }: AlertasBellProps) {
  const [open, setOpen] = useState(false);
  // Session-level dismiss: alertas de estoque são computed do banco — não há
  // tabela de notificações. Dismiss é por sessão; recarregar a página reseta.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const visibleAlertas = alertas.filter(a => !dismissed.has(a.produtoNome));

  function dismiss(nome: string) {
    setDismissed(prev => new Set([...prev, nome]));
  }

  function dismissAll() {
    setDismissed(new Set(alertas.map(a => a.produtoNome)));
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", zIndex: 100 }}>
      <button
        type="button"
        title="Notificações"
        onClick={() => setOpen(v => !v)}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "#FFFFFF",
          cursor: "pointer",
          transition: "border-color 150ms, color 150ms",
        }}
        className="hover:border-[var(--border-strong)] hover:!text-[var(--fg)]"
      >
        <Bell style={{ width: 15, height: 15 }} strokeWidth={1.75} />
        {visibleAlertas.length > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -3,
            minWidth: 15, height: 15, borderRadius: "50%",
            background: "#FF6F00", color: "#fff",
            fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
          }}>
            {visibleAlertas.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 42, right: 0,
          width: 360,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 100,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
              Notificações
            </span>
            {visibleAlertas.length > 0 && (
              <button
                onClick={dismissAll}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--fg-subtle)",
                  transition: "color 150ms",
                }}
                className="hover:!text-[var(--fg)]"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {visibleAlertas.map(alerta => (
              <div
                key={alerta.produtoNome}
                onClick={() => dismiss(alerta.produtoNome)}
                style={{
                  display: "flex", gap: 16, padding: "14px 18px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  transition: "background 100ms",
                }}
                className="hover:bg-[color-mix(in_srgb,var(--fg)_3%,transparent)]"
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "var(--warn-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 14, color: "var(--warn)" }}>!</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 3px" }}>
                    Estoque baixo
                  </p>
                  <p style={{ fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.4, margin: 0 }}>
                    {alerta.produtoNome} — {alerta.quantidadeAtual} restantes (mín. {alerta.quantidadeMinima})
                  </p>
                </div>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--danger)",
                  flexShrink: 0, marginTop: 5,
                }} />
              </div>
            ))}

            {visibleAlertas.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--fg-muted)", padding: "24px 18px", textAlign: "center", margin: 0 }}>
                Nenhum alerta no momento.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
