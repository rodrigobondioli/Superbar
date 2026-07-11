"use client";

import { useState, useTransition, useRef, useEffect, Fragment } from "react";
import type { Lead, Stage } from "@/lib/admin/queries";
import { updateLead, deleteLead, updateStageLabel } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ORIGEM_OPTIONS = ["Site", "Prospecção ativa", "Indicação", "Evento", "Instagram", "Outro"];
const TIPO_OPTIONS   = ["Coquetelaria", "Wine Bar", "Speakeasy", "Gastrobar", "Outro"];

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "var(--fg)",
  outline: "none", fontFamily: "var(--font-sans)", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", display: "block", marginBottom: 6,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.substring(0, 10);
}

function fromDateInput(val: string): string | null {
  if (!val) return null;
  return new Date(val + "T12:00:00").toISOString();
}

// ─── Ordenação manual ──────────────────────────────────────────────────────────

function ordemOf(l: Lead): number {
  return l.ordem ?? Date.parse(l.created_at);
}

// Linha fina que indica onde o card vai cair.
function InsertLine() {
  return <div style={{ height: 2, borderRadius: 999, background: "var(--accent)", margin: "1px 2px" }} />;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function LeadCard({
  lead, onClick, onDragStart, onDragEnd, isDragging,
}: {
  lead: Lead;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 14px 12px",
        cursor: "grab",
        userSelect: "none",
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 150ms, border-color 150ms",
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: "0 0 4px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lead.nome_bar}
      </p>
      {/* Card enxuto: nome, cidade · tipo e data. O resto (responsável, contatos,
          origem, follow-up) vive só no painel de detalhe. */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {[lead.cidade, lead.tipo_bar].filter(Boolean).join(" · ")}
        </p>
        <span style={{ fontSize: 12, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </div>
  );
}

// ─── Slide-over Panel ─────────────────────────────────────────────────────────

function LeadPanel({
  lead,
  stages,
  onClose,
  onUpdate,
  onDelete,
}: {
  lead: Lead;
  stages: Stage[];
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

  function handleStageClick(stage: string) {
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
        width: 520, zIndex: 201,
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
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 2px" }}>Lead</p>
              <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            {stages.map(s => {
              const active = form.status === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStageClick(s.id)}
                  style={{
                    padding: "5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    border: active ? "1px solid var(--accent)" : "1px solid var(--border-strong)",
                    background: active ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
                    color: active ? "var(--accent)" : "var(--fg-muted)",
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
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
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
                background: "var(--danger)", border: "none", borderRadius: 999,
                padding: "6px 14px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 500,
              }}>Excluir</button>
              <button onClick={() => setDeleteConfirm(false)} style={{
                background: "none", border: "none", fontSize: 12,
                color: "var(--fg-subtle)", cursor: "pointer",
              }}>Cancelar</button>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={handleClose} style={BTN_SECONDARY}>
              Fechar
            </button>
            <button onClick={handleSave} disabled={saving} style={{ ...BTN_PRIMARY, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function LeadsKanban({ leads: initial, stages }: { leads: Lead[]; stages: Stage[] }) {
  const [leads, setLeads] = useState(initial);
  const [stagesState, setStagesState] = useState(stages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ stage: string; beforeId: string | null } | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [, startTransition] = useTransition();

  const selectedLead = selectedId ? (leads.find(l => l.id === selectedId) ?? null) : null;

  // Sincroniza estágios quando o servidor revalida (ex.: após renomear).
  useEffect(() => { setStagesState(stages); }, [stages]);

  function startStageEdit(stage: Stage) {
    setEditingStageId(stage.id);
    setDraftLabel(stage.label);
  }

  function saveStageLabel() {
    const id = editingStageId;
    setEditingStageId(null);
    if (!id) return;
    const label = draftLabel.trim();
    const current = stagesState.find(s => s.id === id);
    if (!label || !current || current.label === label) return;
    setStagesState(prev => prev.map(s => s.id === id ? { ...s, label } : s));
    startTransition(async () => { await updateStageLabel(id, label); });
  }

  // Mantém a lista em dia quando o servidor revalida (ex.: após adicionar lead
  // manualmente, o createLeadAdmin revalida a rota → chega uma nova prop aqui).
  // Isso garante o "aparecer sem refresh" mesmo se o realtime falhar.
  useEffect(() => { setLeads(initial); }, [initial]);

  // Realtime: leads que chegam pelo form da landing aparecem sem refresh.
  // O socket precisa da sessão do admin para passar pela RLS de SELECT de leads.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      if (cancelled) return;
      channel = supabase
        .channel("leads-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "leads" },
          (payload) => {
            const newLead = payload.new as Lead;
            setLeads(prev => prev.some(l => l.id === newLead.id) ? prev : [newLead, ...prev]);
          }
        )
        .subscribe();
    })();

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, []);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
    setDropTarget(null);
  }

  // Enquanto arrasta por cima de um card, decide se a inserção fica antes ou depois dele.
  function handleCardOver(e: React.DragEvent, stageId: string, lead: Lead, idx: number, list: Lead[]) {
    e.preventDefault();
    e.stopPropagation();
    if (lead.id === draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    let nextId = list[idx + 1]?.id ?? null;
    if (nextId === draggingId) nextId = list[idx + 2]?.id ?? null;
    setDragOverStage(stageId);
    setDropTarget({ stage: stageId, beforeId: before ? lead.id : nextId });
  }

  function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    const target = dropTarget;
    setDraggingId(null);
    setDragOverStage(null);
    setDropTarget(null);
    if (!id) return;
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    // Coluna destino, como aparece na tela, sem o card arrastado.
    const without = leads
      .filter(l => l.status === stageId && l.id !== id)
      .sort((a, b) => ordemOf(b) - ordemOf(a));

    const beforeId = target && target.stage === stageId ? target.beforeId : null;
    let at = beforeId ? without.findIndex(l => l.id === beforeId) : without.length;
    if (at < 0) at = without.length;

    const above = without[at - 1]; // acima → ordem maior
    const below = without[at];     // abaixo → ordem menor
    let novaOrdem: number;
    if (!above && !below) novaOrdem = Date.now();
    else if (!above) novaOrdem = ordemOf(below) + 1000;
    else if (!below) novaOrdem = ordemOf(above) - 1000;
    else novaOrdem = (ordemOf(above) + ordemOf(below)) / 2;

    if (lead.status === stageId && lead.ordem === novaOrdem) return;

    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: stageId, ordem: novaOrdem } : l));
    startTransition(async () => { await updateLead(id, { status: stageId, ordem: novaOrdem }); });
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
      {/* Board */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        overflowX: "auto", paddingBottom: 16, minHeight: "calc(100vh - 200px)",
      }}>
        {stagesState.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id).sort((a, b) => ordemOf(b) - ordemOf(a));
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
                flex: "0 0 240px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: isOver ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "color-mix(in srgb, var(--fg) 2%, transparent)",
                border: isOver ? "1px dashed var(--accent)" : "1px solid var(--border)",
                borderRadius: 12,
                padding: "0 10px 10px",
                transition: "background 120ms, border-color 120ms",
                minHeight: 120,
              }}
            >
              {/* Column header */}
              <div style={{
                position: "sticky", top: 0,
                background: "var(--bg)", borderRadius: "12px 12px 0 0",
                padding: "14px 4px 10px", zIndex: 1,
                borderBottom: "1px solid var(--border-strong)",
                marginBottom: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {editingStageId === stage.id ? (
                    <input
                      autoFocus
                      value={draftLabel}
                      onChange={e => setDraftLabel(e.target.value)}
                      onBlur={saveStageLabel}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveStageLabel();
                        if (e.key === "Escape") setEditingStageId(null);
                      }}
                      style={{
                        flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: "var(--fg)",
                        background: "var(--bg-card-hi)", border: "1px solid var(--accent)",
                        borderRadius: 6, padding: "2px 6px", outline: "none",
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => startStageEdit(stage)}
                      title="Clique para renomear"
                      style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", flex: 1, cursor: "text" }}
                    >
                      {stage.label}
                    </span>
                  )}
                  <span style={{
                    fontSize: 12, color: "var(--fg-muted)",
                    background: "color-mix(in srgb, var(--fg) 8%, transparent)",
                    borderRadius: 999, padding: "1px 8px", fontVariantNumeric: "tabular-nums",
                    opacity: stageLeads.length === 0 ? 0.45 : 1,
                  }}>
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              {stageLeads.map((lead, idx) => (
                <Fragment key={lead.id}>
                  {dropTarget?.stage === stage.id && dropTarget.beforeId === lead.id && <InsertLine />}
                  <div onDragOver={e => handleCardOver(e, stage.id, lead, idx, stageLeads)}>
                    <LeadCard
                      lead={lead}
                      isDragging={draggingId === lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      onDragStart={e => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                </Fragment>
              ))}
              {dropTarget?.stage === stage.id && dropTarget.beforeId === null && stageLeads.length > 0 && <InsertLine />}

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
          stages={stagesState}
          onClose={() => setSelectedId(null)}
          onUpdate={handleLeadUpdate}
          onDelete={handleLeadDelete}
        />
      )}
    </>
  );
}
