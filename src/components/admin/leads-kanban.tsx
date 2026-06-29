"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import type { Lead } from "@/lib/admin/queries";
import { updateLead, deleteLead } from "@/lib/admin/actions";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STAGES = [
  { id: "novo",       label: "Novo",       color: "#3b82f6" },
  { id: "contatado",  label: "Contatado",  color: "var(--accent)" },
  { id: "demo",       label: "Demo",       color: "#8b5cf6" },
  { id: "convertido", label: "Convertido", color: "var(--ok)" },
  { id: "perdido",    label: "Perdido",    color: "var(--fg-subtle)" },
] as const;

type StageId = typeof STAGES[number]["id"];

const ORIGEM_OPTIONS = ["Site", "Prospecção ativa", "Indicação", "Evento", "Instagram", "Outro"];
const TIPO_OPTIONS   = ["Coquetelaria", "Wine Bar", "Speakeasy", "Gastrobar", "Outro"];

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "var(--fg)",
  outline: "none", fontFamily: "var(--font-sans)", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--fg-subtle)", display: "block", marginBottom: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageColor(id: string) {
  return STAGES.find(s => s.id === id)?.color ?? "var(--fg-subtle)";
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.substring(0, 10);
}

function fromDateInput(val: string): string | null {
  if (!val) return null;
  return new Date(val + "T12:00:00").toISOString();
}

// ─── Follow-up badge ──────────────────────────────────────────────────────────

function FollowUpChip({ date }: { date: string }) {
  const d = new Date(date);
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const color = diffDays < 0 ? "var(--danger)" : diffDays <= 2 ? "var(--warn)" : "var(--fg-subtle)";
  const label = diffDays < 0 ? `${Math.abs(diffDays)}d atrasado`
    : diffDays === 0 ? "Hoje"
    : diffDays === 1 ? "Amanhã"
    : `${diffDays}d`;
  return (
    <span style={{ fontSize: 10, color, fontWeight: diffDays <= 0 ? 700 : 400 }}>
      ⏰ {label}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function LeadCard({
  lead, onClick, onDragStart, isDragging,
}: {
  lead: Lead;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${stageColor(lead.status)}`,
        borderRadius: 8,
        padding: "12px 12px 10px",
        cursor: "grab",
        userSelect: "none",
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 150ms, box-shadow 150ms",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", margin: "0 0 1px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lead.nome_bar}
      </p>
      <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {[lead.cidade, lead.tipo_bar].filter(Boolean).join(" · ")}
      </p>

      {lead.nome_responsavel && (
        <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "0 0 4px" }}>{lead.nome_responsavel}</p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        {lead.whatsapp && (
          <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: "var(--ok)", textDecoration: "none" }}>
            {lead.whatsapp}
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: "var(--fg-muted)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
            {lead.email}
          </a>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {lead.follow_up_at && <FollowUpChip date={lead.follow_up_at} />}
        {lead.origem && (
          <span style={{
            fontSize: 10, color: "var(--fg-subtle)",
            background: "color-mix(in srgb, var(--fg) 6%, transparent)",
            borderRadius: 4, padding: "1px 6px",
          }}>
            {lead.origem}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </div>
  );
}

// ─── Slide-over Panel ─────────────────────────────────────────────────────────

function LeadPanel({
  lead,
  onClose,
  onUpdate,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (l: Lead) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({ ...lead });
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Reset form when lead changes
  useEffect(() => { setForm({ ...lead }); setDeleteConfirm(false); setError(null); }, [lead.id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleStageClick(stage: StageId) {
    setForm(prev => ({ ...prev, status: stage }));
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function handleSave() {
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const payload = {
        nome_bar: form.nome_bar.trim(),
        cidade: form.cidade?.trim() || "",
        tipo_bar: form.tipo_bar,
        whatsapp: form.whatsapp?.trim() || null,
        email: form.email?.trim() || null,
        instagram: form.instagram?.trim() || null,
        site: form.site?.trim() || null,
        nome_responsavel: form.nome_responsavel?.trim() || null,
        status: form.status,
        notas: form.notas?.trim() || null,
        follow_up_at: fromDateInput(toDateInput(form.follow_up_at)),
        origem: form.origem || null,
      };
      const result = await updateLead(lead.id, payload);
      if ("error" in result) {
        setError(result.error);
      } else {
        onUpdate({ ...lead, ...payload, follow_up_at: payload.follow_up_at });
      }
      setSaving(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteLead(lead.id);
      onDelete(lead.id);
      handleClose();
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.4)",
          opacity: visible ? 1 : 0,
          transition: "opacity 250ms",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 440, zIndex: 201,
        background: "var(--bg-elevated)",
        borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 250ms cubic-bezier(0.32, 0.72, 0, 1)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: "0 0 2px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Lead</p>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lead.nome_bar}
              </h2>
            </div>
            <button onClick={handleClose} style={{
              background: "none", border: "none", color: "var(--fg-subtle)",
              cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 2px", flexShrink: 0, marginTop: 2,
            }}>×</button>
          </div>

          {/* Stage pills */}
          <div style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
            {STAGES.map(s => {
              const active = form.status === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStageClick(s.id)}
                  style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: active ? `1.5px solid ${s.color}` : "1.5px solid var(--border)",
                    background: active ? `color-mix(in srgb, ${s.color} 15%, transparent)` : "transparent",
                    color: active ? s.color : "var(--fg-subtle)",
                    transition: "all 120ms",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Nome do bar */}
            <div>
              <label style={labelStyle}>Nome do bar *</label>
              <input name="nome_bar" value={form.nome_bar} onChange={handleChange} style={inputStyle} />
            </div>

            {/* Cidade + Tipo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Cidade</label>
                <input name="cidade" value={form.cidade ?? ""} onChange={handleChange} placeholder="São Paulo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select name="tipo_bar" value={form.tipo_bar} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                  {TIPO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Responsável */}
            <div>
              <label style={labelStyle}>Responsável</label>
              <input name="nome_responsavel" value={form.nome_responsavel ?? ""} onChange={handleChange} placeholder="Nome do contato" style={inputStyle} />
            </div>

            {/* WhatsApp + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input name="whatsapp" value={form.whatsapp ?? ""} onChange={handleChange} placeholder="(11) 99999-9999" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input name="email" type="email" value={form.email ?? ""} onChange={handleChange} placeholder="email@bar.com" style={inputStyle} />
              </div>
            </div>

            {/* Instagram + Site */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Instagram</label>
                <input name="instagram" value={form.instagram ?? ""} onChange={handleChange} placeholder="@nomedobar" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Site</label>
                <input name="site" value={form.site ?? ""} onChange={handleChange} placeholder="nomedobar.com.br" style={inputStyle} />
              </div>
            </div>

            {/* Origem + Follow-up */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Origem</label>
                <select name="origem" value={form.origem ?? ""} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Não informado</option>
                  {ORIGEM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Follow-up</label>
                <input
                  name="follow_up_at"
                  type="date"
                  value={toDateInput(form.follow_up_at)}
                  onChange={e => setForm(prev => ({ ...prev, follow_up_at: e.target.value || null }))}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label style={labelStyle}>Notas</label>
              <textarea
                name="notas"
                value={form.notas ?? ""}
                onChange={handleChange}
                rows={4}
                placeholder="Observações, próximos passos..."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            {/* Data de criação (read-only) */}
            <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: 0, fontFamily: "var(--font-mono)" }}>
              Lead desde {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>

            {error && <p style={{ fontSize: 12, color: "var(--danger)", margin: 0 }}>{error}</p>}

          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        }}>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              background: "none", border: "none", fontSize: 12,
              color: "var(--danger)", cursor: "pointer", padding: "4px 0",
              opacity: 0.7,
            }}>
              Excluir lead
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>Confirmar?</span>
              <button onClick={handleDelete} style={{
                background: "var(--danger)", border: "none", borderRadius: 5,
                padding: "4px 10px", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 600,
              }}>Excluir</button>
              <button onClick={() => setDeleteConfirm(false)} style={{
                background: "none", border: "none", fontSize: 12,
                color: "var(--fg-subtle)", cursor: "pointer",
              }}>Cancelar</button>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={handleClose} style={{
              background: "none", border: "1px solid var(--border)", borderRadius: 6,
              padding: "7px 14px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer",
            }}>
              Fechar
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              background: "var(--accent)", border: "none", borderRadius: 6,
              padding: "7px 18px", fontSize: 13, fontWeight: 700, color: "#000",
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
            }}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function LeadsKanban({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedLead = selectedId ? (leads.find(l => l.id === selectedId) ?? null) : null;

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverStage(null);
    if (!id) return;
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.status === stageId) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: stageId } : l));
    startTransition(async () => { await updateLead(id, { status: stageId }); });
  }

  function handleLeadUpdate(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  }

  function handleLeadDelete(id: string) {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedId(null);
  }

  return (
    <>
      {/* Total */}
      <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 16px", fontFamily: "var(--font-mono)" }}>
        {leads.length} lead{leads.length !== 1 ? "s" : ""} no pipeline
      </p>

      {/* Board */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        overflowX: "auto", paddingBottom: 16, minHeight: "calc(100vh - 200px)",
      }}>
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          const isOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null);
              }}
              onDrop={e => handleDrop(e, stage.id)}
              style={{
                flex: "0 0 230px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: isOver ? "color-mix(in srgb, var(--fg) 3%, transparent)" : "color-mix(in srgb, var(--fg) 1.5%, transparent)",
                border: isOver ? `1px dashed ${stage.color}` : "1px solid var(--border)",
                borderRadius: 10,
                padding: "0 8px 8px",
                transition: "background 120ms, border-color 120ms",
                minHeight: 120,
              }}
            >
              {/* Column header */}
              <div style={{
                position: "sticky", top: 0,
                background: "var(--bg)", borderRadius: "10px 10px 0 0",
                padding: "12px 4px 10px", zIndex: 1,
                borderBottom: `2px solid ${stage.color}`,
                marginBottom: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)", flex: 1, letterSpacing: "-0.01em" }}>
                    {stage.label}
                  </span>
                  <span style={{
                    fontSize: 10, color: "#fff",
                    background: stage.color === "var(--fg-subtle)" ? "var(--fg-subtle)" : stage.color,
                    borderRadius: 99, padding: "1px 7px", fontFamily: "var(--font-mono)", fontWeight: 700,
                    opacity: stageLeads.length === 0 ? 0.3 : 1,
                  }}>
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              {stageLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isDragging={draggingId === lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  onDragStart={e => handleDragStart(e, lead.id)}
                />
              ))}

              {stageLeads.length === 0 && (
                <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--fg-subtle)", fontSize: 11, opacity: 0.4 }}>
                  vazio
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide-over */}
      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          onClose={() => setSelectedId(null)}
          onUpdate={handleLeadUpdate}
          onDelete={handleLeadDelete}
        />
      )}
    </>
  );
}
