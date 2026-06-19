"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Building2, User, Target } from "lucide-react";
import { ImageUpload } from "@/components/cardapio/image-upload";
import { atualizarPerfil, atualizarConta, type ActionResult } from "@/lib/settings/actions";
import type { Bar } from "@/types/database";

// ─── Shared inline styles ────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, textTransform: "uppercase",
  letterSpacing: "0.1em", color: "var(--fg-subtle)",
  display: "block", marginBottom: 6,
};

const inp: React.CSSProperties = {
  width: "100%", background: "var(--bg-inset)",
  border: "1px solid var(--border)", borderRadius: 4,
  padding: "10px 12px", fontSize: 13, color: "var(--fg)",
  outline: "none",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
  boxSizing: "border-box" as React.CSSProperties["boxSizing"],
  transition: "border-color 150ms",
};

const inpReadonly: React.CSSProperties = {
  ...inp,
  color: "var(--fg-muted)",
  cursor: "not-allowed",
  opacity: 0.7,
};

// ─── Feedback message ─────────────────────────────────────────────────────────

function Feedback({ result }: { result: ActionResult }) {
  if (!result) return null;
  const isOk = "ok" in result && result.ok;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 4, fontSize: 13,
      background: isOk ? "var(--ok-bg)" : "var(--danger-bg)",
      border: `1px solid color-mix(in srgb, ${isOk ? "var(--ok)" : "var(--danger)"} 30%, transparent)`,
      color: isOk ? "var(--ok)" : "var(--danger)",
    }}>
      {"error" in result ? result.error : "Salvo com sucesso."}
    </div>
  );
}

// ─── Bar Profile Section ──────────────────────────────────────────────────────

function PerfilDoBar({ bar, barId }: { bar: Bar; barId: string }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(bar.logo_url ?? null);
  const [result, setResult] = useState<ActionResult>(null);
  const [pending, setPending] = useState(false);

  const endereco = bar.endereco ?? {};

  async function handleSubmit(fd: FormData) {
    setPending(true);
    setResult(null);
    fd.set("logo_url", logoUrl ?? "");
    const r = await atualizarPerfil(barId, fd);
    setResult(r);
    if (r && "ok" in r && r.ok) router.refresh();
    setPending(false);
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Building2 style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Perfil do Bar
        </h3>
      </div>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Logo */}
        <div>
          <label style={lbl}>Logo</label>
          <ImageUpload
            currentUrl={bar.logo_url}
            bucket="bar-logos"
            onUpload={setLogoUrl}
          />
        </div>

        {/* Nome */}
        <div>
          <label style={lbl}>Nome do bar</label>
          <input name="nome" defaultValue={bar.nome} placeholder="Ex: Bar do João" style={inp} required />
        </div>

        {/* Telefone */}
        <div>
          <label style={lbl}>Telefone</label>
          <input name="telefone" defaultValue={bar.telefone ?? ""} placeholder="(11) 9 9999-9999" style={inp} />
        </div>

        {/* Endereço */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={lbl}>Endereço</label>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-2">
            <input name="rua" defaultValue={endereco.rua ?? ""} placeholder="Rua" style={inp} />
            <input name="numero" defaultValue={endereco.numero ?? ""} placeholder="Nº" style={inp} />
          </div>
          <input name="bairro" defaultValue={endereco.bairro ?? ""} placeholder="Bairro" style={inp} />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_60px_100px] gap-2">
            <input name="cidade" defaultValue={endereco.cidade ?? ""} placeholder="Cidade" style={inp} />
            <input name="estado" defaultValue={endereco.estado ?? ""} placeholder="UF" maxLength={2} style={inp} />
            <input name="cep" defaultValue={endereco.cep ?? ""} placeholder="CEP" style={inp} />
          </div>
        </div>

        {/* Metas */}
        <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Target style={{ width: 12, height: 12, color: "var(--fg-subtle)" }} />
            <span style={{ ...lbl, margin: 0 }}>Metas de faturamento</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Meta mensal (R$)</label>
              <input
                name="meta_mensal"
                defaultValue={bar.configuracoes?.meta_mensal ?? ""}
                placeholder="Ex: 30000"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Meta anual (R$)</label>
              <input
                name="meta_anual"
                defaultValue={bar.configuracoes?.meta_anual ?? ""}
                placeholder="Ex: 360000"
                style={inp}
              />
            </div>
          </div>
        </div>

        {result && <Feedback result={result} />}

        <button
          type="submit"
          disabled={pending}
          style={{
            alignSelf: "flex-start",
            background: "var(--accent)", color: "var(--accent-fg)",
            border: "none", borderRadius: 4,
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "filter 150ms, opacity 150ms",
          }}
          className="hover:brightness-110"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </section>
  );
}

// ─── Account Section ──────────────────────────────────────────────────────────

function MinhaConta({
  userId, userNome, userEmail, userAvatarUrl,
}: {
  userId: string;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userAvatarUrl);
  const [result, setResult] = useState<ActionResult>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(fd: FormData) {
    setPending(true);
    setResult(null);
    fd.set("avatar_url", avatarUrl ?? "");
    const r = await atualizarConta(userId, fd);
    setResult(r);
    if (r && "ok" in r && r.ok) router.refresh();
    setPending(false);
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <User style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Minha Conta
        </h3>
      </div>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Avatar */}
        <div>
          <label style={lbl}>Foto de perfil</label>
          <ImageUpload
            currentUrl={userAvatarUrl}
            bucket="avatars"
            onUpload={setAvatarUrl}
          />
        </div>

        {/* Nome */}
        <div>
          <label style={lbl}>Nome</label>
          <input name="nome" defaultValue={userNome} placeholder="Seu nome" style={inp} required />
        </div>

        {/* E-mail — readonly */}
        <div>
          <label style={lbl}>E-mail</label>
          <input
            type="email" value={userEmail} readOnly
            style={inpReadonly}
            tabIndex={-1}
          />
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>
            O e-mail é gerenciado pelo Supabase Auth e não pode ser alterado aqui.
          </p>
        </div>

        {result && <Feedback result={result} />}

        <button
          type="submit"
          disabled={pending}
          style={{
            alignSelf: "flex-start",
            background: "var(--accent)", color: "var(--accent-fg)",
            border: "none", borderRadius: 4,
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "filter 150ms, opacity 150ms",
          }}
          className="hover:brightness-110"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </section>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  bar: Bar;
  barId: string;
  userId: string;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

export function SettingsPanel({
  open, onClose, bar, barId, userId, userNome, userEmail, userAvatarUrl,
}: SettingsPanelProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(0,0,0,0.5)",
            animation: "fade-in 150ms ease both",
          }}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configurações"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(92vw, 680px)",
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
            Configurações
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

        {/* Body */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "28px 20px",
          display: "flex", flexDirection: "column", gap: 40,
        }}>
          <PerfilDoBar bar={bar} barId={barId} />

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)" }} />

          <MinhaConta
            userId={userId}
            userNome={userNome}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
          />
        </div>
      </div>
    </>
  );
}
