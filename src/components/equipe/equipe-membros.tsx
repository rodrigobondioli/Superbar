"use client";

import { useState } from "react";
import { Pencil, Check, X, Trash2, Eye, EyeOff } from "lucide-react";
import { alterarRole, desativarMembro, reativarMembro, removerMembro } from "@/lib/equipe/actions";
import { CARD, LABEL, BTN_ICON, BTN_SECONDARY } from "@/lib/ui";
import type { BarRole } from "@/types/database";

export type MembroRow = {
  id: string;
  userId: string;
  nome: string;
  email: string;
  role: BarRole;
  ativo: boolean;
  totalComandas: number;
  totalVendas: number;
  ticketMedio: number;
};

const ROLE_LABELS: Record<BarRole, string> = {
  dono: "Dono", gerente: "Gerente", bartender: "Bartender", caixa: "Caixa",
};

const ROLE_COLORS: Record<BarRole, string> = {
  dono:      "rgba(255,255,255,0.90)",
  gerente:   "rgba(160,130,255,0.9)",
  bartender: "rgba(96,165,250,0.9)",
  caixa:     "rgba(251,191,36,0.9)",
};

const ROLE_BG: Record<BarRole, string> = {
  dono:      "rgba(38,0,120,0.20)",
  gerente:   "rgba(38,0,120,0.30)",
  bartender: "rgba(29,78,216,0.20)",
  caixa:     "rgba(120,80,0,0.25)",
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
  const isOwn = m.userId === currentUserId;
  const canEdit = isDono && m.role !== "dono" && !isOwn;

  async function saveRole() {
    setSaving(true);
    await alterarRole(m.id, role);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 160px 80px 88px",
      gap: 12, alignItems: "center",
      padding: "13px 18px",
      opacity: m.ativo ? 1 : 0.5,
    }}>
      {/* Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "white",
        }}>
          {m.nome[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.nome}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.email}
          </p>
        </div>
      </div>

      {/* Role — editável inline */}
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select
            value={role}
            onChange={e => setRole(e.target.value as BarRole)}
            style={{
              flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "white",
              outline: "none", colorScheme: "dark",
            }}
          >
            <option value="gerente">Gerente</option>
            <option value="bartender">Bartender</option>
            <option value="caixa">Caixa</option>
          </select>
          <button onClick={saveRole} disabled={saving} style={{ ...BTN_ICON, color: "rgba(74,222,128,0.9)", padding: 4 }}>
            <Check style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={() => { setEditing(false); setRole(m.role); }} style={{ ...BTN_ICON, padding: 4 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      ) : (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
          background: ROLE_BG[m.role], color: ROLE_COLORS[m.role], display: "inline-block",
        }}>
          {ROLE_LABELS[m.role]}
        </span>
      )}

      {/* Vendas */}
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {m.totalComandas > 0 ? fmt(m.totalVendas) : "—"}
      </span>

      {/* Ações */}
      {canEdit ? (
        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          {/* Editar role */}
          <button
            onClick={() => setEditing(e => !e)}
            style={{ ...BTN_ICON, color: editing ? "rgba(160,130,255,0.8)" : "rgba(255,255,255,0.30)" }}
            title="Editar função"
          >
            <Pencil style={{ width: 13, height: 13 }} />
          </button>

          {/* Toggle ativo/inativo */}
          <form action={m.ativo ? desativarMembro.bind(null, m.id) : reativarMembro.bind(null, m.id)}>
            <button
              type="submit"
              style={{ ...BTN_ICON, color: m.ativo ? "rgba(96,165,250,0.7)" : "rgba(74,222,128,0.7)" }}
              title={m.ativo ? "Desativar acesso" : "Reativar acesso"}
            >
              {m.ativo
                ? <EyeOff style={{ width: 13, height: 13 }} />
                : <Eye style={{ width: 13, height: 13 }} />}
            </button>
          </form>

          {/* Deletar */}
          <form action={removerMembro.bind(null, m.id)}>
            <button
              type="submit"
              onClick={e => { if (!window.confirm(`Remover ${m.nome} da equipe permanentemente?`)) e.preventDefault(); }}
              style={{ ...BTN_ICON, color: "rgba(239,68,68,0.55)" }}
              title="Remover permanentemente"
            >
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          </form>
        </div>
      ) : <span />}
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
          {/* Col header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 160px 80px 88px",
            gap: 12, padding: "10px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={lbl}>Nome</span>
            <span style={lbl}>Função</span>
            <span style={{ ...lbl, textAlign: "right" }}>Vendas</span>
            <span />
          </div>

          {ativos.length === 0 && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", padding: "24px 18px", margin: 0 }}>
              Nenhum membro ativo.
            </p>
          )}

          {ativos.map((m, i) => (
            <div key={m.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
              <MembroRow m={m} isDono={isDono} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      </div>

      {/* Inativos */}
      {inativos.length > 0 && (
        <div>
          <p style={{ ...LABEL, marginBottom: 12, color: "rgba(255,255,255,0.25)" }}>Sem acesso</p>
          <div style={{ ...CARD, overflow: "hidden" }}>
            {inativos.map((m, i) => (
              <div key={m.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                <MembroRow m={m} isDono={isDono} currentUserId={currentUserId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
