"use client";

import { useState, useTransition } from "react";
import { createLeadAdmin } from "@/lib/admin/actions";
import { startLeadEnrich, getLeadEnrich } from "@/lib/leads/enrich";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui";

const TIPO_OPTIONS = ["Coquetelaria", "Wine Bar", "Speakeasy", "Gastrobar", "Outro"];

const EMPTY = {
  nome_bar: "", cidade: "São Paulo", tipo_bar: "Coquetelaria",
  nome_responsavel: "", whatsapp: "", email: "", instagram: "", site: "", notas: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--fg)",
  outline: "none",
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--fg-muted)",
  display: "block",
  marginBottom: 6,
};

export function LeadsAddForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Enriquecimento por Instagram (Firecrawl)
  const [igHandle, setIgHandle] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);
  const [enrichErr, setEnrichErr] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleEnrich() {
    const h = igHandle.trim();
    if (!h || enriching) return;
    setEnriching(true);
    setEnrichErr(false);
    setEnrichMsg("Procurando o bar…");

    const started = await startLeadEnrich(h);
    if ("error" in started) {
      setEnriching(false);
      setEnrichErr(true);
      setEnrichMsg(started.error);
      return;
    }

    // Poll até completar (~até 75s)
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const st = await getLeadEnrich(started.id);
      if (st.status === "completed") {
        const d = st.data;
        const clean = h.replace(/^@/, "").split(/[/?\s]/)[0];
        setForm(prev => ({
          ...prev,
          nome_bar: d.nome_bar || prev.nome_bar,
          cidade: d.cidade || prev.cidade,
          tipo_bar: d.tipo_bar || prev.tipo_bar,
          whatsapp: d.whatsapp || prev.whatsapp,
          email: d.email || prev.email,
          site: d.site || prev.site,
          nome_responsavel: d.nome_responsavel || prev.nome_responsavel,
          instagram: "@" + clean,
        }));
        const achou = [d.nome_bar, d.cidade, d.whatsapp, d.site].filter(Boolean).length;
        setEnriching(false);
        setEnrichErr(achou === 0);
        setEnrichMsg(achou > 0
          ? "Prontinho — confere e ajusta o que precisar antes de salvar."
          : "Achei pouca coisa nesse perfil. Preencha o resto na mão.");
        return;
      }
      if (st.status === "failed") {
        setEnriching(false);
        setEnrichErr(true);
        setEnrichMsg(st.error);
        return;
      }
    }
    setEnriching(false);
    setEnrichErr(true);
    setEnrichMsg("Demorou demais pra responder. Tenta de novo ou preenche na mão.");
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
        onClick={() => { setOpen(true); setIgHandle(""); setEnrichMsg(null); setEnrichErr(false); setForm(EMPTY); setError(null); }}
        style={{ ...BTN_PRIMARY, display: "inline-flex", alignItems: "center", gap: 6 }}
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
              <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>Novo lead</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "var(--fg-subtle)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Preencher pelo Instagram (Firecrawl) */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                <label style={labelStyle}>Preencher pelo Instagram</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={igHandle}
                    onChange={e => setIgHandle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleEnrich(); } }}
                    placeholder="@nomedobar"
                    disabled={enriching}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleEnrich}
                    disabled={enriching || !igHandle.trim()}
                    style={{ ...BTN_SECONDARY, padding: "10px 16px", opacity: enriching || !igHandle.trim() ? 0.6 : 1, cursor: enriching || !igHandle.trim() ? "not-allowed" : "pointer" }}
                  >
                    {enriching ? "Buscando…" : "Buscar dados"}
                  </button>
                </div>
                {enrichMsg && (
                  <p style={{ fontSize: 12, color: enrichErr ? "var(--danger)" : "var(--fg-muted)", margin: "8px 0 0" }}>
                    {enrichMsg}
                  </p>
                )}
              </div>

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
                <button type="button" onClick={() => setOpen(false)} style={BTN_SECONDARY}>
                  Cancelar
                </button>
                <button type="submit" style={BTN_PRIMARY}>
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
