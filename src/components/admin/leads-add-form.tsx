"use client";

import { useState, useTransition } from "react";
import { createLeadAdmin } from "@/lib/admin/actions";

const TIPO_OPTIONS = ["Coquetelaria", "Wine Bar", "Speakeasy", "Gastrobar", "Outro"];

const EMPTY = {
  nome_bar: "", cidade: "São Paulo", tipo_bar: "Coquetelaria",
  nome_responsavel: "", whatsapp: "", email: "", instagram: "", site: "", notas: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--fg)",
  outline: "none",
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--fg-subtle)",
  display: "block",
  marginBottom: 6,
};

export function LeadsAddForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_bar.trim()) {
      setError("Nome do bar é obrigatório.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createLeadAdmin(form);
      if ("error" in result) {
        setError(result.error);
      } else {
        setForm(EMPTY);
        setOpen(false);
      }
    });
  }

  return (
    <>
      {/* Botão */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "var(--accent)",
          color: "#000",
          border: "none",
          borderRadius: 6,
          padding: "7px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}
      >
        + Adicionar lead
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "28px 28px",
            width: 440,
            maxWidth: "90vw",
            maxHeight: "90dvh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", margin: 0 }}>Novo lead</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "var(--fg-subtle)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Nome do bar */}
              <div>
                <label style={labelStyle}>Nome do bar *</label>
                <input name="nome_bar" value={form.nome_bar} onChange={handleChange} placeholder="Ex: Bar das Flores" style={inputStyle} />
              </div>

              {/* Cidade + Tipo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Cidade</label>
                  <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="São Paulo" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select name="tipo_bar" value={form.tipo_bar} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                    {TIPO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Nome responsável */}
              <div>
                <label style={labelStyle}>Nome do responsável</label>
                <input name="nome_responsavel" value={form.nome_responsavel} onChange={handleChange} placeholder="Ex: João Silva" style={inputStyle} />
              </div>

              {/* WhatsApp + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="(11) 99999-9999" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contato@bar.com" style={inputStyle} />
                </div>
              </div>

              {/* Instagram + Site */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="@nomedobar" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Site</label>
                  <input name="site" value={form.site} onChange={handleChange} placeholder="https://nomedobar.com.br" style={inputStyle} />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Observações sobre o lead..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "var(--danger)", margin: 0 }}>{error}</p>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "7px 14px",
                    fontSize: 13,
                    color: "var(--fg-muted)",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: 6,
                    padding: "7px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#000",
                    cursor: "pointer",
                  }}
                >
                  Salvar lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
