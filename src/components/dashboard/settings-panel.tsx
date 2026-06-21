"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Building2, User, Target, Smartphone } from "lucide-react";
import { ImageUpload } from "@/components/cardapio/image-upload";
import { atualizarPerfil, atualizarConta, atualizarLogo, atualizarAvatar, atualizarAutoPedido, atualizarTaxaServico, type ActionResult } from "@/lib/settings/actions";
import { signOut } from "@/lib/auth/actions";
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

  // Endereço — controlado para CEP preencher automaticamente
  const [cep, setCep]       = useState(endereco.cep    ?? "");
  const [rua, setRua]       = useState(endereco.rua    ?? "");
  const [bairro, setBairro] = useState(endereco.bairro ?? "");
  const [cidade, setCidade] = useState(endereco.cidade ?? "");
  const [estado, setEstado] = useState(endereco.estado ?? "");
  const [cepLoading, setCepLoading] = useState(false);

  function formatCep(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  async function handleCepChange(raw: string) {
    const formatted = formatCep(raw);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch { /* ignora falha de rede */ }
    finally { setCepLoading(false); }
  }

  // Auto-salva a URL da logo imediatamente após o upload — o usuário
  // não precisa clicar "Salvar" para persistir a foto.
  async function handleLogoUpload(url: string | null) {
    setLogoUrl(url);
    await atualizarLogo(barId, url);
    router.refresh();
  }

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
        {/* Logo — auto-salva ao fazer upload */}
        <div>
          <label style={lbl}>Logo</label>
          <ImageUpload
            currentUrl={logoUrl}
            bucket="bar-logos"
            onUpload={handleLogoUpload}
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

          {/* CEP primeiro — preenche os demais campos automaticamente */}
          <div style={{ position: "relative" }}>
            <input
              name="cep"
              value={cep}
              onChange={e => handleCepChange(e.target.value)}
              placeholder="CEP"
              style={inp}
            />
            {cepLoading && (
              <span style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11, color: "var(--fg-subtle)", pointerEvents: "none",
              }}>
                buscando…
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-2">
            <input name="rua" value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua" style={inp} />
            <input name="numero" defaultValue={endereco.numero ?? ""} placeholder="Nº" style={inp} />
          </div>
          <input name="bairro" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" style={inp} />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_60px] gap-2">
            <input name="cidade" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" style={inp} />
            <input name="estado" value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" maxLength={2} style={inp} />
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

  // Auto-salva a URL do avatar imediatamente após o upload.
  async function handleAvatarUpload(url: string | null) {
    setAvatarUrl(url);
    await atualizarAvatar(userId, url);
    router.refresh();
  }

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
        {/* Avatar — auto-salva ao fazer upload */}
        <div>
          <label style={lbl}>Foto de perfil</label>
          <ImageUpload
            currentUrl={avatarUrl}
            bucket="avatars"
            onUpload={handleAvatarUpload}
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

// ─── Operação Section ────────────────────────────────────────────────────────

function OperacaoSection({ barId, autoPedido, taxaServicoPct }: { barId: string; autoPedido: boolean; taxaServicoPct: number }) {
  const [enabled, setEnabled]       = useState(autoPedido);
  const [saving, setSaving]         = useState(false);
  const [taxa, setTaxa]             = useState(String(taxaServicoPct));
  const [taxaSaving, setTaxaSaving] = useState(false);
  const [taxaFeedback, setTaxaFeedback] = useState<ActionResult>(null);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    await atualizarAutoPedido(barId, next);
    setSaving(false);
  }

  async function handleTaxaSave() {
    const pct = parseFloat(taxa.replace(",", "."));
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setTaxaFeedback({ error: "Informe um valor entre 0 e 100." });
      return;
    }
    setTaxaSaving(true);
    const result = await atualizarTaxaServico(barId, pct);
    setTaxaFeedback(result);
    setTaxaSaving(false);
    setTimeout(() => setTaxaFeedback(null), 3000);
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Smartphone style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Operação
        </h3>
      </div>

      {/* Toggle auto_pedido */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        background: "var(--bg-inset)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 3px" }}>
            Pedido pelo celular (auto-pedido)
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
            {enabled
              ? "Cliente pode pedir direto pelo QR code, sem chamar o garçom."
              : "Cliente vê o cardápio mas precisa chamar o garçom para pedir."}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={saving}
          style={{
            flexShrink: 0,
            width: 44, height: 24,
            borderRadius: 12,
            border: "none",
            cursor: saving ? "default" : "pointer",
            background: enabled ? "var(--accent)" : "rgba(255,255,255,0.15)",
            position: "relative",
            transition: "background 200ms",
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span style={{
            position: "absolute",
            top: 3, left: enabled ? 23 : 3,
            width: 18, height: 18,
            borderRadius: "50%",
            background: "#ffffff",
            transition: "left 200ms",
            display: "block",
          }} />
        </button>
      </div>

      {/* Taxa de serviço */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", marginTop: 10,
        background: "var(--bg-inset)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 3px" }}>
            Taxa de serviço (%)
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
            Aplicada opcionalmente no fechamento da comanda. Use 0 para desativar.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={taxa}
            onChange={e => setTaxa(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTaxaSave()}
            style={{
              ...inp,
              width: 72, textAlign: "right",
              padding: "8px 10px",
            }}
          />
          <button
            type="button"
            onClick={handleTaxaSave}
            disabled={taxaSaving}
            style={{
              padding: "8px 14px", borderRadius: 4, border: "none",
              background: "var(--accent)", color: "var(--accent-fg)",
              fontSize: 12, fontWeight: 700, cursor: taxaSaving ? "default" : "pointer",
              opacity: taxaSaving ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {taxaSaving ? "..." : "Salvar"}
          </button>
        </div>
      </div>
      {taxaFeedback && <Feedback result={taxaFeedback} />}
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
  autoPedido?: boolean;
  taxaServicoPct?: number;
}

export function SettingsPanel({
  open, onClose, bar, barId, userId, userNome, userEmail, userAvatarUrl, autoPedido = false, taxaServicoPct = 10,
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

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)" }} />

          <OperacaoSection barId={barId} autoPedido={autoPedido} taxaServicoPct={taxaServicoPct} />

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Logout */}
          <section>
            <form action={signOut}>
              <button
                type="submit"
                style={{
                  background: "transparent",
                  border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
                  borderRadius: 4,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--danger)",
                  cursor: "pointer",
                  transition: "background 150ms, border-color 150ms",
                }}
                className="hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] hover:border-[var(--danger)]"
              >
                Sair da conta
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
