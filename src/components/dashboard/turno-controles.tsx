"use client";

import { useActionState } from "react";
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
        <p style={{ fontSize: 12, color: "rgba(239,68,68,0.9)", marginBottom: 8, textAlign: "right" }}>
          {state.error}
        </p>
      )}
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 20px", borderRadius: 10,
            background: "#260078", color: "white",
            border: "none", fontSize: 13, fontWeight: 700,
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

  return (
    <div>
      {state?.error && (
        <p style={{ fontSize: 12, color: "rgba(239,68,68,0.9)", marginBottom: 8, textAlign: "right", maxWidth: 280 }}>
          {state.error}
        </p>
      )}
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "rgba(239,68,68,0.9)",
            fontSize: 13, fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Fechando…" : "■ Fechar Turno"}
        </button>
      </form>
    </div>
  );
}

export function TurnoControles({ turnoAtual }: { turnoAtual: Turno | null }) {
  if (turnoAtual) {
    return <FecharTurnoButton turnoId={turnoAtual.id} />;
  }
  return <AbrirTurnoButton />;
}
