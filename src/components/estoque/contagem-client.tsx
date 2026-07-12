"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Loader2, Check, Search } from "lucide-react";
import { salvarContagem, type ContagemLinha, type ContagemResultado } from "@/lib/estoque/actions";
import type { InsumoContagem } from "@/lib/estoque/queries";
import { currency } from "@/lib/format";

const qtd = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

type Phase = "contando" | "salvando" | "resumo";

/** Insumo contado por embalagem (garrafa/lata) quando não é unidade avulsa. */
function contaPorEmbalagem(i: InsumoContagem) {
  return i.unidade !== "un";
}
function rotuloEmbalagem(i: InsumoContagem) {
  return i.unidadeCompra ?? "garrafa";
}

export function ContagemClient({ insumos, voltarHref = "/dashboard/estoque" }: { insumos: InsumoContagem[]; voltarHref?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("contando");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [tamanhos, setTamanhos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      insumos.filter((i) => i.tamanhoEmbalagem != null).map((i) => [i.id, String(i.tamanhoEmbalagem)]),
    ),
  );
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ itens: ContagemResultado[]; totalImpacto: number; ajustados: number } | null>(null);

  const contados = useMemo(
    () => Object.values(valores).filter((v) => v.trim() !== "").length,
    [valores],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? insumos.filter((i) => i.nome.toLowerCase().includes(q)) : insumos;
  }, [insumos, busca]);

  async function salvar() {
    const linhas: ContagemLinha[] = [];
    const semTamanho: string[] = [];

    for (const i of insumos) {
      const raw = (valores[i.id] ?? "").trim();
      if (raw === "") continue;
      const count = parseFloat(raw.replace(",", "."));
      if (!Number.isFinite(count) || count < 0) continue;

      if (!contaPorEmbalagem(i)) {
        linhas.push({ ingredienteId: i.id, contado: count });
        continue;
      }
      const size = parseFloat((tamanhos[i.id] ?? "").replace(",", "."));
      if (!Number.isFinite(size) || size <= 0) { semTamanho.push(i.nome); continue; }
      linhas.push({
        ingredienteId: i.id,
        contado: count * size,
        tamanhoEmbalagem: size,
        unidadeCompra: rotuloEmbalagem(i),
      });
    }

    if (semTamanho.length > 0) {
      setErro(`Diga o tamanho da embalagem de: ${semTamanho.join(", ")} (ex: 750 ml por garrafa).`);
      return;
    }
    if (linhas.length === 0) { setErro("Conte pelo menos um insumo."); return; }

    setErro(null);
    setPhase("salvando");
    const res = await salvarContagem(linhas);
    if ("error" in res) { setErro(res.error); setPhase("contando"); return; }
    setResultado({ itens: res.itens, totalImpacto: res.totalImpacto, ajustados: res.ajustados });
    setPhase("resumo");
  }

  // ─── Sem insumos ───
  if (insumos.length === 0) {
    return (
      <Wrap onVoltar={() => router.push(voltarHref)}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: 16, color: "var(--fg)", margin: "0 0 6px" }}>Nenhum insumo cadastrado</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Suba uma nota (NF-e) ou monte fichas pra ter insumos pra contar.</p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap onVoltar={() => router.push(voltarHref)}>
      {erro && (
        <div style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "var(--fg)" }}>
          {erro}
        </div>
      )}

      {/* ── CONTANDO ── */}
      {phase === "contando" && (
        <>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 4px", lineHeight: 1.5 }}>
            Conte em garrafas (ou latas). Garrafa aberta pela metade? Ponha 0,5. O que não contar fica como está.
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 16px" }}>
            Depois de salvar, ajusto o estoque pra bater com sua contagem.
          </p>

          {/* Busca */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar insumo…"
              style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px 9px 34px", fontSize: 13, color: "var(--fg)", outline: "none", colorScheme: "dark", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {filtrados.map((i) => {
              const embalagem = contaPorEmbalagem(i);
              return (
                <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, flexWrap: "wrap" }}>
                  <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", minWidth: 120 }}>{i.nome}</span>

                  {/* Contagem */}
                  <input
                    value={valores[i.id] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [i.id]: e.target.value }))}
                    inputMode="decimal"
                    placeholder="—"
                    style={campo(76)}
                  />
                  <span style={{ fontSize: 12, color: "var(--fg-subtle)", width: 54, flexShrink: 0 }}>
                    {embalagem ? rotuloEmbalagem(i) : i.unidade}
                  </span>

                  {/* Tamanho da embalagem (só p/ quem conta por garrafa) */}
                  {embalagem && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>de</span>
                      <input
                        value={tamanhos[i.id] ?? ""}
                        onChange={(e) => setTamanhos((t) => ({ ...t, [i.id]: e.target.value }))}
                        inputMode="decimal"
                        placeholder="750"
                        title="Tamanho da embalagem"
                        style={campo(64)}
                      />
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)", width: 20 }}>{i.unidade}</span>
                    </span>
                  )}
                </div>
              );
            })}
            {filtrados.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", textAlign: "center", padding: "20px 0" }}>Nenhum insumo encontrado.</p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{contados} de {insumos.length} contados</span>
            <button onClick={salvar} disabled={contados === 0} style={cta(contados === 0)}>
              <ClipboardCheck style={{ width: 16, height: 16 }} /> Salvar contagem
            </button>
          </div>
        </>
      )}

      {/* ── SALVANDO ── */}
      {phase === "salvando" && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <Loader2 style={{ width: 26, height: 26, color: "var(--accent)", margin: "0 auto 16px" }} className="animate-spin" />
          <p style={{ fontSize: 15, color: "var(--fg)", margin: 0 }}>Ajustando o estoque…</p>
        </div>
      )}

      {/* ── RESUMO ── */}
      {phase === "resumo" && resultado && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Check style={{ width: 18, height: 18, color: "var(--ok)" }} />
            <p style={{ fontSize: 15, color: "var(--fg)", margin: 0 }}>
              Contagem salva — {resultado.ajustados} {resultado.ajustados === 1 ? "insumo ajustado" : "insumos ajustados"}.
            </p>
          </div>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 20px" }}>
            Diferença em relação ao que o sistema tinha:{" "}
            <strong style={{ color: resultado.totalImpacto < 0 ? "var(--warn)" : "var(--fg)" }}>
              {currency.format(resultado.totalImpacto)}
            </strong>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {resultado.itens.filter((r) => r.diff !== 0).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-card)", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", minWidth: 0 }}>{r.nome}</span>
                <span style={{ fontSize: 12, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {formatarEstoque(r.anterior, r)} → {formatarEstoque(r.contado, r)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: r.impacto < 0 ? "var(--warn)" : "var(--ok)", fontVariantNumeric: "tabular-nums", minWidth: 84, textAlign: "right" }}>
                  {r.impacto > 0 ? "+" : ""}{currency.format(r.impacto)}
                </span>
              </div>
            ))}
            {resultado.itens.every((r) => r.diff === 0) && (
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", textAlign: "center", padding: "16px 0" }}>
                Tudo bateu certinho — nenhum ajuste necessário. 🎉
              </p>
            )}
          </div>

          <button onClick={() => router.push(voltarHref)} style={cta(false)}>Voltar ao estoque</button>
        </>
      )}
    </Wrap>
  );
}

/** Mostra o estoque na unidade natural: garrafa quando há tamanho, senão unidade-base. */
function formatarEstoque(valorBase: number, r: ContagemResultado): string {
  if (r.tamanho && r.tamanho > 0) {
    return `${qtd.format(valorBase / r.tamanho)} ${r.unidadeCompra ?? "garrafa"}`;
  }
  return `${qtd.format(valorBase)} ${r.unidade}`;
}

function campo(w: number): React.CSSProperties {
  return {
    width: w, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8,
    padding: "8px 10px", fontSize: 14, color: "var(--fg)", outline: "none", colorScheme: "dark",
    textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0,
  };
}

function Wrap({ children, onVoltar }: { children: React.ReactNode; onVoltar: () => void }) {
  return (
    <div>
      <button onClick={onVoltar} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--fg-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Estoque
      </button>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Contagem de insumos</h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Conte a prateleira e o sistema acerta o estoque.</p>
      </div>
      <div style={{ maxWidth: 680 }}>{children}</div>
    </div>
  );
}

function cta(disabled: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
    background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999,
    padding: "13px 24px", fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  };
}
