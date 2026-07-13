"use client";

import { useEffect, useState } from "react";

// Diálogo de confirmação do DS — substitui window.confirm() nativo.
// Padrão espelhado do toaster: chamada imperativa de qualquer lugar +
// <ConfirmHost/> montado uma vez no layout raiz.
//
//   if (await confirmDialog({ title: 'Deletar "X"?', danger: true, confirmLabel: "Deletar" })) { ... }
//
// Resolve true no confirmar, false no cancelar / backdrop / Esc.

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

let _listener: ((s: ConfirmState | null) => void) | null = null;
let _current: ConfirmState | null = null;
let _nextId = 1;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  // Se já houver um aberto, resolve o antigo como cancelado.
  if (_current) _current.resolve(false);
  return new Promise<boolean>(resolve => {
    _current = { ...opts, id: _nextId++, resolve };
    _listener?.(_current);
  });
}

function close(ok: boolean) {
  if (!_current) return;
  _current.resolve(ok);
  _current = null;
  _listener?.(null);
}

// ─── Host (adicionar uma vez no layout raiz) ──────────────────────────────────

export function ConfirmHost() {
  const [state, setState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    _listener = setState;
    return () => { _listener = null; };
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  if (!state) return null;

  const accent = state.danger ? "var(--danger)" : "var(--accent)";
  const confirmFg = state.danger ? "#fff" : "var(--accent-fg)";

  return (
    <>
      <style>{`
        @keyframes sb-confirm-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
      <div
        onMouseDown={e => { if (e.target === e.currentTarget) close(false); }}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, background: "rgba(0,0,0,0.6)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sb-confirm-title"
          style={{
            width: "100%", maxWidth: 400,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            borderRadius: 16, padding: 24,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            animation: "sb-confirm-in 0.18s ease",
          }}
        >
          <p id="sb-confirm-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", margin: 0, lineHeight: 1.3 }}>
            {state.title}
          </p>
          {state.message && (
            <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "10px 0 0", lineHeight: 1.5 }}>
              {state.message}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
            <button
              onClick={() => close(false)}
              style={{
                background: "transparent", color: "var(--fg-muted)",
                border: "1px solid var(--border-strong)", borderRadius: "var(--r-pill)",
                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", minHeight: 44,
              }}
            >
              {state.cancelLabel ?? "Cancelar"}
            </button>
            <button
              autoFocus
              onClick={() => close(true)}
              style={{
                background: accent, color: confirmFg,
                border: "none", borderRadius: "var(--r-pill)",
                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", minHeight: 44,
              }}
            >
              {state.confirmLabel ?? "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
