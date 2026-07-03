"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, QrCode, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { criarMesa, editarMesa, removerMesa } from "@/lib/mesas/actions";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import type { Mesa } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ─── Estilos base ───────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)",
  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, display: "block",
};
const inp: React.CSSProperties = {
  background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "12px", fontSize: 16, color: "var(--fg)", outline: "none",
  colorScheme: "dark", boxSizing: "border-box", width: "100%",
};

// ─── Simulação de métricas por mesa (DEMO) ──────────────────────────────────
// Determinístico pelo número da mesa, então estável entre renders.
// Trocar por métricas reais por mesa quando o bar estiver operando.
function simMesa(mesa: Mesa, ocupada: boolean) {
  const n = mesa.numero || 1;
  const fat = 800 + ((n * 373) % 3200);
  const ticket = 180 + ((n * 47) % 180);
  const giroN = 1 + (n % 4);
  const giroMin = 30 + ((n * 7) % 40);
  const lugares = mesa.capacidade ?? (2 + (n % 6));
  const comanda = ocupada
    ? { valor: 220 + ((n * 53) % 320), itens: 2 + (n % 5), min: 12 + ((n * 11) % 60) }
    : null;
  return { fat, ticket, giroN, giroMin, lugares, comanda };
}

// ─── Painel criar/editar mesa (drawer) ──────────────────────────────────────
function MesaPanel({ mode, mesa, nextNumero, open, onClose }: {
  mode: "create" | "edit"; mesa?: Mesa; nextNumero: number; open: boolean; onClose: () => void;
}) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const title = mode === "create" ? "Nova mesa" : "Editar mesa";

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)" }} />}
      <div role="dialog" aria-modal="true" aria-label={title} style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(92vw, 440px)", zIndex: 100,
        background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{title}</h2>
          <button onClick={onClose} aria-label="Fechar" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--fg-muted)", cursor: "pointer" }} className="hover:!text-[var(--fg)]">
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div key={`${mode}-${mesa?.id ?? "new"}`} style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
          <form action={async (fd) => { if (mode === "create") { await criarMesa(fd); } else if (mesa) { await editarMesa(mesa.id, fd); } onClose(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "create" && <input type="hidden" name="numero" value={nextNumero} />}
            <div>
              <label style={lbl}>Nome da mesa *</label>
              <input name="nome" defaultValue={mesa?.nome ?? ""} placeholder="Ex: Mesa 1, Varanda, Balcão VIP" style={inp} required autoFocus />
            </div>
            <div>
              <label style={lbl}>Capacidade</label>
              <input name="capacidade" defaultValue={mesa?.capacidade ?? ""} placeholder="Ex: 4" type="number" min={1} style={inp} />
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
              <button type="submit" style={{ flex: 1, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }} className="hover:brightness-110">Salvar</button>
              <button type="button" onClick={onClose} style={{ background: "transparent", color: "var(--fg)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── QR Modal ───────────────────────────────────────────────────────────────
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
    win.document.write(`<!DOCTYPE html><html><head><title>QR — ${label}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff;color:#000}h2{font-size:22px;margin:16px 0 4px}p{font-size:13px;color:#555;margin:0 0 16px;word-break:break-all;text-align:center;max-width:280px}svg{display:block}</style></head><body>${document.getElementById(`qr-svg-${mesa.id}`)?.outerHTML ?? ""}<h2>${label}</h2><p>${url}</p><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
    win.document.close();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, pointerEvents: "all", maxWidth: 340, width: "100%", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-subtle)", display: "flex", padding: 6, borderRadius: 6 }}><X style={{ width: 16, height: 16 }} /></button>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>QR Code</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: 0 }}>{label}</p>
          <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
            <QRCodeSVG id={`qr-svg-${mesa.id}`} value={url} size={180} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", wordBreak: "break-all", textAlign: "center", margin: 0, maxWidth: 260, lineHeight: 1.5 }}>{url}</p>
          <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "12px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%", justifyContent: "center" }} className="hover:brightness-110">
            <Printer style={{ width: 14, height: 14 }} /> Imprimir QR Code
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Card de mesa ────────────────────────────────────────────────────────────
function MesaCard({ mesa, ocupada, selected, onClick }: { mesa: Mesa; ocupada: boolean; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const label = mesa.nome ?? `Mesa ${mesa.numero}`;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", minWidth: 150, height: 114, borderRadius: 16,
        background: selected ? "#FFFFFF" : "var(--bg-card)",
        border: !selected && hover ? "1px solid var(--border-strong)" : "1px solid transparent",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 40px",
        cursor: "pointer", transition: "background 120ms, border-color 120ms", textAlign: "center",
      }}
    >
      <span style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: ocupada ? "var(--ok)" : "var(--border-strong)" }} />
      <span style={{ fontSize: 18, fontWeight: 500, color: selected ? "#111113" : "var(--fg)", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

// ─── Painel de detalhes (direita) ────────────────────────────────────────────
function DetailPanel({ mesa, ocupada, ranking, total, onEdit, onQR, onDelete }: {
  mesa: Mesa | null; ocupada: boolean; ranking: number; total: number;
  onEdit: () => void; onQR: () => void; onDelete: () => void;
}) {
  if (!mesa) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200 }}>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", textAlign: "center", maxWidth: 200 }}>Selecione uma mesa para ver os detalhes ao vivo.</p>
      </div>
    );
  }

  const s = simMesa(mesa, ocupada);
  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 15 };
  const labelStyle: React.CSSProperties = { color: "var(--fg-muted)" };
  const valStyle: React.CSSProperties = { color: "var(--fg)", fontVariantNumeric: "tabular-nums" };
  const divider = <div style={{ height: 1, background: "var(--border-strong)" }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-muted)" }}>Informações da mesa</span>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Faturamento · turno atual</span>
        <span style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{currency.format(s.fat)}</span>
      </div>

      {divider}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={rowStyle}><span style={labelStyle}>Lugares</span><span style={valStyle}>{String(s.lugares).padStart(2, "0")}</span></div>
        <div style={rowStyle}><span style={labelStyle}>Ticket médio</span><span style={valStyle}>{currency.format(s.ticket)}</span></div>
        <div style={rowStyle}><span style={labelStyle}>Giro</span><span style={valStyle}>girou {s.giroN}x · {s.giroMin}min</span></div>
        <div style={rowStyle}><span style={labelStyle}>Ranking</span><span style={valStyle}>#{ranking} de {total}</span></div>
      </div>

      {divider}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ocupada && s.comanda ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ok)" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-muted)" }}>Ao vivo</span>
            </div>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Comanda aberta</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>{currency.format(s.comanda.valor)} · {s.comanda.itens} itens · aberta há {s.comanda.min}min</span>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--border-strong)" }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-muted)" }}>Mesa livre</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 4 }}>
        <button onClick={onEdit} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, color: "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 6 }} className="hover:!text-[var(--fg)]"><Pencil style={{ width: 13, height: 13 }} /> Editar</button>
        <button onClick={onQR} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, color: "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 6 }} className="hover:!text-[var(--fg)]"><QrCode style={{ width: 13, height: 13 }} /> QR Code</button>
        <button onClick={onDelete} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: 6 }}><Trash2 style={{ width: 13, height: 13 }} /> Deletar mesa</button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
interface MesasClientProps {
  mesas: Mesa[]; barId: string; mesasOcupadas: string[]; nextNumero: number; dataLabel: string;
}

export function MesasClient({ mesas, mesasOcupadas, nextNumero, dataLabel }: MesasClientProps) {
  const [panelMode, setPanelMode] = useState<"create" | "edit" | null>(null);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [qrMesa, setQrMesa] = useState<Mesa | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(mesas[0]?.id ?? null);

  const ocupadasSet = new Set(mesasOcupadas);

  // Ranking por faturamento simulado
  const ranked = [...mesas]
    .map((m) => ({ id: m.id, fat: simMesa(m, ocupadasSet.has(m.id)).fat }))
    .sort((a, b) => b.fat - a.fat);
  const rankMap = new Map(ranked.map((r, i) => [r.id, i + 1]));

  const selected = mesas.find((m) => m.id === selectedId) ?? null;

  function openCreate() { setEditingMesa(null); setPanelMode("create"); }
  function openEdit(mesa: Mesa) { setEditingMesa(mesa); setPanelMode("edit"); }
  function closePanel() { setPanelMode(null); setEditingMesa(null); }

  return (
    <>
      {/* Cabeçalho: data + título + subtítulo + Nova mesa */}
      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 24px" }}>{dataLabel}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Mesas</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Configure as posições do seu bar. O bartender vê exatamente essas opções.</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", flexShrink: 0 }} className="hover:brightness-110">
          <Plus style={{ width: 15, height: 15 }} /> Nova mesa
        </button>
      </div>

      {/* Contagem */}
      <div style={{ margin: "24px 0" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>
          ({mesas.length}) {mesas.length === 1 ? "mesa cadastrada" : "mesas cadastradas"}
        </span>
      </div>

      {mesas.length === 0 ? (
        <EmptyState
          icon="🪑"
          title="Nenhuma mesa cadastrada"
          description="Cada mesa é um ponto de atendimento. O bartender vê exatamente essas opções ao abrir uma comanda."
          action={<EmptyStateButton onClick={openCreate}><Plus style={{ width: 13, height: 13 }} /> Adicionar primeira mesa</EmptyStateButton>}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 344px", gap: 48, alignItems: "start" }} className="max-lg:!grid-cols-1 max-lg:!gap-8">
          {/* Grid de mesas */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {mesas.map((mesa) => (
              <MesaCard
                key={mesa.id}
                mesa={mesa}
                ocupada={ocupadasSet.has(mesa.id)}
                selected={mesa.id === selectedId}
                onClick={() => setSelectedId(mesa.id)}
              />
            ))}
          </div>

          {/* Painel de detalhes */}
          <div className="lg:border-l lg:pl-12" style={{ borderColor: "var(--border-strong)" }}>
            <DetailPanel
              mesa={selected}
              ocupada={selected ? ocupadasSet.has(selected.id) : false}
              ranking={selected ? (rankMap.get(selected.id) ?? 1) : 1}
              total={mesas.length}
              onEdit={() => selected && openEdit(selected)}
              onQR={() => selected && setQrMesa(selected)}
              onDelete={() => {
                if (selected && window.confirm(`Remover ${selected.nome ?? `Mesa ${selected.numero}`}?`)) {
                  removerMesa(selected.id);
                  setSelectedId(null);
                }
              }}
            />
          </div>
        </div>
      )}

      {qrMesa && <QRModal mesa={qrMesa} onClose={() => setQrMesa(null)} />}

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
