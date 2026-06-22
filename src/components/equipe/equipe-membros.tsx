"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { alterarRole, desativarMembro, reativarMembro, removerMembro } from "@/lib/equipe/actions";
import { toast } from "@/components/ui/toaster";
import { CARD, LABEL, BTN_ICON } from "@/lib/ui";
import type { BarRole } from "@/types/database";

export type MembroRow = {
  id: string;
  userId: string | null;
  nome: string;
  role: BarRole;
  ativo: boolean;
  totalComandas: number;
  totalVendas: number;
  ticketMedio: number;
};

const ROLE_LABELS: Record<BarRole, string> = {
  dono: "Dono", gerente: "Gerente", bar_manager: "Bar Manager", bartender: "Bartender", garcom: "Garçom", caixa: "Caixa",
};

// Color by role — small text identity indicator (minimal exception)
const ROLE_COLORS: Record<BarRole, string> = {
  dono:        "var(--fg)",
  gerente:     "var(--accent-bright)",
  bar_manager: "var(--fg-muted)",
  bartender:   "var(--fg-muted)",
  garcom:      "var(--fg-muted)",
  caixa:       "var(--fg-muted)",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const lbl: React.CSSProperties = { ...LABEL, margin: 0 };

// ─── Single member row ────────────────────────────────────────────────────────
function MembroRow({
  m, isDono, currentUserId,
}: {
  m: MembroRow;
  isDono: boolean;
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<BarRole>(m.role);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [, startTransition] = useTransition();
  const isOwn    = m.userId === currentUserId;
  const canEdit  = isDono && !isOwn;

  async function saveRole() {
    setSaving(true);
    try {
      await alterarRole(m.id, role);
      toast("Função atualizada.", "ok");
    } catch {
      toast("Erro ao alterar função.", "error");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  async function handleToggleAtivo() {
    if (toggling) return;
    setToggling(true);
    try {
      if (m.ativo) {
        await desativarMembro(m.id);
        toast(`${m.nome} desativado.`, "ok");
      } else {
        await reativarMembro(m.id);
        toast(`${m.nome} reativado.`, "ok");
      }
    } catch {
      toast("Erro ao alterar acesso.", "error");
    } finally {
      setToggling(false);
    }
  }

  async function handleRemover() {
    if (removing) return;
    if (!window.confirm(`Remover ${m.nome} da equipe permanentemente?`)) return;
    setRemoving(true);
    try {
      await removerMembro(m.id);
      toast(`${m.nome} removido.`, "ok");
    } catch {
      toast("Erro ao remover membro.", "error");
      setRemoving(false);
    }
  }

  return (
    <div
      className="flex flex-row items-center gap-3 px-4 py-3.5 lg:grid lg:grid-cols-[1fr_160px_80px_88px] lg:gap-3 lg:px-[18px] lg:py-[13px]"
      style={{ opacity: m.ativo ? 1 : 0.5 }}
    >
      {/* Info */}
      <div className="flex-1 min-w-0" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "color-mix(in srgb, var(--fg) 10%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "var(--fg)",
        }}>
          {m.nome[0]?.toUpperCase() ?? "?"}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {m.nome}
        </p>
      </div>

      {/* Role — editável inline */}
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select
            value={role}
            onChange={e => setRole(e.target.value as BarRole)}
            style={{
              flex: 1, background: "var(--bg-inset)", border: "1px solid var(--border)",
              borderRadius: 4, padding: "4px 8px", fontSize: 12, color: "var(--fg)",
              outline: "none", colorScheme: "dark",
            }}
          >
            <option value="dono">Dono</option>
            <option value="gerente">Gerente</option>
            <option value="bar_manager">Bar Manager</option>
            <option value="bartender">Bartender</option>
            <option value="garcom">Garçom</option>
            <option value="caixa">Caixa</option>
          </select>
          <button onClick={saveRole} disabled={saving} style={{ ...BTN_ICON, color: "var(--ok)", padding: 4 }}>
            <Check style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={() => { setEditing(false); setRole(m.role); }} style={{ ...BTN_ICON, padding: 4 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      ) : (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 4,
          background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: ROLE_COLORS[m.role], display: "inline-block",
        }}>
          {ROLE_LABELS[m.role]}
        </span>
      )}

      {/* Vendas — desktop only */}
      <span className="hidden lg:block" style={{ fontSize: 12, color: "var(--fg-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
        {m.totalComandas > 0 ? fmt(m.totalVendas) : "—"}
      </span>

      {/* Ações */}
      {canEdit ? (
        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          {/* Editar role */}
          <button
            onClick={() => setEditing(e => !e)}
            style={{ ...BTN_ICON, color: editing ? "var(--accent-bright)" : "var(--fg-subtle)" }}
            title="Editar função"
          >
            <Pencil style={{ width: 13, height: 13 }} />
          </button>

          {/* Toggle ativo/inativo */}
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleAtivo}
            style={{ ...BTN_ICON, color: m.ativo ? "var(--fg-muted)" : "var(--fg-subtle)", opacity: toggling ? 0.5 : 1 }}
            title={m.ativo ? "Desativar acesso" : "Reativar acesso"}
          >
            {toggling
              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              : m.ativo
                ? <EyeOff style={{ width: 13, height: 13 }} />
                : <Eye style={{ width: 13, height: 13 }} />}
          </button>

          {/* Deletar */}
          <button
            type="button"
            disabled={removing}
            onClick={handleRemover}
            style={{ ...BTN_ICON, color: "var(--danger)", opacity: removing ? 0.5 : 1 }}
            title="Remover permanentemente"
          >
            {removing
              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              : <Trash2 style={{ width: 13, height: 13 }} />}
          </button>
        </div>
      ) : <span className="hidden lg:block" />}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function EquipeMembros({
  ativos, inativos, isDono, currentUserId,
}: {
  ativos: MembroRow[];
  inativos: MembroRow[];
  isDono: boolean;
  currentUserId: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Membros ativos */}
      <div>
        <p style={{ ...LABEL, marginBottom: 12 }}>Membros ativos</p>
        <div style={{ ...CARD, overflow: "hidden" }}>
          {/* Col header — desktop only */}
          <div
            className="hidden lg:grid lg:grid-cols-[1fr_160px_80px_88px] gap-3 px-[18px] py-[10px] border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={lbl}>Nome</span>
            <span style={lbl}>Função</span>
            <span style={{ ...lbl, textAlign: "right" }}>Vendas</span>
            <span />
          </div>

          {ativos.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--fg-subtle)", padding: "24px 18px", margin: 0 }}>
              Nenhum membro ativo.
            </p>
          )}

          {ativos.map((m, i) => (
            <div key={m.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
              <MembroRow m={m} isDono={isDono} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      </div>

      {/* Desativados */}
      {inativos.length > 0 && (
        <div>
          <p style={{ ...LABEL, marginBottom: 12, color: "var(--fg-subtle)" }}>Sem acesso</p>
          <div style={{ ...CARD, overflow: "hidden" }}>
            {inativos.map((m, i) => (
              <div key={m.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <MembroRow m={m} isDono={isDono} currentUserId={currentUserId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
