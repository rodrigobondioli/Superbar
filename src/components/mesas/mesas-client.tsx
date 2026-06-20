"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { criarMesa, editarMesa, removerMesa } from "@/lib/mesas/actions";
import type { Mesa } from "@/types/database";

// ─── Shared styles ─────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-subtle)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
  display: "block",
};

const inp: React.CSSProperties = {
  background: "var(--bg-inset)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "10px 12px",
  fontSize: 16,
  color: "var(--fg)",
  outline: "none",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
  boxSizing: "border-box" as React.CSSProperties["boxSizing"],
  width: "100%",
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
  transition: "color 100ms",
};

// ─── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ ocupada }: { ocupada: boolean }) {
  return (
    <span
      title={ocupada ? "Ocupada" : "Livre"}
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        display: "inline-block",
        background: ocupada ? "var(--ok)" : "var(--fg-subtle)",
        opacity: ocupada ? 1 : 0.4,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Side panel ────────────────────────────────────────────────────────────────

interface MesaPanelProps {
  mode: "create" | "edit";
  mesa?: Mesa;
  nextNumero: number;
  open: boolean;
  onClose: () => void;
}

function MesaPanel({ mode, mesa, nextNumero, open, onClose }: MesaPanelProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const title = mode === "create" ? "Nova mesa" : "Editar mesa";

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(92vw, 440px)",
          zIndex: 100,
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <h2 style={{
            fontSize: 15, fontWeight: 600, color: "var(--fg)",
            fontFamily: "var(--font-mono)", margin: 0,
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 4,
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--fg-muted)", cursor: "pointer",
              transition: "border-color 150ms, color 150ms",
            }}
            className="hover:border-[var(--border-strong)] hover:!text-[var(--fg)]"
            aria-label="Fechar"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body — key resets inputs when switching mesa */}
        <div
          key={`${mode}-${mesa?.id ?? "new"}`}
          style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}
        >
          <form
            action={async (fd) => {
              if (mode === "create") {
                await criarMesa(fd);
              } else if (mesa) {
                await editarMesa(mesa.id, fd);
              }
              onClose();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Auto-assign numero on create */}
            {mode === "create" && (
              <input type="hidden" name="numero" value={nextNumero} />
            )}

            <div>
              <label style={lbl}>Nome da mesa *</label>
              <input
                name="nome"
                defaultValue={mesa?.nome ?? ""}
                placeholder="Ex: Mesa 1, Varanda, Balcão VIP"
                style={inp}
                required
                autoFocus
              />
            </div>

            <div>
              <label style={lbl}>Capacidade</label>
              <input
                name="capacidade"
                defaultValue={mesa?.capacidade ?? ""}
                placeholder="Ex: 4"
                type="number"
                min={1}
                style={inp}
              />
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  background: "var(--accent)", color: "var(--accent-fg)",
                  border: "none", borderRadius: 4,
                  padding: "10px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}
                className="hover:brightness-110"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "transparent", color: "var(--fg-muted)",
                  border: "1px solid var(--border-strong)", borderRadius: 4,
                  padding: "10px 16px", fontSize: 13, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Mesa row ─────────────────────────────────────────────────────────────────

function MesaRow({
  mesa, isLast, ocupada, onEdit,
}: {
  mesa: Mesa;
  isLast: boolean;
  ocupada: boolean;
  onEdit: (m: Mesa) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = mesa.nome ?? `Mesa ${mesa.numero}`;

  return (
    <div
      className="group"
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
      {/* Status */}
      <div style={{ width: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StatusDot ocupada={ocupada} />
      </div>

      {/* # */}
      <span style={{
        fontSize: 13, color: "var(--fg-subtle)",
        width: 36, flexShrink: 0, fontVariantNumeric: "tabular-nums",
        fontFamily: "var(--font-mono)",
      }}>
        #{mesa.numero}
      </span>

      {/* Nome */}
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", flex: 1 }}>
        {label}
      </span>

      {/* Capacidade — oculta em mobile para dar espaço ao nome */}
      {mesa.capacidade ? (
        <span className="hidden sm:block" style={{ fontSize: 12, color: "var(--fg-subtle)", minWidth: 80 }}>
          {mesa.capacidade} lugares
        </span>
      ) : (
        <span className="hidden sm:block" style={{ minWidth: 80 }} />
      )}

      {/* Ações — sempre visível no mobile, hover no desktop */}
      <div
        className="flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-100"
        style={{ flexShrink: 0 }}
      >
        <button
          onClick={() => onEdit(mesa)}
          style={iconBtn}
          className="hover:!text-[var(--fg)]"
          title="Editar"
        >
          <Pencil style={{ width: 13, height: 13 }} />
        </button>
        <form action={removerMesa.bind(null, mesa.id)}>
          <button
            type="submit"
            onClick={e => { if (!window.confirm(`Remover ${label}?`)) e.preventDefault(); }}
            style={iconBtn}
            className="hover:!text-[var(--danger)]"
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

interface MesasClientProps {
  mesas: Mesa[];
  barId: string;
  mesasOcupadas: string[];
  nextNumero: number;
}

export function MesasClient({ mesas, barId, mesasOcupadas, nextNumero }: MesasClientProps) {
  void barId;
  const [panelMode, setPanelMode] = useState<"create" | "edit" | null>(null);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);

  const ocupadasSet = new Set(mesasOcupadas);

  function openCreate() {
    setEditingMesa(null);
    setPanelMode("create");
  }

  function openEdit(mesa: Mesa) {
    setEditingMesa(mesa);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode(null);
    setEditingMesa(null);
  }

  return (
    <>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)",
          textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
        }}>
          {mesas.length} mesa{mesas.length !== 1 ? "s" : ""} cadastrada{mesas.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--accent)", color: "var(--accent-fg)", border: "none",
            borderRadius: 4, padding: "7px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
          className="hover:brightness-110"
        >
          <Plus style={{ width: 13, height: 13 }} />
          Nova mesa
        </button>
      </div>

      {/* Tabela */}
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        overflow: "hidden",
      }}>
        {/* Cabeçalho das colunas */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <span style={{ width: 20, flexShrink: 0 }} />
          <span style={{ ...lbl, width: 36, flexShrink: 0, margin: 0 }}>#</span>
          <span style={{ ...lbl, flex: 1, margin: 0 }}>Nome</span>
          <span className="hidden sm:block" style={{ ...lbl, minWidth: 80, margin: 0 }}>Lugares</span>
          <span style={{ width: 72, flexShrink: 0 }} />
        </div>

        {mesas.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", padding: "28px 20px", margin: 0 }}>
            Nenhuma mesa cadastrada ainda. Clique em <strong>Nova mesa</strong> para começar.
          </p>
        )}

        {mesas.map((mesa, i) => (
          <MesaRow
            key={mesa.id}
            mesa={mesa}
            isLast={i === mesas.length - 1}
            ocupada={ocupadasSet.has(mesa.id)}
            onEdit={openEdit}
          />
        ))}

        {/* Balcão note — sem ações */}
        {mesas.length > 0 && (
          <div style={{
            padding: "11px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                background: "var(--fg-subtle)", opacity: 0.25,
              }} />
            </div>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)", width: 36, fontFamily: "var(--font-mono)" }}>—</span>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)", flex: 1, fontStyle: "italic" }}>
              Balcão (padrão, sempre disponível)
            </span>
          </div>
        )}
      </div>

      {/* Painel lateral */}
      <MesaPanel
        mode={panelMode === "edit" ? "edit" : "create"}
        mesa={editingMesa ?? undefined}
        nextNumero={nextNumero}
        open={panelMode !== null}
        onClose={closePanel}
      />
    </>
  );
}
