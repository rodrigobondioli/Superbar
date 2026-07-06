"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "@/lib/auth/actions";
import { checkPin } from "@/lib/kiosk/actions";
import { AppHeader } from "@/components/ui/app-header";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/role-labels";

export type MembroSimples = { id: string; nome: string; role: string; temPin: boolean; fotoUrl?: string | null };

const STORAGE_KEY = "sb_operador";

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
        fontSize: 15, fontWeight: 500, color: "var(--fg-muted)",
        margin: "0 0 32px",
      }}>
        Quem está operando agora?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full" style={{ maxWidth: 960 }}>
        {membros.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className="[-webkit-tap-highlight-color:transparent] hover:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-[background,border-color] duration-150"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)", borderRadius: 16,
              padding: "18px 12px", cursor: "pointer",
              textAlign: "center", width: "100%",
            }}
          >
            {m.fotoUrl && !fotoErros.has(m.id) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.fotoUrl}
                alt={m.nome}
                onError={() => setFotoErros(prev => new Set(prev).add(m.id))}
                style={{
                  width: 52, height: 52, borderRadius: "50%", objectFit: "cover",
                  margin: "0 auto 10px", display: "block",
                  border: "2px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "color-mix(in srgb, var(--accent) 50%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "var(--accent)",
                margin: "0 auto 10px",
              }}>
                {m.nome[0]?.toUpperCase()}
              </div>
            )}
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 3px", lineHeight: 1.25 }}>
              {m.nome}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
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

      <Button variant="ghost" onClick={onCancel}>← Voltar</Button>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const [operador, setOperador] = useState<MembroSimples | null>(null);
  const [pinPendente, setPinPendente] = useState<MembroSimples | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const m = JSON.parse(salvo) as MembroSimples;
        setOperador(m);
      } else if (membros.length === 1) {
        const m = membros[0];
        if (m.temPin) {
          setPinPendente(m);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
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
              title={`${operador.nome} · Trocar`}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 999, padding: "5px 14px 5px 5px", cursor: "pointer",
                color: "var(--fg-muted)", fontSize: 13, fontWeight: 500, flexShrink: 0,
              }}
            >
              {operador.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={operador.fotoUrl} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "color-mix(in srgb, var(--accent) 50%, transparent)",
                  color: "var(--accent)", fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {operador.nome[0]?.toUpperCase()}
                </span>
              )}
              Trocar
            </button>
          ) : (
            /* Kiosk: sem Sair. Auth normal: mostra Sair */
            !isKiosk ? (
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">Sair</Button>
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
