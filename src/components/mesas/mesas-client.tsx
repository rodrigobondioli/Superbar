"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, QrCode, Printer, GripVertical } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { criarMesa, editarMesa, removerMesa, reordenarMesas } from "@/lib/mesas/actions";
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

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ mesa, onClose }: { mesa: Mesa; onClose: () => void }) {
  const label = mesa.nome ?? `Mesa ${mesa.numero}`;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/mesa/${mesa.id}`;

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  function handlePrint() {
    const win = window.open("", "_blank", "width=400,height=500");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR — ${label}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center;
                   justify-content: center; min-height: 100vh; font-family: sans-serif;
                   background: #fff; color: #000; }
            h2 { font-size: 22px; margin: 16px 0 4px; }
            p  { font-size: 13px; color: #555; margin: 0 0 16px; word-break: break-all; text-align: center; max-width: 280px; }
            svg { display: block; }
          </style>
        </head>
        <body>
          ${document.getElementById(`qr-svg-${mesa.id}`)?.outerHTML ?? ""}
          <h2>${label}</h2>
          <p>${url}</p>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 201,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, pointerEvents: "none",
      }}>
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "28px 32px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          pointerEvents: "all",
          maxWidth: 340, width: "100%",
          position: "relative",
        }}>
          {/* Fechar */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 12,
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--fg-subtle)", display: "flex", padding: 6, borderRadius: 4,
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>

          {/* Nome */}
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            QR Code
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.3px" }}>
            {label}
          </p>

          {/* QR */}
          <div style={{
            background: "#ffffff", padding: 16, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <QRCodeSVG
              id={`qr-svg-${mesa.id}`}
              value={url}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>

          {/* URL */}
          <p style={{
            fontSize: 11, color: "var(--fg-subtle)", wordBreak: "break-all",
            textAlign: "center", margin: 0, maxWidth: 260, lineHeight: 1.5,
          }}>
            {url}
          </p>

          {/* Botão imprimir */}
          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--accent)", color: "var(--accent-fg)",
              border: "none", borderRadius: 6,
              padding: "10px 20px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", width: "100%", justifyContent: "center",
            }}
            className="hover:brightness-110"
          >
            <Printer style={{ width: 14, height: 14 }} />
            Imprimir QR Code
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Mesa row ─────────────────────────────────────────────────────────────────

function MesaRow({
  mesa, isLast, ocupada, onEdit, onQR, isDragging, isOver,
  onDragStart, onDragEnter, onDragEnd,
}: {
  mesa: Mesa;
  isLast: boolean;
  ocupada: boolean;
  onEdit: (m: Mesa) => void;
  onQR: (m: Mesa) => void;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = mesa.nome ?? `Mesa ${mesa.numero}`;

  return (
    <div
      className="group"
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 20px",
        borderBottom: isLast ? undefined : "1px solid var(--border)",
        background: isOver
          ? "color-mix(in srgb, var(--accent) 8%, transparent)"
          : hovered
            ? "color-mix(in srgb, var(--fg) 2%, transparent)"
            : "transparent",
        opacity: isDragging ? 0.4 : 1,
        transition: "background 0.1s, opacity 0.1s",
        cursor: "grab",
        borderTop: isOver ? "2px solid var(--accent)" : undefined,
      }}
    >
      {/* Drag handle */}
      <div style={{ width: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GripVertical style={{ width: 14, height: 14, color: "var(--fg-subtle)", opacity: hovered ? 0.8 : 0.3, transition: "opacity 0.1s" }} />
      </div>

      {/* Status */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onQR(mesa)}
          style={iconBtn}
          className="hover:!text-[var(--fg)]"
          title="QR Code"
        >
          <QrCode style={{ width: 13, height: 13 }} />
        </button>
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
  const [panelMode, setPanelMode] = useState<"create" | "edit" | null>(null);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [qrMesa, setQrMesa] = useState<Mesa | null>(null);

  // Drag state
  const [localMesas, setLocalMesas] = useState<Mesa[]>(mesas);
  const localMesasRef = useRef<Mesa[]>(mesas);
  const draggingIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  useEffect(() => { localMesasRef.current = localMesas; }, [localMesas]);

  // Sync when server refreshes mesas list
  useEffect(() => { setLocalMesas(mesas); }, [mesas]);

  const ocupadasSet = new Set(mesasOcupadas);

  function openCreate() { setEditingMesa(null); setPanelMode("create"); }
  function openEdit(mesa: Mesa) { setEditingMesa(mesa); setPanelMode("edit"); }
  function closePanel() { setPanelMode(null); setEditingMesa(null); }

  function handleDragStart(idx: number) {
    draggingIdx.current = idx;
  }

  function handleDragEnter(idx: number) {
    if (draggingIdx.current === null || draggingIdx.current === idx) return;
    setOverIdx(idx);
    setLocalMesas(prev => {
      const next = [...prev];
      const [item] = next.splice(draggingIdx.current!, 1);
      next.splice(idx, 0, item);
      draggingIdx.current = idx;
      return next;
    });
  }

  function handleDragEnd() {
    draggingIdx.current = null;
    setOverIdx(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      reordenarMesas(barId, localMesasRef.current.map(m => m.id));
    }, 400);
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
          {localMesas.length} mesa{localMesas.length !== 1 ? "s" : ""} cadastrada{localMesas.length !== 1 ? "s" : ""}
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
          <span style={{ width: 7, flexShrink: 0 }} />
          <span style={{ ...lbl, width: 36, flexShrink: 0, margin: 0 }}>#</span>
          <span style={{ ...lbl, flex: 1, margin: 0 }}>Nome</span>
          <span className="hidden sm:block" style={{ ...lbl, minWidth: 80, margin: 0 }}>Lugares</span>
          <span style={{ width: 72, flexShrink: 0 }} />
        </div>

        {localMesas.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            <p style={{ fontSize: 28, margin: "0 0 14px" }}>🪑</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px" }}>
              Nenhuma mesa cadastrada
            </p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 20px", lineHeight: 1.6, maxWidth: 280 }}>
              Cada mesa é um ponto de atendimento. O bartender vê exatamente essas opções ao abrir uma comanda.
            </p>
            <button
              onClick={openCreate}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--accent)", color: "var(--accent-fg)", border: "none",
                borderRadius: 4, padding: "10px 20px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              Adicionar primeira mesa
            </button>
          </div>
        )}

        {localMesas.map((mesa, i) => (
          <MesaRow
            key={mesa.id}
            mesa={mesa}
            isLast={i === localMesas.length - 1}
            ocupada={ocupadasSet.has(mesa.id)}
            onEdit={openEdit}
            onQR={setQrMesa}
            isDragging={draggingIdx.current === i}
            isOver={overIdx === i}
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Balcão note — sem ações */}
        {localMesas.length > 0 && (
          <div style={{
            padding: "11px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 20, flexShrink: 0 }} />
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

      {/* QR Modal */}
      {qrMesa && <QRModal mesa={qrMesa} onClose={() => setQrMesa(null)} />}

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
