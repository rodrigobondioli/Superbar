"use client";

import { useActionState, useRef, useEffect } from "react";
import { convidarMembro } from "@/lib/equipe/actions";
import { CARD, LABEL, BTN_PRIMARY, INPUT } from "@/lib/ui";

export function ConvidarForm() {
  const [state, action, pending] = useActionState(convidarMembro, null);
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
          background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
        }}>
          <p style={{ fontSize: 13, color: "rgba(239,68,68,0.9)", margin: 0 }}>{state.error}</p>
        </div>
      )}

      {state?.ok && (
        <div style={{
          background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
        }}>
          <p style={{ fontSize: 13, color: "rgba(52,211,153,0.9)", margin: 0 }}>Membro adicionado com sucesso!</p>
        </div>
      )}

      <form ref={formRef} action={action}>
        {/* Linha 1: Nome + Sobrenome */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Nome</label>
            <input name="nome" type="text" placeholder="João" style={INPUT} />
          </div>
          <div>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Sobrenome</label>
            <input name="sobrenome" type="text" placeholder="Silva" style={INPUT} />
          </div>
        </div>

        {/* Linha 2: E-mail + Função + Botão */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 10, alignItems: "flex-end" }}>
          <div>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>E-mail *</label>
            <input name="email" type="email" required placeholder="nome@email.com" style={INPUT} />
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
