"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export type MembroSimples = { id: string; nome: string; role: string };

const STORAGE_KEY = "sb_operador";

const ROLE_LABEL: Record<string, string> = {
  dono: "Dono", gerente: "Gerente", bar_manager: "Bar Manager",
  bartender: "Bartender", garcom: "Garçom", caixa: "Caixa",
};

// ─── Tela "Quem é você?" ──────────────────────────────────────────────────────
function QuemEVoce({ membros, onSelect }: { membros: MembroSimples[]; onSelect: (m: MembroSimples) => void }) {
  return (
    <div style={{
      height: "100%", overflowY: "auto",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      <p style={{
        fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)",
        textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px",
      }}>
        Quem está operando agora?
      </p>
      <p style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", margin: "0 0 48px", textAlign: "center", fontFamily: "var(--font-mono)" }}>
        Selecione seu nome
      </p>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
        width: "100%",
        maxWidth: 760,
      }}>
        {membros.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "center",
              width: 180,
              flexShrink: 0,
              transition: "background 0.15s, border-color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--accent) 18%, transparent)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--accent-bright) 45%, transparent)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--fg) 4%, transparent)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "color-mix(in srgb, var(--accent) 50%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-bright) 25%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "var(--accent-bright)",
              margin: "0 auto 16px",
            }}>
              {m.nome[0]?.toUpperCase()}
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>
              {m.nome}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
              {ROLE_LABEL[m.role] ?? m.role}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Roles que não operam o bartender — devem ser redirecionados */
function destinoPorRole(role: string): string | null {
  if (role === "caixa") return "/caixa";
  return null;
}

// ─── Shell principal ──────────────────────────────────────────────────────────
export function OperadorShell({
  membros, barNome, children,
}: {
  membros: MembroSimples[];
  barNome: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [operador, setOperador] = useState<MembroSimples | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const m = JSON.parse(salvo) as MembroSimples;
        const destino = destinoPorRole(m.role);
        if (destino) { router.push(destino); return; } // redireciona, não mostra bartender
        setOperador(m);
      } else if (membros.length === 1) {
        // Único membro ativo — entra direto sem pedir seleção
        const m = membros[0];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
        const destino = destinoPorRole(m.role);
        if (destino) { router.push(destino); return; }
        setOperador(m);
      }
    } catch {}
    setCarregado(true);
  }, []);

  function selecionar(m: MembroSimples) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    const destino = destinoPorRole(m.role);
    if (destino) { router.push(destino); return; }
    setOperador(m);
  }

  function trocar() {
    localStorage.removeItem(STORAGE_KEY);
    setOperador(null);
  }

  if (!carregado) return null;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52, flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}>
        {/* Esquerda — minWidth:0 impede que nome longo empurre o lado direito */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {barNome}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 4,
            background: "color-mix(in srgb, var(--accent) 30%, transparent)",
            color: "var(--accent-bright)",
            letterSpacing: "0.04em", textTransform: "uppercase",
            flexShrink: 0,
          }}>
            Bartender
          </span>
        </div>

        {/* Direita */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {operador ? (
            <>
              <span style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600 }}>{operador.nome}</span>
              <button
                onClick={trocar}
                style={{
                  fontSize: 12, fontWeight: 500,
                  color: "var(--fg-muted)",
                  background: "color-mix(in srgb, var(--fg) 6%, transparent)",
                  border: "1px solid var(--border)",
                  borderRadius: 4, padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Trocar
              </button>
            </>
          ) : (
            <form action={signOut}>
              <button type="submit" style={{
                fontSize: 12, color: "var(--fg-subtle)",
                background: "none", border: "none", cursor: "pointer",
              }}>
                Sair
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        {operador
          ? children
          : <QuemEVoce membros={membros} onSelect={selecionar} />
        }
      </main>
    </div>
  );
}
