"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import type { Cliente } from "@/types/database";
import { atualizarCliente } from "@/lib/clientes/actions";
import { formatBRL as fmt } from "@/lib/format";


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

function statusCliente(c: Cliente): { txt: string; cor: string } {
  const inativo = c.ultima_visita ? (Date.now() - new Date(c.ultima_visita).getTime()) / 86400000 > 30 : true;
  if ((c.total_gasto ?? 0) >= 1500) return { txt: "VIP", cor: "var(--accent)" };
  if (inativo) return { txt: "Inativo", cor: "var(--fg-subtle)" };
  return { txt: "Ativo", cor: "var(--ok)" };
}

// Colunas da tabela (Figma): Cliente · Status · Aniversário · Telefone · Visitas · Total · Última · WhatsApp
const GRID = "minmax(0,2fr) 100px 110px 150px 72px 130px 90px 48px";

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
        border: "1px solid var(--border)", borderRadius: 16,
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
    <div>
      {/* Busca */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: "100%", maxWidth: 360, boxSizing: "border-box",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--r-pill)", padding: "10px 16px", fontSize: 13,
            color: "var(--fg)", outline: "none", colorScheme: "dark",
          }}
        />
      </div>

      <div className="overflow-x-auto">
      <div className="lg:min-w-[820px]">

      {/* Header */}
      <div className="hidden lg:grid" style={{
        gridTemplateColumns: GRID,
        gap: "0 16px",
        padding: "0 0 16px",
        borderBottom: "1px solid var(--border-strong)",
        fontSize: 13, color: "var(--fg-muted)", fontWeight: 500,
      }}>
        <span>Cliente</span>
        <span>Status</span>
        <span>Aniversário</span>
        <span>Telefone</span>
        <span>Visitas</span>
        <span>Total</span>
        <span>Última</span>
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
              background: "var(--bg-elevated)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
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
                        borderRadius: 8, padding: "6px 10px", fontSize: 13,
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
                      borderRadius: 8, padding: "6px 10px", fontSize: 13,
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
                    background: "var(--accent)", color: "var(--accent-fg)", border: "none",
                    borderRadius: "var(--r-pill)", padding: "10px 24px", fontSize: 14,
                    fontWeight: 500, cursor: "pointer",
                  }}
                >
                  {isPending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditando(null)}
                  style={{
                    background: "transparent", color: "var(--fg)",
                    border: "1px solid var(--border-strong)", borderRadius: "var(--r-pill)",
                    padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* ── Linha normal (colunas Figma) ── */
            (() => {
              const st = statusCliente(c);
              const waNum = c.telefone?.replace(/\D/g, "");
              const waHref = waNum ? `https://wa.me/55${waNum}` : null;
              return (
                <div className="grid" style={{
                  gridTemplateColumns: GRID,
                  gap: "0 16px",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-strong)",
                  alignItems: "center",
                }}>
                  <button
                    onClick={() => iniciarEdicao(c)}
                    title="Editar cliente"
                    style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 15, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    className="hover:!text-[var(--accent)]"
                  >
                    {c.nome}
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: st.cor }}>{st.txt}</span>
                  <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{fmtData(c.data_nascimento)}</span>
                  <span style={{ fontSize: 13, color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.telefone ?? "—"}</span>
                  <span style={{ fontSize: 15, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{c.total_visitas}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{fmt(c.total_gasto)}</span>
                  <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{fmtUltima(c.ultima_visita)}</span>
                  {waHref ? (
                    <a href={waHref} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                      style={{ width: 32, height: 32, borderRadius: "var(--r-pill)", background: "var(--bg-card-hi)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)", flexShrink: 0 }}
                      className="hover:!text-[var(--fg)]">
                      <MessageCircle style={{ width: 16, height: 16 }} />
                    </a>
                  ) : <span />}
                </div>
              );
            })()
          )}
        </div>
      ))}

      {filtrados.length === 0 && busca && (
        <p style={{ padding: "24px", textAlign: "center", color: "var(--fg-subtle)", fontSize: 14, margin: 0 }}>
          Nenhum cliente encontrado para &quot;{busca}&quot;.
        </p>
      )}
      </div>
      </div>
    </div>
  );
}
