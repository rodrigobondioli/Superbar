"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registrarMovimento, atualizarMinimo, type EstoqueResult } from "@/lib/estoque/actions";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import type { ItemEstoque } from "@/lib/estoque/queries";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HistoricoItem {
  id: string;
  tipo: string;
  quantidade: number;
  motivo: string | null;
  criado_em: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_BOTOES = [
  { label: "Entrada", value: "compra" },
  { label: "Saída",   value: "perda" },
  { label: "Ajuste",  value: "ajuste" },
] as const;

const TIPO_HISTORICO: Record<string, { label: string; cor: string }> = {
  compra:    { label: "Entrada",  cor: "var(--ok)" },
  devolucao: { label: "Entrada",  cor: "var(--ok)" },
  perda:     { label: "Saída",    cor: "var(--danger)" },
  ajuste:    { label: "Ajuste",   cor: "var(--fg-subtle)" },
};

function dataRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: 11, color: "var(--fg-subtle)", display: "block",
  marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em",
};

const inp: React.CSSProperties = {
  background: "var(--bg-inset)", border: "1px solid var(--border)",
  borderRadius: 4, padding: "9px 12px", fontSize: 16,
  color: "var(--fg)", outline: "none", width: "100%",
  boxSizing: "border-box", colorScheme: "dark" as React.CSSProperties["colorScheme"],
};

// ─── MovimentoForm ─────────────────────────────────────────────────────────────

function MovimentoForm({ item, onClose }: { item: ItemEstoque; onClose: () => void }) {
  const [tipo, setTipo]       = useState<string>("compra");
  const [qtd, setQtd]         = useState("");
  const [motivo, setMotivo]   = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult]   = useState<EstoqueResult>(null);
  const [historico, setHistorico] = useState<HistoricoItem[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("estoque_movimentos")
      .select("id, tipo, quantidade, motivo, criado_em")
      .eq("referencia_id", item.id)
      .order("criado_em", { ascending: false })
      .limit(5)
      .returns<HistoricoItem[]>()
      .then(({ data }) => setHistorico(data ?? []));
  }, [item.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("quantidade", qtd);
    fd.set("tipo", tipo);
    fd.set("motivo", motivo);
    const r = await registrarMovimento(item.id, fd);
    setResult(r);
    setPending(false);
    if (r && "ok" in r) setTimeout(onClose, 800);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>

      {/* Tipo — botões segmentados */}
      <div>
        <label style={lbl}>Tipo</label>
        <div style={{ display: "flex", gap: 4 }}>
          {TIPO_BOTOES.map(({ label, value }) => {
            const selected = tipo === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTipo(value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  fontSize: 13,
                  fontWeight: selected ? 500 : 400,
                  background: selected ? "var(--bg)" : "transparent",
                  color: selected ? "var(--fg)" : "var(--fg-muted)",
                  border: selected ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background 100ms, color 100ms, border-color 100ms",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantidade */}
      <div>
        <label style={lbl}>Quantidade ({item.unidade})</label>
        <input
          type="number" min="0" step="0.01"
          value={qtd} onChange={e => setQtd(e.target.value)}
          placeholder={tipo === "ajuste" ? "Novo total" : "Qtd"}
          required style={inp} autoFocus
        />
      </div>

      {/* Motivo */}
      <div>
        <label style={lbl}>Motivo (opcional)</label>
        <input
          value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ex: Entrega Ambev, quebra de garrafa…"
          style={inp}
        />
      </div>

      {/* Feedback */}
      {result && (
        <p style={{
          fontSize: 12, padding: "8px 12px", borderRadius: 4,
          background: "ok" in result ? "color-mix(in srgb, var(--ok) 10%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)",
          color: "ok" in result ? "var(--ok)" : "var(--danger)",
          border: `1px solid ${"ok" in result ? "color-mix(in srgb, var(--ok) 20%, transparent)" : "color-mix(in srgb, var(--danger) 20%, transparent)"}`,
        }}>
          {"ok" in result ? "Registrado!" : ("error" in result ? result.error : "")}
        </p>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{
          background: "none", border: "1px solid var(--border)", borderRadius: 4,
          padding: "8px 16px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer",
        }}>
          Cancelar
        </button>
        <button type="submit" disabled={pending || !qtd} style={{
          background: "var(--accent)", color: "var(--accent-fg)",
          border: "none", borderRadius: 4,
          padding: "8px 16px", fontSize: 13, fontWeight: 600,
          cursor: pending || !qtd ? "not-allowed" : "pointer",
          opacity: pending || !qtd ? 0.6 : 1,
        }}>
          {pending ? "Salvando…" : "Registrar"}
        </button>
      </div>

      {/* Histórico */}
      <div style={{ height: 1, background: "var(--border)", margin: "6px 0 4px" }} />
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        Histórico
      </p>
      {historico === null ? (
        <p style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Carregando…</p>
      ) : historico.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Nenhum registro ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {historico.map(h => {
            const t = TIPO_HISTORICO[h.tipo] ?? { label: h.tipo, cor: "var(--fg-subtle)" };
            const sinal = h.tipo === "ajuste" ? "→" : h.tipo === "perda" ? "−" : "+";
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: t.cor, fontWeight: 500, minWidth: 46, flexShrink: 0 }}>
                  {t.label}
                </span>
                <span style={{ color: "var(--fg)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                  {sinal}{h.quantidade}
                </span>
                {h.motivo && (
                  <span style={{
                    color: "var(--fg-muted)", flex: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {h.motivo}
                  </span>
                )}
                <span style={{ color: "var(--fg-subtle)", marginLeft: "auto", flexShrink: 0 }}>
                  {dataRelativa(h.criado_em)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </form>
  );
}

// ─── MinimoForm ────────────────────────────────────────────────────────────────

function MinimoForm({ item, onClose }: { item: ItemEstoque; onClose: () => void }) {
  const [qtd, setQtd]       = useState(String(item.quantidadeMinima));
  const [pending, setPending] = useState(false);
  const [result, setResult]   = useState<EstoqueResult>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("quantidade_minima", qtd);
    const r = await atualizarMinimo(item.id, fd);
    setResult(r);
    setPending(false);
    if (r && "ok" in r) setTimeout(onClose, 600);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, paddingTop: 8, alignItems: "flex-end" }}>
      <input
        type="number" min="0" step="0.01"
        value={qtd} onChange={e => setQtd(e.target.value)}
        style={{
          background: "var(--bg-inset)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "7px 10px", fontSize: 16,
          color: "var(--fg)", outline: "none", width: 90,
          colorScheme: "dark" as React.CSSProperties["colorScheme"],
        }}
        autoFocus
      />
      <button type="submit" disabled={pending} style={{
        background: "var(--accent)", color: "var(--accent-fg)",
        border: "none", borderRadius: 4, padding: "7px 14px",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>
        {result && "ok" in result ? "✓" : pending ? "…" : "Ok"}
      </button>
      <button type="button" onClick={onClose} style={{
        background: "none", border: "1px solid var(--border)", borderRadius: 4,
        padding: "7px 12px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer",
      }}>
        ✕
      </button>
    </form>
  );
}

// ─── EstoqueClient ─────────────────────────────────────────────────────────────

export function EstoqueClient({ itens }: { itens: ItemEstoque[] }) {
  const [expandido, setExpandido]     = useState<string | null>(null);
  const [editandoMinimo, setEditandoMinimo] = useState<string | null>(null);

  // Alertas ordenados do mais crítico ao menos crítico
  const alertas = itens
    .filter(i => i.abaixoDoMinimo)
    .sort((a, b) => {
      const gravA = a.quantidadeMinima > 0
        ? Math.round(((a.quantidadeMinima - a.quantidadeAtual) / a.quantidadeMinima) * 100) : 0;
      const gravB = b.quantidadeMinima > 0
        ? Math.round(((b.quantidadeMinima - b.quantidadeAtual) / b.quantidadeMinima) * 100) : 0;
      return gravB - gravA;
    });
  const ok = itens.filter(i => !i.abaixoDoMinimo);

  function renderRow(item: ItemEstoque) {
    const emAlerta  = item.abaixoDoMinimo;
    const aberto    = expandido === item.id;
    const editMin   = editandoMinimo === item.id;
    const porcentagem = item.quantidadeMinima > 0
      ? Math.min(Math.round((item.quantidadeAtual / item.quantidadeMinima) * 100), 200)
      : 100;
    const gravidade = emAlerta && item.quantidadeMinima > 0
      ? Math.round(((item.quantidadeMinima - item.quantidadeAtual) / item.quantidadeMinima) * 100)
      : 0;
    const gravidadeCor = gravidade >= 25 ? "var(--danger)" : "var(--fg-subtle)";

    return (
      <div key={item.id} style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${emAlerta ? "color-mix(in srgb, var(--danger) 30%, var(--border))" : "var(--border)"}`,
        borderRadius: 4,
        overflow: "hidden",
      }}>
        {/* Linha principal */}
        <div
          className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
          style={{ gap: 12, padding: "14px 20px" }}
        >
          {/* Nome + barra */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {emAlerta && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 2,
                  background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                  color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  Alerta
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>
                {item.produtoNome}
              </span>
            </div>
            <div style={{ height: 3, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden", maxWidth: 200 }}>
              <div style={{
                height: 3, borderRadius: 2,
                width: `${Math.min(porcentagem, 100)}%`,
                background: emAlerta ? "var(--danger)" : "var(--ok)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between sm:contents gap-3">
            {/* Quantidade atual */}
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: 20, fontWeight: 600, fontFamily: "var(--font-mono)",
                color: emAlerta ? "var(--danger)" : "var(--fg)",
              }}>
                {item.quantidadeAtual % 1 === 0 ? item.quantidadeAtual : item.quantidadeAtual.toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: "var(--fg-subtle)", marginLeft: 4 }}>{item.unidade}</span>
            </div>

            {/* Mínimo + gravidade */}
            <div style={{ textAlign: "right" }}>
              {editMin ? (
                <MinimoForm item={item} onClose={() => setEditandoMinimo(null)} />
              ) : (
                <button
                  onClick={() => setEditandoMinimo(editMin ? null : item.id)}
                  title="Editar mínimo"
                  style={{ background: "none", border: "none", cursor: "pointer", textAlign: "right", padding: 0 }}
                >
                  <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                    mín. {item.quantidadeMinima} {item.unidade}
                  </span>
                  {emAlerta && gravidade > 0 && (
                    <span style={{ display: "block", fontSize: 11, color: gravidadeCor, marginTop: 1 }}>
                      −{gravidade}% do mín.
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Botão de registro */}
            <button
              onClick={() => setExpandido(aberto ? null : item.id)}
              style={{
                background: aberto ? "var(--bg-inset)" : "color-mix(in srgb, var(--accent-bright) 12%, transparent)",
                color: "var(--accent-bright)",
                border: `1px solid ${aberto ? "var(--border)" : "color-mix(in srgb, var(--accent-bright) 30%, transparent)"}`,
                borderRadius: 4, padding: "6px 14px",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {aberto ? "Cancelar" : "+ Registrar"}
            </button>
          </div>
        </div>

        {/* Formulário expandido + histórico */}
        {aberto && (
          <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border)" }}>
            <MovimentoForm item={item} onClose={() => setExpandido(null)} />
          </div>
        )}
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="Nenhum produto com estoque ativo"
        description="Ative o controle de estoque em cada produto no Cardápio para monitorar quantidade e receber alertas de mínimo."
        action={<EmptyStateButton variant="secondary" href="/dashboard/cardapio">Ir para o Cardápio →</EmptyStateButton>}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {alertas.length > 0 && (
        <div>
          <p style={{
            fontSize: 11, fontWeight: 500, color: "var(--danger)",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
          }}>
            {alertas.length} alerta{alertas.length > 1 ? "s" : ""} de estoque baixo
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.map(renderRow)}
          </div>
        </div>
      )}

      {ok.length > 0 && (
        <div>
          {alertas.length > 0 && (
            <p style={{
              fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              Em dia
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ok.map(renderRow)}
          </div>
        </div>
      )}
    </div>
  );
}
