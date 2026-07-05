"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "ok" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ─── Module-level emitter (survives renders, safe in SSR) ─────────────────────

let _listeners: Array<(items: ToastItem[]) => void> = [];
let _toasts: ToastItem[] = [];
let _nextId = 1;

/** Call from anywhere — client components, action callbacks, etc. */
export function toast(message: string, type: ToastType = "info", durationMs = 3500) {
  const id = _nextId++;
  _toasts = [..._toasts, { id, message, type }];
  _listeners.forEach(l => l(_toasts));
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    _listeners.forEach(l => l(_toasts));
  }, durationMs);
}

// ─── Renderer (add once to root layout) ──────────────────────────────────────

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    _listeners.push(setItems);
    return () => {
      _listeners = _listeners.filter(l => l !== setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes sb-toast-in {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", flexDirection: "column", gap: 8,
          maxWidth: 380, width: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {items.map(item => {
          const dot = item.type === "ok" ? "var(--ok)" : item.type === "error" ? "var(--danger)" : "var(--accent)";
          return (
            <div
              key={item.id}
              role="status"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 16px", borderRadius: 10,
                background: "var(--bg-card-hi, #242426)",
                border: "1px solid var(--border-strong)",
                color: "var(--fg)",
                fontSize: 13, fontWeight: 600,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                animation: "sb-toast-in 0.18s ease",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
              {item.message}
            </div>
          );
        })}
      </div>
    </>
  );
}
