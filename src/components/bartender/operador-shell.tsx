"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
        fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.30)",
        textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px",
      }}>
        Quem está operando agora?
      </p>
      <p style={{ fontSize: 32, fontWeight: 700, color: "white", margin: "0 0 48px", textAlign: "center" }}>
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
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "center",
              width: 180,
              flexShrink: 0,
              transition: "background 0.15s, border-color 0.15s, transform 0.1s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(38,0,120,0.35)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.45)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(38,0,120,0.50)",
              border: "1px solid rgba(124,58,237,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "rgba(160,130,255,0.9)",
              margin: "0 auto 16px",
            }}>
              {m.nome[0]?.toUpperCase()}
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "white", margin: "0 0 6px" }}>
              {m.nome}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", margin: 0 }}>
              {ROLE_LABEL[m.role] ?? m.role}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────
export function OperadorShell({
  membros, barNome, children,
}: {
  membros: MembroSimples[];
  barNome: string;
  children: React.ReactNode;
}) {
  const [operador, setOperador] = useState<MembroSimples | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) setOperador(JSON.parse(salvo));
    } catch {}
    setCarregado(true);
  }, []);

  function selecionar(m: MembroSimples) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    setOperador(m);
  }

  function trocar() {
    localStorage.removeItem(STORAGE_KEY);
    setOperador(null);
  }

  if (!carregado) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a10" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#0a0a10",
      }}>
        {/* Esquerda */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{barNome}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
            background: "rgba(38,0,120,0.30)", color: "rgba(160,130,255,0.85)",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Bartender
          </span>
        </div>

        {/* Direita */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {operador && (
            <>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                <span style={{ color: "white", fontWeight: 600 }}>{operador.nome}</span>
              </span>
              <button
                onClick={trocar}
                style={{
                  fontSize: 12, fontWeight: 500,
                  color: "rgba(255,255,255,0.40)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 8, padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Trocar
              </button>
            </>
          )}
          <Link
            href="/dashboard"
            style={{
              fontSize: 12, fontWeight: 500,
              color: "rgba(255,255,255,0.30)",
              textDecoration: "none",
              padding: "6px 0",
            }}
          >
            ← Dashboard
          </Link>
          <form action={signOut}>
            <button type="submit" style={{
              fontSize: 12, color: "rgba(255,255,255,0.20)",
              background: "none", border: "none", cursor: "pointer", padding: "6px 0",
            }}>
              Sair
            </button>
          </form>
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
