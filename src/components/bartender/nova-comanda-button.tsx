"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { criarComanda } from "@/lib/bartender/actions";

export function NovaComandaButton() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "14px",
          background: "var(--accent)", border: "none", borderRadius: 8,
          color: "var(--accent-fg)", fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}
      >
        <Plus style={{ width: 18, height: 18 }} />
        Nova comanda
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.60)",
            }}
          />

          {/* Modal */}
          <div style={{
            position: "fixed", zIndex: 101,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(440px, calc(100vw - 32px))",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "24px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>Nova comanda</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "var(--fg-muted)", cursor: "pointer", display: "flex", padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form action={async (fd) => { setOpen(false); await criarComanda(fd); }}>
              <label style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>
                Identificador
              </label>
              <input
                ref={inputRef}
                name="identificador"
                placeholder="Ex: Mesa 3, Balcão, João"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "var(--bg-inset)",
                  border: "1px solid var(--border)",
                  borderRadius: 4, padding: "12px 14px",
                  fontSize: 16, color: "var(--fg)", outline: "none",
                  colorScheme: "dark", marginBottom: 20,
                } as React.CSSProperties}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1, padding: "12px", minHeight: 44,
                    background: "color-mix(in srgb, var(--fg) 7%, transparent)", border: "none", borderRadius: 8,
                    color: "var(--fg-muted)", fontSize: 14, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2, padding: "12px", minHeight: 44,
                    background: "var(--accent)", border: "none", borderRadius: 8,
                    color: "var(--accent-fg)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Abrir comanda
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
