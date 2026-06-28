"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { checkPin } from "@/lib/kiosk/actions";
import { AppHeader } from "@/components/ui/app-header";

export type MembroSimples = { id: string; nome: string; role: string; temPin: boolean; fotoUrl?: string | null };

const STORAGE_KEY = "sb_operador";

const ROLE_LABEL: Record<string, string> = {
  dono: "Dono", gerente: "Gerente", bar_manager: "Bar Manager",
  bartender: "Bartender", garcom: "Garçom", caixa: "Caixa",
};

// ─── Tela "Quem é você?" ──────────────────────────────────────────────────────
function QuemEVoce({
  membros,
  onSelect,
}: {
  membros: MembroSimples[];
  onSelect: (m: MembroSimples) => void;
}) {
  const [fotoErros, setFotoErros] = useState<Set<string>>(new Set());

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      <p style={{
        fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)",
        textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 32px",
      }}>
        Quem está operando agora?
      </p>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 12,
        justifyContent: "center", width: "100%", maxWidth: 960,
      }}>
        {membros.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "20px 16px", cursor: "pointer",
              textAlign: "center", width: 140, flexShrink: 0,
              transition: "background 0.15s, border-color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.background = "color-mix(in srgb, var(--accent) 18%, transparent)";
              (e.currentTarget).style.borderColor = "color-mix(in srgb, var(--accent) 45%, transparent)";
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.background = "color-mix(in srgb, var(--fg) 4%, transparent)";
              (e.currentTarget).style.borderColor = "var(--border)";
            }}
          >
            {m.fotoUrl && !fotoErros.has(m.id) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.fotoUrl}
                alt={m.nome}
                onError={() => setFotoErros(prev => new Set(prev).add(m.id))}
                style={{
                  width: 64, height: 64, borderRadius: "50%", objectFit: "cover",
                  margin: "0 auto 16px", display: "block",
                  border: "2px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "color-mix(in srgb, var(--accent) 50%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 700, color: "var(--accent)",
                margin: "0 auto 16px",
              }}>
                {m.nome[0]?.toUpperCase()}
              </div>
            )}
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>
              {m.nome}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
              {ROLE_LABEL[m.role] ?? m.role}
            </p>
            {m.temPin && (
              <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: "6px 0 0", opacity: 0.6 }}>
                🔒 PIN
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Teclado PIN ──────────────────────────────────────────────────────────────
function PinPad({
  membro,
  onSuccess,
  onCancel,
}: {
  membro: MembroSimples;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleDigit = useCallback((d: string) => {
    if (checking) return;
    setError(null);
    setDigits(prev => prev.length >= 4 ? prev : [...prev, d]);
  }, [checking]);

  const handleBackspace = useCallback(() => {
    setError(null);
    setDigits(prev => prev.slice(0, -1));
  }, []);

  // Verifica automaticamente quando 4 dígitos
  useEffect(() => {
    if (digits.length !== 4) return;
    let cancelled = false;

    (async () => {
      setChecking(true);
      const result = await checkPin(membro.id, digits.join(""));
      if (cancelled) return;
      if (result.ok) {
        onSuccess();
      } else {
        setError("PIN incorreto. Tente novamente.");
        setDigits([]);
        setChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [digits, membro.id, onSuccess]);

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 24px",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "color-mix(in srgb, var(--accent) 50%, transparent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, fontWeight: 700, color: "var(--accent)",
        margin: "0 auto 12px",
      }}>
        {membro.nome[0]?.toUpperCase()}
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>
        {membro.nome}
      </p>
      <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 32px" }}>
        Digite seu PIN
      </p>

      {/* Dots */}
      <div style={{ display: "flex", gap: 14, marginBottom: error ? 16 : 32 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: "50%",
            background: digits.length > i ? "var(--accent)" : "var(--border)",
            transition: "background 120ms",
          }} />
        ))}
      </div>

      {error && (
        <p style={{
          fontSize: 12, color: "var(--danger)", margin: "0 0 20px",
          background: "var(--danger-bg)", padding: "8px 16px", borderRadius: 6,
        }}>
          {error}
        </p>
      )}

      {/* Teclado */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 10,
        marginBottom: 24,
      }}>
        {keys.map((k, i) => {
          if (k === "") return <div key={i} />;
          const isBack = k === "⌫";
          return (
            <button
              key={i}
              onClick={() => isBack ? handleBackspace() : handleDigit(k)}
              disabled={checking}
              style={{
                height: 64, borderRadius: 12,
                background: isBack ? "transparent" : "color-mix(in srgb, var(--fg) 8%, transparent)",
                border: isBack ? "none" : "1px solid var(--border)",
                fontSize: isBack ? 20 : 22, fontWeight: isBack ? 400 : 600,
                color: isBack ? "var(--fg-subtle)" : "var(--fg)",
                cursor: checking ? "not-allowed" : "pointer",
                opacity: checking ? 0.5 : 1,
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      <button
        onClick={onCancel}
        style={{
          fontSize: 13, color: "var(--fg-subtle)",
          background: "none", border: "none", cursor: "pointer", padding: "8px 16px",
        }}
      >
        ← Voltar
      </button>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function destinoPorRole(role: string, currentPath: string): string | null {
  if (role === "caixa" && currentPath !== "/caixa") return "/caixa";
  return null;
}

// ─── Shell principal ──────────────────────────────────────────────────────────
export function OperadorShell({
  membros,
  barNome,
  roleLabel = "Operador",
  isKiosk = false,
  children,
}: {
  membros: MembroSimples[];
  barNome: string;
  roleLabel?: string;
  /** true = acesso via cookie kiosk, sem auth do dono */
  isKiosk?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [operador, setOperador] = useState<MembroSimples | null>(null);
  const [pinPendente, setPinPendente] = useState<MembroSimples | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const m = JSON.parse(salvo) as MembroSimples;
        const destino = destinoPorRole(m.role, window.location.pathname);
        if (destino) { router.push(destino); return; }
        setOperador(m);
      } else if (membros.length === 1) {
        const m = membros[0];
        if (m.temPin) {
          setPinPendente(m);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
          const destino = destinoPorRole(m.role, window.location.pathname);
          if (destino) { router.push(destino); return; }
          setOperador(m);
        }
      }
    } catch { /* ignora */ }
    setCarregado(true);
  }, []);

  function selecionar(m: MembroSimples) {
    if (m.temPin) { setPinPendente(m); return; }
    confirmarOperador(m);
  }

  function confirmarOperador(m: MembroSimples) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    const destino = destinoPorRole(m.role, window.location.pathname);
    if (destino) { router.push(destino); return; }
    setPinPendente(null);
    setOperador(m);
  }

  function trocar() {
    localStorage.removeItem(STORAGE_KEY);
    setOperador(null);
    setPinPendente(null);
  }

  if (!carregado) return null;

  // Tela de PIN
  if (pinPendente && !operador) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <AppHeader barNome={barNome} roleLabel={roleLabel} />
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <PinPad
            membro={pinPendente}
            onSuccess={() => confirmarOperador(pinPendente)}
            onCancel={() => { setPinPendente(null); setCarregado(true); }}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <AppHeader
        barNome={barNome}
        roleLabel={roleLabel}
        right={
          operador ? (
            <button
              onClick={trocar}
              style={{
                fontSize: 12, fontWeight: 500, color: "var(--fg-muted)",
                background: "color-mix(in srgb, var(--fg) 6%, transparent)",
                border: "1px solid var(--border)",
                borderRadius: 4, padding: "6px 12px", cursor: "pointer",
              }}
            >
              {operador.nome} · Trocar
            </button>
          ) : (
            /* Kiosk: sem Sair. Auth normal: mostra Sair */
            !isKiosk ? (
              <form action={signOut}>
                <button type="submit" style={{ fontSize: 12, color: "var(--fg-subtle)", background: "none", border: "none", cursor: "pointer" }}>
                  Sair
                </button>
              </form>
            ) : null
          )
        }
      />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {operador
          ? children
          : <QuemEVoce membros={membros} onSelect={selecionar} />
        }
      </main>
    </div>
  );
}
