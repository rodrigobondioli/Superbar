"use client";

import { useActionState, useRef, useEffect } from "react";
import { adicionarMembro } from "@/lib/equipe/actions";
import { CARD, LABEL, BTN_PRIMARY, INPUT } from "@/lib/ui";

export function ConvidarForm() {
  const [state, action, pending] = useActionState(adicionarMembro, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o form depois de sucesso
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div style={{ ...CARD, padding: "20px 22px" }}>
      <p style={{ ...LABEL, marginBottom: 16 }}>Adicionar membro</p>

      {state?.error && (
        <div style={{
          background: "var(--danger-bg)",
          border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
          borderRadius: 4, padding: "10px 14px", marginBottom: 14,
        }}>
          <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{state.error}</p>
        </div>
      )}

      {state?.ok && (
        <div style={{
          background: "var(--ok-bg)",
          border: "1px solid color-mix(in srgb, var(--ok) 30%, transparent)",
          borderRadius: 4, padding: "10px 14px", marginBottom: 14,
        }}>
          <p style={{ fontSize: 13, color: "var(--ok)", margin: 0 }}>Membro adicionado com sucesso!</p>
        </div>
      )}

      <form ref={formRef} action={action}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_160px_auto] gap-2.5 items-end">
          <div>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Nome</label>
            <input name="nome" type="text" placeholder="João" style={INPUT} />
          </div>
          <div>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Sobrenome</label>
            <input name="sobrenome" type="text" placeholder="Silva" style={INPUT} />
          </div>
          <div>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Função *</label>
            <select name="role" defaultValue="bartender" style={{ ...INPUT, colorScheme: "dark" }}>
              <option value="gerente">Gerente</option>
              <option value="bar_manager">Bar Manager</option>
              <option value="bartender">Bartender</option>
              <option value="garcom">Garçom</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>
          <button type="submit" disabled={pending} style={{ ...BTN_PRIMARY, marginBottom: 1, opacity: pending ? 0.7 : 1 }}>
            {pending ? "Adicionando…" : "+ Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}
