"use client";

import { useState, useTransition } from "react";
import { criarCliente } from "@/lib/clientes/actions";

const BTN_PRIMARY = {
  background: "var(--accent)", color: "var(--accent-fg)", border: "none",
  borderRadius: 999, padding: "10px 24px", fontSize: 15,
  fontWeight: 500, cursor: "pointer",
} as const;

const INPUT = {
  width: "100%", boxSizing: "border-box" as const,
  background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "8px 12px", fontSize: 14,
  color: "var(--fg)", outline: "none",
};

export function NovoClienteButton() {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: "", telefone: "", email: "",
    data_nascimento: "", drink_favorito: "", restricoes: "", notas: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function salvar() {
    if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setErro(null);
    startTransition(async () => {
      const res = await criarCliente(form);
      if ("error" in res) { setErro(res.error); return; }
      setForm({ nome: "", telefone: "", email: "", data_nascimento: "", drink_favorito: "", restricoes: "", notas: "" });
      setAberto(false);
    });
  }

  return (
    <>
      <button style={BTN_PRIMARY} onClick={() => setAberto(true)}>
        + Novo cliente
      </button>

      {aberto && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
          onClick={e => { if (e.target === e.currentTarget) setAberto(false); }}
        >
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 32, width: 480, maxWidth: "calc(100vw - 32px)",
          }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "var(--fg)" }}>
              Novo cliente
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {([
                ["Nome*", "nome", "text"],
                ["Telefone", "telefone", "tel"],
                ["E-mail", "email", "email"],
                ["Aniversário", "data_nascimento", "date"],
                ["Drink favorito", "drink_favorito", "text"],
                ["Restrições / alergias", "restricoes", "text"],
              ] as const).map(([label, key, type]) => (
                <div key={key} style={key === "nome" ? { gridColumn: "1 / -1" } : {}}>
                  <label style={{ fontSize: 12, color: "var(--fg-subtle)", display: "block", marginBottom: 6 }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    style={INPUT}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, color: "var(--fg-subtle)", display: "block", marginBottom: 6 }}>
                  Notas
                </label>
                <textarea
                  value={form.notas}
                  onChange={e => set("notas", e.target.value)}
                  rows={2}
                  style={{ ...INPUT, resize: "none" }}
                />
              </div>
            </div>

            {erro && (
              <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 12px" }}>{erro}</p>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setAberto(false)}
                style={{
                  background: "transparent", color: "var(--fg)",
                  border: "1px solid var(--border-strong)", borderRadius: 999,
                  padding: "10px 24px", fontSize: 15, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={isPending || !form.nome.trim()}
                style={BTN_PRIMARY}
              >
                {isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
