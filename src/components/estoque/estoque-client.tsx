"use client";

import { useState } from "react";
import { ImportarNfePanel } from "@/components/estoque/importar-nfe-panel";
import { registrarMovimento, type EstoqueResult } from "@/lib/estoque/actions";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import type { ItemEstoque, MovimentoRecente } from "@/lib/estoque/queries";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_BOTOES = [
  { label: "Entrada", value: "compra" },
  { label: "Saída",   value: "perda" },
  { label: "Ajuste",  value: "ajuste" },
] as const;

const TIPO_META: Record<string, { label: string; cor: string; sinal: string }> = {
  compra:    { label: "Entrada",  cor: "var(--ok)",       sinal: "+" },
  devolucao: { label: "Entrada",  cor: "var(--ok)",       sinal: "+" },
  perda:     { label: "Saída",    cor: "var(--danger)",   sinal: "−" },
  ajuste:    { label: "Ajuste",   cor: "var(--fg-subtle)", sinal: "→" },
};

function dataRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  return `há ${d}d`;
}

const lbl: React.CSSProperties = {
  fontSize: 11, color: "var(--fg-subtle)", display: "block",
  marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em",
};

const inp: React.CSSProperties = {
  background: "var(--bg-inset)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "9px 12px", fontSize: 15,
  color: "var(--fg)", outline: "none", width: "100%",
  boxSizing: "border-box", colorScheme: "dark" as React.CSSProperties["colorScheme"],
};

// ─── Modal de registro ─────────────────────────────────────────────────────────

function MovimentoModal({ item, onClose }: { item: ItemEstoque; onClose: () => void }) {
  const [tipo, setTipo]       = useState<string>("compra");
  const [qtd, setQtd]         = useState("");
  const [custo, setCusto]     = useState("");
  const [motivo, setMotivo]   = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult]   = useState<EstoqueResult>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("quantidade", qtd);
    fd.set("tipo", tipo);
    fd.set("motivo", motivo);
    if (custo) fd.set("custo_unitario", custo);
    const r = await registrarMovimento(item.id, fd);
    setResult(r);
    setPending(false);
    if (r && "ok" in r) setTimeout(onClose, 700);
  }

  return (
    // Backdrop
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
      onClick={onClose}
    >
      {/* Painel */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 24,
          width: "100%",
          maxWidth: 440,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
              {item.produtoNome}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
              Estoque atual: {item.quantidadeAtual} {item.unidade}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 18, padding: 4 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display: "flex", gap: 6 }}>
              {TIPO_BOTOES.map(({ label, value }) => {
                const sel = tipo === value;
                return (
                  <button
                    key={value} type="button" onClick={() => setTipo(value)}
                    style={{
                      flex: 1, padding: "8px 10px", fontSize: 13,
                      fontWeight: sel ? 500 : 400,
                      background: sel ? "var(--bg)" : "transparent",
                      color: sel ? "var(--fg)" : "var(--fg-muted)",
                      border: sel ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                      borderRadius: 8, cursor: "pointer",
                      transition: "background 100ms, color 100ms",
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

          {/* Custo unitário — só em compras, treina o dono a pensar CMV */}
          {tipo === "compra" && (
            <div>
              <label style={lbl}>Custo unitário (R$, opcional)</label>
              <input
                type="number" min="0" step="0.01"
                value={custo} onChange={e => setCusto(e.target.value)}
                placeholder="Ex: 4.50"
                style={inp}
              />
            </div>
          )}

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
              fontSize: 12, padding: "8px 12px", borderRadius: 8,
              background: "ok" in result
                ? "color-mix(in srgb, var(--ok) 10%, transparent)"
                : "color-mix(in srgb, var(--danger) 10%, transparent)",
              color: "ok" in result ? "var(--ok)" : "var(--danger)",
              border: `1px solid ${"ok" in result
                ? "color-mix(in srgb, var(--ok) 20%, transparent)"
                : "color-mix(in srgb, var(--danger) 20%, transparent)"}`,
            }}>
              {"ok" in result ? "Registrado com sucesso!" : ("error" in result ? result.error : "")}
            </p>
          )}

          {/* Ações */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              background: "none", border: "1px solid var(--border)", borderRadius: 8,
              padding: "9px 18px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer",
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={pending || !qtd} style={{
              background: "var(--accent)", color: "var(--accent-fg)",
              border: "none", borderRadius: 8,
              padding: "9px 18px", fontSize: 13, fontWeight: 600,
              cursor: pending || !qtd ? "not-allowed" : "pointer",
              opacity: pending || !qtd ? 0.6 : 1,
            }}>
              {pending ? "Salvando…" : "Registrar"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── EstoqueClient ─────────────────────────────────────────────────────────────

interface EstoqueClientProps {
  itens: ItemEstoque[];
  movimentos: MovimentoRecente[];
}

export function EstoqueClient({ itens, movimentos }: EstoqueClientProps) {
  const [tab, setTab]           = useState<"atencao" | "movimentacoes">("atencao");
  const [modalItem, setModalItem] = useState<ItemEstoque | null>(null);
  const [copiadoLista, setCopiadoLista] = useState(false);
  const [nfeAberto, setNfeAberto] = useState(false);

  const alertas = itens
    .filter(i => i.abaixoDoMinimo)
    .sort((a, b) => {
      const gA = a.quantidadeMinima > 0
        ? ((a.quantidadeMinima - a.quantidadeAtual) / a.quantidadeMinima) : 0;
      const gB = b.quantidadeMinima > 0
        ? ((b.quantidadeMinima - b.quantidadeAtual) / b.quantidadeMinima) : 0;
      return gB - gA;
    });
  const ok = itens.filter(i => !i.abaixoDoMinimo);

  // Quantidade sugerida: enche até 2× o mínimo — evita reordenar toda semana
  function calcularSugerida(item: ItemEstoque): number {
    return Math.max(1, Math.ceil(item.quantidadeMinima * 2 - item.quantidadeAtual));
  }

  function fmtQtd(n: number): string {
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  }

  async function copiarLista() {
    const linhas = alertas.map(item => {
      const qtd = calcularSugerida(item);
      return `- ${item.produtoNome}: ${fmtQtd(qtd)} ${item.unidade}`;
    });
    const texto = `Comprar hoje:\n${linhas.join("\n")}`;
    await navigator.clipboard.writeText(texto);
    setCopiadoLista(true);
    setTimeout(() => setCopiadoLista(false), 2000);
  }

  if (itens.length === 0) {
    return (
      <>
        <ImportarNfePanel open={nfeAberto} onClose={() => setNfeAberto(false)} />
        <EmptyState
          icon="📦"
          title="Nenhum produto com estoque ativo"
          description="Suba a nota fiscal da sua compra e a gente puxa produtos, custos e fornecedor pro estoque — sem digitar. Ou ative o controle por produto no Cardápio."
          action={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => setNfeAberto(true)} style={{ background: "var(--accent)", border: "none", borderRadius: 999, padding: "10px 18px", fontSize: 14, fontWeight: 500, color: "var(--accent-fg)", cursor: "pointer" }}>Importar nota fiscal</button>
              <EmptyStateButton href="/dashboard/cardapio">Ir para o Cardápio →</EmptyStateButton>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      {/* Modal */}
      {modalItem && (
        <MovimentoModal item={modalItem} onClose={() => setModalItem(null)} />
      )}

      {/* Aviso */}
      <div style={{ marginTop: -8 }}>
        <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, maxWidth: 520 }}>
          Estoque atual por produto. O controle inteligente por ingredientes será ativado quando as receitas estiverem configuradas.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
        {(["atencao", "movimentacoes"] as const).map(t => {
          const label = t === "atencao" ? "Comprar" : "Movimentações";
          const count = t === "atencao" ? alertas.length : undefined;
          const ativo = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none", border: "none",
                borderBottom: `2px solid ${ativo ? "var(--accent-bright)" : "transparent"}`,
                padding: "10px 16px",
                fontSize: 13, fontWeight: ativo ? 500 : 400,
                color: ativo ? "var(--fg)" : "var(--fg-muted)",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "color 150ms",
                marginBottom: -1,
              }}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span style={{
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: 10, fontWeight: 700,
                  borderRadius: 8, padding: "1px 5px",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Atenção ── */}
      {tab === "atencao" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {alertas.length > 0 ? (
            <div>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                  {alertas.length} {alertas.length === 1 ? "item" : "itens"} para comprar
                </p>
                <button
                  onClick={copiarLista}
                  style={{
                    background: copiadoLista
                      ? "color-mix(in srgb, var(--ok) 12%, transparent)"
                      : "none",
                    border: `1px solid ${copiadoLista ? "color-mix(in srgb, var(--ok) 30%, transparent)" : "var(--border)"}`,
                    borderRadius: 8, padding: "5px 12px",
                    fontSize: 12,
                    color: copiadoLista ? "var(--ok)" : "var(--fg-muted)",
                    cursor: "pointer", transition: "all 150ms",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiadoLista ? "✓ Copiado!" : "Copiar lista"}
                </button>
              </div>

              {/* Lista de compra — linhas estilo Figma */}
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16, overflow: "hidden",
              }}>
                {alertas.map((item, i) => {
                  const sugerida = calcularSugerida(item);
                  const critico = item.quantidadeAtual <= 0;
                  const cor = critico ? "var(--danger)" : "var(--warn)";
                  return (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "16px 24px",
                      borderBottom: i < alertas.length - 1 ? "1px solid var(--border-strong)" : "none",
                    }}>
                      {/* Esquerda: dot + nome + status */}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0, alignSelf: "center" }} />
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)" }}>{item.produtoNome}</span>
                        <span style={{ fontSize: 13 }}>
                          <span style={{ color: cor }}>{fmtQtd(item.quantidadeAtual)}</span>
                          <span style={{ color: "var(--fg-muted)" }}> em estoque · mínimo {fmtQtd(item.quantidadeMinima)}</span>
                        </span>
                      </div>

                      {/* Direita: Comprar N un (abre modal) */}
                      <button
                        onClick={() => setModalItem(item)}
                        style={{
                          background: "none", border: "none", padding: 0, cursor: "pointer",
                          fontSize: 15, fontWeight: 500, color: "var(--fg)", whiteSpace: "nowrap", flexShrink: 0,
                        }}
                        className="hover:!text-[var(--accent)]"
                      >
                        Comprar {fmtQtd(sugerida)} {item.unidade}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: "28px 0", textAlign: "center" as const }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ok)", marginBottom: 4 }}>✓ Estoque em dia</p>
              <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>Nenhum item abaixo do mínimo.</p>
            </div>
          )}

          {ok.length > 0 && (
            <div>
              {alertas.length > 0 && (
                <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Em dia
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ok.map(item => (
                  <div key={item.id} style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    display: "flex", alignItems: "center",
                    gap: 12, padding: "12px 20px",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--fg-muted)", flex: 1 }}>
                      {item.produtoNome}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
                      {item.quantidadeAtual % 1 === 0 ? item.quantidadeAtual : item.quantidadeAtual.toFixed(1)}
                      <span style={{ fontSize: 11, fontWeight: 400, color: "var(--fg-subtle)", marginLeft: 3 }}>{item.unidade}</span>
                    </span>
                    <button
                      onClick={() => setModalItem(item)}
                      style={{
                        background: "none", border: "1px solid var(--border)",
                        borderRadius: 8, padding: "5px 12px",
                        fontSize: 12, color: "var(--fg-muted)", cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      + Registrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Movimentações ── */}
      {tab === "movimentacoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {movimentos.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", padding: "24px 0" }}>
              Nenhuma movimentação registrada ainda.
            </p>
          ) : (
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}>
              {movimentos.map((mov, i) => {
                const meta = TIPO_META[mov.tipo] ?? { label: mov.tipo, cor: "var(--fg-subtle)", sinal: "·" };
                return (
                  <div
                    key={mov.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 20px",
                      borderBottom: i < movimentos.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: meta.cor, minWidth: 52, flexShrink: 0 }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: meta.cor, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {meta.sinal}{mov.quantidade}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--fg)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mov.produtoNome}
                    </span>
                    {mov.motivo && (
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mov.motivo}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--fg-subtle)", flexShrink: 0, marginLeft: "auto" }}>
                      {dataRelativa(mov.criadoEm)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
