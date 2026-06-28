"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { alterarRole, desativarMembro, reativarMembro, removerMembro, atualizarFotoMembro, renomearMembro } from "@/lib/equipe/actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";
import { CARD, LABEL, BTN_ICON } from "@/lib/ui";
import type { BarRole } from "@/types/database";

export type MembroRow = {
  id: string;
  userId: string | null;
  nome: string;
  role: BarRole;
  ativo: boolean;
  fotoUrl: string | null;
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

// ─── Avatar clicável com upload de foto ──────────────────────────────────────
function MemberAvatar({
  memberId, nome, fotoUrl: initialUrl, size = 34, canUpload = false,
}: {
  memberId: string;
  nome: string;
  fotoUrl: string | null;
  size?: number;
  canUpload?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [imgErro, setImgErro] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);

  // fallback para arquivo estático
  const staticUrl = `/funcionarios/${encodeURIComponent(nome)}.png`;
  const displayUrl = url ?? staticUrl;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${memberId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("staff-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("staff-photos")
        .getPublicUrl(path);
      const res = await atualizarFotoMembro(memberId, publicUrl);
      if ("error" in res) throw new Error(res.error);
      setUrl(`${publicUrl}?t=${Date.now()}`); // cache-bust
      setImgErro(false);
      toast("Foto atualizada!", "ok");
    } catch (err) {
      toast((err as Error).message ?? "Erro ao enviar foto.", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const hasPhoto = !imgErro;

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      title={canUpload ? "Clique para trocar a foto" : undefined}
    >
      {canUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      )}

      {/* Avatar */}
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={nome}
          onError={() => setImgErro(true)}
          style={{
            width: size, height: size, borderRadius: "50%", objectFit: "cover",
            display: "block",
            border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
            opacity: uploading ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: "color-mix(in srgb, var(--fg) 10%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.round(size * 0.35), fontWeight: 700, color: "var(--fg)",
          opacity: uploading ? 0.4 : 1,
        }}>
          {nome[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      {/* Overlay de câmera ao hover / loading */}
      {canUpload && (
        <button
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: (uploading || hovered) ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0)",
            border: "none", cursor: uploading ? "default" : "pointer",
            transition: "background 0.15s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {uploading ? (
            <Loader2 size={Math.round(size * 0.45)} style={{ color: "#fff", animation: "spin 0.7s linear infinite" }} />
          ) : hovered ? (
            <svg width={Math.round(size * 0.45)} height={Math.round(size * 0.45)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          ) : null}
        </button>
      )}
    </div>
  );
}

// ─── Single member row ────────────────────────────────────────────────────────
function MembroRow({
  m, isDono, currentUserId, onRemove,
}: {
  m: MembroRow;
  isDono: boolean;
  currentUserId: string;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<BarRole>(m.role);
  const [saving, setSaving] = useState(false);
  const [editingNome, setEditingNome] = useState(false);
  const [nome, setNome] = useState(m.nome);
  const [savingNome, setSavingNome] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [, startTransition] = useTransition();
  const isOwn    = m.userId === currentUserId;
  const canEdit  = isDono && !isOwn;

  async function saveNome() {
    if (!nome.trim() || nome.trim() === m.nome) { setEditingNome(false); return; }
    setSavingNome(true);
    const res = await renomearMembro(m.id, nome.trim());
    if ("error" in res) toast(res.error, "error");
    else toast("Nome atualizado.", "ok");
    setSavingNome(false);
    setEditingNome(false);
  }

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
      router.refresh();
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
    const result = await removerMembro(m.id);
    if ("error" in result) {
      toast(result.error, "error");
      setRemoving(false);
    } else {
      toast(`${m.nome} removido.`, "ok");
      onRemove(m.id);
    }
  }

  return (
    <div
      className="flex flex-row items-center gap-3 px-4 py-3.5 lg:grid lg:grid-cols-[1fr_160px_80px_88px] lg:gap-3 lg:px-[18px] lg:py-[13px]"
      style={{ opacity: m.ativo ? 1 : 0.5 }}
    >
      {/* Info */}
      <div className="flex-1 min-w-0" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <MemberAvatar memberId={m.id} nome={nome} fotoUrl={m.fotoUrl} size={34} canUpload={isDono} />
        {isDono && editingNome ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveNome(); if (e.key === "Escape") { setNome(m.nome); setEditingNome(false); } }}
              style={{
                flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500,
                background: "var(--bg-inset)", border: "1px solid var(--border)",
                borderRadius: 4, padding: "2px 8px", color: "var(--fg)", outline: "none",
              }}
            />
            <button onClick={saveNome} disabled={savingNome} style={{ ...BTN_ICON, color: "var(--ok)", padding: 3 }}>
              <Check style={{ width: 12, height: 12 }} />
            </button>
            <button onClick={() => { setNome(m.nome); setEditingNome(false); }} style={{ ...BTN_ICON, padding: 3 }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ) : (
          <p
            onClick={() => isDono && setEditingNome(true)}
            title={isDono ? "Clique para editar o nome" : undefined}
            style={{
              fontSize: 14, fontWeight: 500, color: "var(--fg)", margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              cursor: isDono ? "text" : "default",
            }}
          >
            {nome}
          </p>
        )}
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
          fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
          background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)", display: "inline-block",
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
  ativos: ativosInit, inativos: inativosInit, isDono, currentUserId,
}: {
  ativos: MembroRow[];
  inativos: MembroRow[];
  isDono: boolean;
  currentUserId: string;
}) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  function onRemove(id: string) {
    setRemovedIds(prev => new Set(prev).add(id));
  }

  const ativos  = ativosInit.filter(m => !removedIds.has(m.id));
  const inativos = inativosInit.filter(m => !removedIds.has(m.id));

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
              <MembroRow m={m} isDono={isDono} currentUserId={currentUserId} onRemove={onRemove} />
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
                <MembroRow m={m} isDono={isDono} currentUserId={currentUserId} onRemove={onRemove} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
