"use client";

import { useActionState, useState, useRef } from "react";
import { abrirTurno, fecharTurno } from "@/lib/dashboard/turno-actions";
import type { Turno } from "@/types/database";

type State = { error?: string } | null;

function AbrirTurnoButton() {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, _fd) => (await abrirTurno()) ?? null,
    null
  );
  return (
    <div>
      {state?.error && (
        <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8, textAlign: "right" }}>
          {state.error}
        </p>
      )}
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 20px", borderRadius: 4,
            background: "var(--accent)", color: "var(--accent-fg)",
            border: "none", fontSize: 13, fontWeight: 600,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Abrindo…" : "▶ Abrir Turno"}
        </button>
      </form>
    </div>
  );
}

function FecharTurnoButton({ turnoId }: { turnoId: string }) {
  const fecharComId = async (_prev: State, _fd: FormData) =>
    (await fecharTurno(turnoId)) ?? null;

  const [state, action, pending] = useActionState<State, FormData>(fecharComId, null);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      {state?.error && (
        <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8, textAlign: "right", maxWidth: 280 }}>
          {state.error}
        </p>
      )}

      {/* Hidden form — only submitted on explicit confirm */}
      <form ref={formRef} action={action} style={{ display: "none" }}>
        <button type="submit" />
      </form>

      {confirming ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>Fechar turno agora?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
            style={{
              padding: "8px 14px", borderRadius: 4,
              background: "var(--danger)",
              border: "none",
              color: "#fff",
              fontSize: 12, fontWeight: 700,
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Fechando…" : "Confirmar"}
          </button>
          {!pending && (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{
                padding: "8px 14px", borderRadius: 4,
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--fg-muted)",
                fontSize: 12, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          style={{
            padding: "10px 20px", borderRadius: 4,
            background: "var(--danger-bg)",
            border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
            color: "var(--danger)",
            fontSize: 13, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ■ Fechar Turno
        </button>
      )}
    </div>
  );
}

export function TurnoControles({ turnoAtual }: { turnoAtual: Turno | null }) {
  if (turnoAtual) {
    return <FecharTurnoButton turnoId={turnoAtual.id} />;
  }
  return <AbrirTurnoButton />;
}
