"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import type { Bar } from "@/types/database";
import { PerfilDoBar } from "./settings/perfil-do-bar";
import { MinhaConta } from "./settings/minha-conta";
import { OperacaoSection } from "./settings/operacao-section";
import { DispositivosSection } from "./settings/dispositivos-section";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  bar: Bar;
  barId: string;
  userId: string;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
  autoPedido?: boolean;
  taxaServicoPct?: number;
}

type Aba = "perfil" | "conta" | "operacao";
const ABAS: { id: Aba; label: string }[] = [
  { id: "perfil",   label: "Perfil do bar" },
  { id: "conta",    label: "Minha conta" },
  { id: "operacao", label: "Operação" },
];

export function SettingsPanel({
  open, onClose, bar, barId, userId, userNome, userEmail, userAvatarUrl, autoPedido = false, taxaServicoPct = 10,
}: SettingsPanelProps) {
  const [aba, setAba] = useState<Aba>("perfil");

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(0,0,0,0.5)",
            animation: "fade-in 150ms ease both",
          }}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configurações"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(92vw, 680px)",
          zIndex: 100,
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
            Configurações
          </h2>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 8,
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--fg-muted)", cursor: "pointer",
              transition: "border-color 150ms, color 150ms",
            }}
            className="hover:border-[var(--border-strong)] hover:!text-[var(--fg)]"
            aria-label="Fechar"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Abas */}
        <div style={{
          display: "flex", gap: 4, padding: "0 20px",
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          {ABAS.map((t) => {
            const ativa = aba === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                style={{
                  appearance: "none", background: "transparent", border: "none",
                  padding: "12px 8px", cursor: "pointer",
                  fontSize: 14, fontWeight: ativa ? 600 : 400,
                  color: ativa ? "var(--fg)" : "var(--fg-muted)",
                  borderBottom: `2px solid ${ativa ? "var(--accent)" : "transparent"}`,
                  marginBottom: -1,
                  transition: "color 150ms",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "28px 20px",
          display: "flex", flexDirection: "column", gap: 32,
        }}>
          {aba === "perfil" && <PerfilDoBar bar={bar} barId={barId} />}

          {aba === "conta" && (
            <>
              <MinhaConta
                userId={userId}
                userNome={userNome}
                userEmail={userEmail}
                userAvatarUrl={userAvatarUrl}
              />

              <div style={{ height: 1, background: "var(--border)" }} />

              {/* Logout */}
              <section>
                <form action={signOut}>
                  <button
                    type="submit"
                    style={{
                      background: "transparent",
                      border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
                      borderRadius: 8,
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--danger)",
                      cursor: "pointer",
                      transition: "background 150ms, border-color 150ms",
                    }}
                    className="hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] hover:border-[var(--danger)]"
                  >
                    Sair da conta
                  </button>
                </form>
              </section>
            </>
          )}

          {aba === "operacao" && (
            <>
              <OperacaoSection barId={barId} autoPedido={autoPedido} fluxoPronto={bar.configuracoes?.fluxo_pronto ?? true} taxaServicoPct={taxaServicoPct} />

              <div style={{ height: 1, background: "var(--border)" }} />

              <DispositivosSection />
            </>
          )}
        </div>
      </div>
    </>
  );
}
