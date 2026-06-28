"use client";

import { useState, useTransition } from "react";
import type { Cliente } from "@/types/database";
import { atualizarCliente } from "@/lib/clientes/actions";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fmtData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fmtUltima(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  return `${diff}d atrás`;
}

interface Props { clientes: Cliente[] }

export function ClientesTable({ clientes }: Props) {
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [isPending, startTransition] = useTransition();

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  function iniciarEdicao(c: Cliente) {
    setEditando(c.id);
    setForm({
      nome:            c.nome,
      telefone:        c.telefone ?? "",
      email:           c.email ?? "",
      data_nascimento: c.data_nascimento ?? "",
      drink_favorito:  c.drink_favorito ?? "",
      restricoes:      c.restricoes ?? "",
      notas:           c.notas ?? "",
    });
  }

  function salvar(id: string) {
    startTransition(async () => {
      await atualizarCliente(id, {
        nome:            form.nome ?? "",
        telefone:        form.telefone ?? "",
        email:           form.email ?? "",
        data_nascimento: form.data_nascimento ?? "",
        drink_favorito:  form.drink_favorito ?? "",
        restricoes:      form.restricoes ?? "",
        notas:           form.notas ?? "",
      });
      setEditando(null);
    });
  }

  if (clientes.length === 0) {
    return (
      <div style={{
        border: "1px solid var(--border)", borderRadius: 12,
        padding: "48px 24px", textAlign: "center",
        color: "var(--fg-subtle)", fontSize: 14,
      }}>
        <p style={{ fontSize: 32, margin: "0 0 12px" }}>👤</p>
        <p style={{ margin: 0 }}>Nenhum cliente cadastrado ainda.</p>
        <p style={{ margin: "4px 0 0", fontSize: 12 }}>
          Os clientes aparecem automaticamente quando usam um cartão QR/NFC,
          ou você pode adicionar manualmente acima.
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {/* Busca */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 14px", fontSize: 14,
            color: "var(--fg)", outline: "none",
          }}
        />
      </div>

      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 80px 80px 90px 44px",
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        fontSize: 11, color: "var(--fg-subtle)", fontWeight: 600, letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}>
        <span>Cliente</span>
        <span>Aniversário · Drink</span>
        <span>Contato</span>
        <span style={{ textAlign: "right" }}>Visitas</span>
        <span style={{ textAlign: "right" }}>Total</span>
        <span style={{ textAlign: "right" }}>Última</span>
        <span />
      </div>

      {/* Linhas */}
      {filtrados.map(c => (
        <div key={c.id}>
          {editando === c.id ? (
            /* ── Linha de edição ── */
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--accent) 4%, var(--bg))",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                {([
                  ["Nome*",          "nome",            "text"],
                  ["Telefone",       "telefone",        "tel"],
                  ["E-mail",         "email",           "email"],
                  ["Aniversário",    "data_nascimento", "date"],
                  ["Drink favorito", "drink_favorito",  "text"],
                  ["Restrições",     "restricoes",      "text"],
                ] as const).map(([label, key, type]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: "var(--fg-subtle)", display: "block", marginBottom: 4 }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={(form as Record<string, string>)[key] ?? ""}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: "var(--bg)", border: "1px solid var(--border)",
                        borderRadius: 6, padding: "6px 10px", fontSize: 13,
                        color: "var(--fg)", outline: "none",
                      }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11, color: "var(--fg-subtle)", display: "block", marginBottom: 4 }}>
                    Notas
                  </label>
                  <input
                    type="text"
                    value={(form.notas as string) ?? ""}
                    onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Anota o que o bartender precisa saber..."
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "var(--bg)", border: "1px solid var(--border)",
                      borderRadius: 6, padding: "6px 10px", fontSize: 13,
                      color: "var(--fg)", outline: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => salvar(c.id)}
                  disabled={isPending || !form.nome?.trim()}
                  style={{
                    background: "var(--accent)", color: "#000", border: "none",
                    borderRadius: 6, padding: "6px 16px", fontSize: 13,
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {isPending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditando(null)}
                  style={{
                    background: "transparent", color: "var(--fg-subtle)",
                    border: "1px solid var(--border)", borderRadius: 6,
                    padding: "6px 16px", fontSize: 13, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* ── Linha normal ── */
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 80px 80px 90px 44px",
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
              fontSize: 14,
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--fg)" }}>{c.nome}</p>
                {c.notas && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--fg-subtle)" }}>{c.notas}</p>
                )}
                {c.restricoes && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--warning, #f59e0b)" }}>
                    ⚠️ {c.restricoes}
                  </p>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                {c.data_nascimento ? `🎂 ${fmtData(c.data_nascimento)}` : "—"}
                {c.drink_favorito && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--fg-subtle)" }}>🍹 {c.drink_favorito}</p>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {c.telefone && <p style={{ margin: 0 }}>📱 {c.telefone}</p>}
                {c.email && <p style={{ margin: "2px 0 0" }}>✉️ {c.email}</p>}
                {!c.telefone && !c.email && <span>—</span>}
              </div>
              <p style={{ margin: 0, textAlign: "right", color: "var(--fg-muted)" }}>{c.total_visitas}</p>
              <p style={{ margin: 0, textAlign: "right", fontWeight: 600, color: "var(--accent)" }}>{fmt(c.total_gasto)}</p>
              <p style={{ margin: 0, textAlign: "right", fontSize: 12, color: "var(--fg-subtle)" }}>{fmtUltima(c.ultima_visita)}</p>
              <button
                onClick={() => iniciarEdicao(c)}
                title="Editar"
                style={{
                  background: "transparent", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                  fontSize: 13, color: "var(--fg-subtle)",
                }}
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      ))}

      {filtrados.length === 0 && busca && (
        <p style={{ padding: "24px", textAlign: "center", color: "var(--fg-subtle)", fontSize: 14, margin: 0 }}>
          Nenhum cliente encontrado para "{busca}".
        </p>
      )}
    </div>
  );
}
