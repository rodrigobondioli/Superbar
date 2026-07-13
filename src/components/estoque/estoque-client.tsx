"use client";

import { useState } from "react";
import { ImportarNfePanel } from "@/components/estoque/importar-nfe-panel";
import { registrarMovimento, type EstoqueResult } from "@/lib/estoque/actions";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import type { ItemEstoque, MovimentoRecente } from "@/lib/estoque/queries";

// Divisória vertical "|" para separar dados inline numa linha.
function Sep() {
  return <span aria-hidden style={{ width: 1, height: 20, background: "var(--border-strong)", flexShrink: 0 }} />;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_BOTOES = [
  { label: "Entrada", value: "compra" },
  { label: "Saída",   value: "perda" },
  { label: "Ajuste",  value: "ajuste" },
] as const;

const TIPO_META: Record<string, { label: string; cor: string; sinal: string }> = {
  entrada:   { label: "Entrada",  cor: "var(--ok)",        sinal: "+" },
  venda:     { label: "Saída",    cor: "var(--danger)",    sinal: "−" },
  ajuste:    { label: "Ajuste",   cor: "var(--fg-subtle)", sinal: "→" },
  // legados (movimentos antigos da tabela estoque)
  compra:    { label: "Entrada",  cor: "var(--ok)",        sinal: "+" },
  devolucao: { label: "Entrada",  cor: "var(--ok)",        sinal: "+" },
  perda:     { label: "Saída",    cor: "var(--danger)",    sinal: "−" },
};

// Custo por unidade-base pode ser fração de centavo (ex: R$ 0,0016/g). Mostra
// mais casas quando é pequeno pra não virar "R$ 0,00".
function fmtCusto(v: number): string {
  const casas = v > 0 && v < 0.1 ? 4 : 2;
  return "R$ " + v.toFixed(casas).replace(".", ",");
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v < 100 ? 2 : 0 });
}

function fmtNum(n: number): string {
  return (n % 1 === 0 ? n : Number(n.toFixed(2))).toLocaleString("pt-BR");
}

// Quantidade legível: ml→L e g→kg quando grande (6000 ml → "6 L").
function fmtBase(q: number, unidade: string): string {
  if (unidade === "ml" && Math.abs(q) >= 1000) return `${fmtNum(q / 1000)} L`;
  if (unidade === "g" && Math.abs(q) >= 1000) return `${fmtNum(q / 1000)} kg`;
  return `${fmtNum(q)} ${unidade}`;
}

function pluralUnidade(u: string, n: number): string {
  if (n === 1) return u;
  return u.endsWith("s") ? u : u + "s";
}

// Rótulo inteligente: sólido (g/kg) nunca é "garrafa" — vira "pacote".
function rotuloCompraDe(unidade: string, unidadeCompra: string | null): string {
  const solido = unidade === "g" || unidade === "kg";
  if (unidadeCompra && !(solido && unidadeCompra === "garrafa")) return unidadeCompra;
  return solido ? "pacote" : "garrafa";
}

// "6 garrafas" (principal) + "6 L" (base) quando há embalagem; senão só a base.
function formatEstoque(item: ItemEstoque): { principal: string; base: string } {
  const base = fmtBase(item.quantidadeAtual, item.unidade);
  if (item.tamanhoEmbalagem && item.tamanhoEmbalagem > 0) {
    const emb = item.quantidadeAtual / item.tamanhoEmbalagem;
    const rot = rotuloCompraDe(item.unidade, item.unidadeCompra);
    return { principal: `${fmtNum(emb)} ${pluralUnidade(rot, emb)}`, base };
  }
  return { principal: base, base: "" };
}

// Categorização best-effort por palavra-chave no nome (sem coluna no banco).
type Cat = "Destilados" | "Licores" | "Xaropes & mixers" | "Frutas & ervas" | "Secos" | "Outros";
const CAT_ORDER: Cat[] = ["Destilados", "Licores", "Xaropes & mixers", "Frutas & ervas", "Secos", "Outros"];
function categoriaDe(nome: string): Cat {
  const n = nome.toLowerCase();
  if (/gin|vodka|rum|whisk|cacha|tequila|conhaque|pisco|aguardente|steinh|bourbon|licor de/.test(n)) return "Destilados";
  if (/licor|cointreau|campari|aperol|vermute|martini|triple ?sec|curac|amaretto|jager|fernet|aperitivo/.test(n)) return "Licores";
  if (/xarope|goma|tonica|tônica|refri|suco|soda|energ|groselha|grenadine|monin|xpe/.test(n)) return "Xaropes & mixers";
  if (/limao|limão|laranja|hortela|hortelã|morango|maracuj|gengibre|manjeric|abacaxi|menta|amora|framboesa|fruta|capim/.test(n)) return "Frutas & ervas";
  if (/acucar|açúcar|açucar|acúcar|\bsal\b|gelo|canela|cafe|café|\bcha\b|chá|mel|leite|creme|noz/.test(n)) return "Secos";
  return "Outros";
}

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
  background: "var(--bg-hover)", border: "1px solid var(--border)",
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Ajustar estoque
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
              {item.nome}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "4px 0 0", lineHeight: 1.5 }}>
              Estoque atual: {item.quantidadeAtual} {item.unidade}. Lance uma <strong style={{ color: "var(--fg-muted)" }}>entrada</strong> (compra sem nota), uma <strong style={{ color: "var(--fg-muted)" }}>saída</strong> (perda/quebra) ou um <strong style={{ color: "var(--fg-muted)" }}>acerto</strong> do total.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 18, padding: 4 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display: "flex", gap: 8 }}>
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
  /** Abre o painel de importação de NF-e já ao carregar (deep-link do guia). */
  abrirImportacao?: boolean;
}

export function EstoqueClient({ itens, movimentos, abrirImportacao = false }: EstoqueClientProps) {
  const [tab, setTab]           = useState<"atencao" | "movimentacoes">("atencao");
  const [modalItem, setModalItem] = useState<ItemEstoque | null>(null);
  const [copiadoLista, setCopiadoLista] = useState(false);
  const [nfeAberto, setNfeAberto] = useState(abrirImportacao);
  const [busca, setBusca]       = useState("");
  const [cat, setCat]           = useState<Cat | "Todos">("Todos");

  const alertas = itens
    .filter(i => i.abaixoDoMinimo)
    .sort((a, b) => {
      const gA = a.quantidadeMinima > 0
        ? ((a.quantidadeMinima - a.quantidadeAtual) / a.quantidadeMinima) : 0;
      const gB = b.quantidadeMinima > 0
        ? ((b.quantidadeMinima - b.quantidadeAtual) / b.quantidadeMinima) : 0;
      return gB - gA;
    });
  // Lista principal: categoria (por nome) + filtro de busca/categoria.
  const comCat = itens.map(i => ({ ...i, categoria: categoriaDe(i.nome) }));
  const cats = CAT_ORDER.filter(c => comCat.some(i => i.categoria === c));
  const buscaLower = busca.trim().toLowerCase();
  const filtrados = comCat.filter(i =>
    (cat === "Todos" || i.categoria === cat) &&
    (buscaLower === "" || i.nome.toLowerCase().includes(buscaLower))
  );

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
      return `- ${item.nome}: ${fmtQtd(qtd)} ${item.unidade}`;
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
          title="Nenhum insumo no estoque ainda"
          description="Suba a NF-e da sua compra: puxamos os insumos, o custo e o fornecedor pro estoque, sem digitar. É esse custo que faz cada drink nascer com a margem certa."
          action={
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <EmptyStateButton onClick={() => setNfeAberto(true)}>Importar nota fiscal</EmptyStateButton>
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


      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
        {(["atencao", "movimentacoes"] as const).map(t => {
          const label = t === "atencao" ? "Estoque" : "Movimentações";
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
                display: "flex", alignItems: "center", gap: 8,
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

      {/* ── Tab: Estoque (lista de insumos) ── */}
      {tab === "atencao" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Repor: só quando há item abaixo do mínimo */}
          {alertas.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              background: "color-mix(in srgb, var(--warn) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--warn) 30%, transparent)",
              borderRadius: 12, padding: "12px 16px",
            }}>
              <span style={{ fontSize: 13, color: "var(--fg)" }}>
                <strong>{alertas.length}</strong> {alertas.length === 1 ? "insumo abaixo" : "insumos abaixo"} do mínimo — hora de repor.
              </span>
              <button onClick={copiarLista} style={{
                background: copiadoLista ? "color-mix(in srgb, var(--ok) 14%, transparent)" : "var(--bg-card)",
                border: `1px solid ${copiadoLista ? "color-mix(in srgb, var(--ok) 30%, transparent)" : "var(--border-strong)"}`,
                borderRadius: "var(--r-pill)", padding: "6px 14px", fontSize: 12,
                color: copiadoLista ? "var(--ok)" : "var(--fg-muted)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {copiadoLista ? "✓ Copiado!" : "Copiar lista de compra"}
              </button>
            </div>
          )}

          {/* Busca + total parado */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Filtro de categoria à esquerda */}
            {cats.length > 1 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                {(["Todos", ...cats] as const).map(c => {
                  const on = cat === c;
                  return (
                    <button key={c} onClick={() => setCat(c)} style={{
                      background: on ? "var(--fg)" : "var(--bg-card)",
                      color: on ? "var(--bg)" : "var(--fg-muted)",
                      border: `1px solid ${on ? "var(--fg)" : "var(--border-strong)"}`,
                      borderRadius: "var(--r-pill)", padding: "5px 14px", fontSize: 13, cursor: "pointer",
                      transition: "background 120ms, color 120ms",
                    }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* Busca à direita (mesmo visual da contagem) */}
            <SearchInput value={busca} onChange={setBusca} placeholder="Buscar insumo…" style={{ width: 240, maxWidth: "100%" }} />
          </div>

          {/* Lista */}
          {filtrados.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", padding: "24px 0", textAlign: "center" }}>
              Nenhum insumo encontrado.
            </p>
          ) : (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {filtrados.map((item, i) => {
                const est = formatEstoque(item);
                const critico = item.quantidadeAtual <= 0;
                const cor = critico ? "var(--danger)" : item.abaixoDoMinimo ? "var(--warn)" : null;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                    borderBottom: i < filtrados.length - 1 ? "1px solid var(--border-strong)" : "none",
                  }}>
                    {/* nome + custo */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      {cor && <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />}
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nome}</span>
                        {item.custoAtual > 0 && (
                          <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{fmtCusto(item.custoAtual)}/{item.unidade}</span>
                        )}
                      </div>
                    </div>

                    {/* Tudo inline com divisórias: qtd | base | valor | ação */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: cor ?? "var(--fg)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {est.principal}
                      </span>
                      {est.base && (
                        <>
                          <Sep />
                          <span style={{ fontSize: 12, color: "var(--fg-subtle)", whiteSpace: "nowrap" }}>{est.base}</span>
                        </>
                      )}
                      <Sep />
                      <span style={{ fontSize: 13, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", minWidth: 64, textAlign: "right" }}>
                        {fmtBRL(item.valorEstoque)}
                      </span>
                      <Sep />
                      <button onClick={() => setModalItem(item)} style={{
                        background: "none", border: "1px solid var(--border)", borderRadius: "var(--r-pill)",
                        padding: "6px 14px", fontSize: 12, color: "var(--fg-muted)", cursor: "pointer", whiteSpace: "nowrap",
                      }} className="hover:!text-[var(--fg)]" title="Entrada, saída ou acerto de estoque">
                        Ajustar
                      </button>
                    </div>
                  </div>
                );
              })}
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
