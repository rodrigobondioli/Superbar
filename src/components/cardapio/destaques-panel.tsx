"use client";

import { useState } from "react";
import { X, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { ImageUpload } from "./image-upload";
import { criarDestaque, deletarDestaque } from "@/lib/destaques/actions";
import type { Destaque } from "@/types/database";

const input: React.CSSProperties = {
  background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 4,
  padding: "10px 12px", fontSize: 14, color: "var(--fg)", outline: "none",
  colorScheme: "dark", width: "100%", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase",
  letterSpacing: "0.08em", marginBottom: 6, display: "block", fontWeight: 500,
};

export function DestaquesPanel({
  open, onClose, destaques, produtos,
}: {
  open: boolean;
  onClose: () => void;
  destaques: Destaque[];
  produtos: { id: string; nome: string }[];
}) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [deletando, setDeletando] = useState<string | null>(null);

  async function handleSubmit(fd: FormData) {
    fd.set("imagem_url", imagemUrl ?? "");
    setSalvando(true);
    await criarDestaque(fd);
    setSalvando(false);
    setImagemUrl(null);
    setFormKey((k) => k + 1);
    toast("Destaque adicionado.", "ok");
  }

  async function handleDelete(id: string) {
    setDeletando(id);
    try { await deletarDestaque(id); toast("Destaque removido.", "ok"); }
    catch { toast("Erro ao remover.", "error"); }
    finally { setDeletando(null); }
  }

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)" }} />}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Destaques da vitrine"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(94vw, 520px)", zIndex: 100,
          background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Destaques da vitrine</h2>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "2px 0 0" }}>Banners no topo do cardápio do cliente. Evento, drink novo, o que quiser.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-subtle)", padding: 6 }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Novo destaque */}
          <form key={formKey} action={handleSubmit} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ marginBottom: 14 }}>
              <span style={lbl}>Imagem do banner</span>
              <ImageUpload onUpload={setImagemUrl} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Título</label>
              <input name="titulo" placeholder="Ex: Noite de Jazz · Quinta" style={input} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Subtítulo (opcional)</label>
              <input name="subtitulo" placeholder="Ex: A partir das 21h, sem couvert" style={input} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Levar a um drink (opcional)</label>
              <select name="produto_id" style={{ ...input, colorScheme: "dark" }} defaultValue="">
                <option value="">Nenhum — só o banner</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <button type="submit" disabled={salvando} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: salvando ? "wait" : "pointer" }}>
              {salvando ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Plus style={{ width: 14, height: 14 }} />}
              Adicionar destaque
            </button>
          </form>

          {/* Lista */}
          {destaques.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", textAlign: "center", padding: "20px 0" }}>Nenhum destaque ainda. O primeiro vira o banner do topo.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {destaques.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                  <div style={{ width: 64, height: 44, borderRadius: 6, flexShrink: 0, background: d.imagem_url ? `url(${d.imagem_url}) center/cover` : "var(--bg-inset)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titulo}</p>
                    {d.subtitulo && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--fg-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.subtitulo}</p>}
                  </div>
                  <button onClick={() => handleDelete(d.id)} disabled={deletando === d.id} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 6, flexShrink: 0 }} title="Remover">
                    {deletando === d.id ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : <Trash2 style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
