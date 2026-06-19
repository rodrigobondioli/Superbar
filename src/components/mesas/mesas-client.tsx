"use client";

import { useState } from "react";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { criarMesa, editarMesa, removerMesa } from "@/lib/mesas/actions";
import type { Mesa } from "@/types/database";

const inp: React.CSSProperties = {
  background: "var(--bg-inset)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--fg)",
  outline: "none",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
  boxSizing: "border-box" as React.CSSProperties["boxSizing"],
  width: "100%",
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-subtle)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
  display: "block",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  padding: 6,
  borderRadius: 4,
  color: "var(--fg-subtle)",
};

// ─── Mesa row ─────────────────────────────────────────────────────────────────
function MesaRow({ mesa, isLast }: { mesa: Mesa; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const label = mesa.nome ?? `Mesa ${mesa.numero}`;

  if (editing) {
    return (
      <form
        action={async (fd) => { await editarMesa(mesa.id, fd); setEditing(false); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 20px",
          borderBottom: isLast ? undefined : "1px solid var(--border)",
          background: "color-mix(in srgb, var(--fg) 2%, transparent)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--fg-subtle)", width: 36, flexShrink: 0 }}>
          #{mesa.numero}
        </span>
        <input name="nome" defaultValue={mesa.nome ?? ""} placeholder="Apelido (opcional)" autoFocus
          style={{ ...inp, flex: 1 }} />
        <input name="capacidade" defaultValue={mesa.capacidade ?? ""} placeholder="Lugares"
          style={{ ...inp, width: 90 }} type="number" min={1} />
        <button type="submit" style={{ ...iconBtn, color: "var(--ok)" }}>
          <Check style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" onClick={() => setEditing(false)} style={iconBtn}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </form>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 20px",
        borderBottom: isLast ? undefined : "1px solid var(--border)",
        background: hovered ? "color-mix(in srgb, var(--fg) 2%, transparent)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--fg-subtle)", width: 36, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        #{mesa.numero}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", flex: 1 }}>{label}</span>
      {mesa.capacidade ? (
        <span style={{ fontSize: 12, color: "var(--fg-subtle)", minWidth: 80 }}>
          {mesa.capacidade} lugares
        </span>
      ) : (
        <span style={{ minWidth: 80 }} />
      )}
      <div style={{ display: "flex", gap: 2, opacity: hovered ? 1 : 0, transition: "opacity 0.1s" }}>
        <button onClick={() => setEditing(true)} style={iconBtn} title="Editar">
          <Pencil style={{ width: 13, height: 13 }} />
        </button>
        <form action={removerMesa.bind(null, mesa.id)}>
          <button
            type="submit"
            onClick={e => { if (!window.confirm(`Remover ${label}?`)) e.preventDefault(); }}
            style={{ ...iconBtn, color: "var(--danger)" }}
            title="Remover"
          >
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function MesasClient({ mesas, barId }: { mesas: Mesa[]; barId: string }) {
  void barId;
  const [adding, setAdding] = useState(false);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

      {/* ── Coluna esquerda: lista ── */}
      <div>
        {/* Header da lista */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            {mesas.length} mesa{mesas.length !== 1 ? "s" : ""} cadastrada{mesas.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setAdding(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--accent)", color: "var(--accent-fg)", border: "none",
              borderRadius: 4, padding: "7px 14px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            Nova mesa
          </button>
        </div>

        {/* Tabela */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
          {/* Col header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 20px",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ ...lbl, width: 36, flexShrink: 0, margin: 0 }}>#</span>
            <span style={{ ...lbl, flex: 1, margin: 0 }}>Nome</span>
            <span style={{ ...lbl, minWidth: 80, margin: 0 }}>Lugares</span>
            <span style={{ width: 72 }} />
          </div>

          {mesas.length === 0 && !adding && (
            <p style={{ fontSize: 14, color: "var(--fg-subtle)", padding: "28px 20px", margin: 0 }}>
              Nenhuma mesa cadastrada ainda. Use o botão ao lado para começar.
            </p>
          )}

          {mesas.map((m, i) => (
            <MesaRow key={m.id} mesa={m} isLast={i === mesas.length - 1 && !adding} />
          ))}

          {/* Balcão note */}
          {mesas.length > 0 && (
            <div style={{
              padding: "11px 20px",
              borderTop: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 13, color: "var(--fg-subtle)", width: 36 }}>—</span>
              <span style={{ fontSize: 13, color: "var(--fg-subtle)", flex: 1, fontStyle: "italic" }}>
                Balcão (padrão, sempre disponível)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Coluna direita: form adicionar ── */}
      <div style={{ position: "sticky", top: 0 }}>
        {adding ? (
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: "0 0 20px", fontFamily: "var(--font-mono)" }}>Nova mesa</p>
            <form
              action={async (fd) => { await criarMesa(fd); setAdding(false); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Número *</label>
                  <input autoFocus name="numero" placeholder="Ex: 1" type="number" min={1} style={inp} required />
                </div>
                <div>
                  <label style={lbl}>Lugares</label>
                  <input name="capacidade" placeholder="Ex: 4" type="number" min={1} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Apelido (opcional)</label>
                <input name="nome" placeholder="Ex: Varanda, Balcão VIP" style={inp} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" style={{
                  flex: 1, background: "var(--accent)", color: "var(--accent-fg)", border: "none",
                  borderRadius: 4, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  Adicionar
                </button>
                <button type="button" onClick={() => setAdding(false)} style={{
                  background: "transparent", color: "var(--fg-muted)",
                  border: "1px solid var(--border-strong)", borderRadius: 4, padding: "10px 16px",
                  fontSize: 13, cursor: "pointer",
                }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 4, padding: 24,
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", margin: "0 0 8px" }}>
              Dicas
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "O Balcão já existe por padrão — não precisa cadastrar.",
                "O campo Apelido é opcional. Se vazio, aparece como \"Mesa 1\".",
                "Lugares é informativo — o bartender vê no app.",
                "Mesas removidas não aparecem para o bartender.",
              ].map((tip, i) => (
                <li key={i} style={{ fontSize: 12, color: "var(--fg-subtle)", lineHeight: 1.5 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}
