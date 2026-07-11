"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Loader2, Check, Search } from "lucide-react";
import { salvarContagem, type ContagemResultado } from "@/lib/estoque/actions";
import type { InsumoContagem } from "@/lib/estoque/queries";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const qtd = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

type Phase = "contando" | "salvando" | "resumo";

export function ContagemClient({ insumos }: { insumos: InsumoContagem[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("contando");
  const [valores, setValores] = useState<Record<string, string>>({});
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
    const linhas = insumos
      .filter((i) => (valores[i.id] ?? "").trim() !== "")
      .map((i) => ({ ingredienteId: i.id, contado: parseFloat((valores[i.id] ?? "").replace(",", ".")) }))
      .filter((l) => Number.isFinite(l.contado) && l.contado >= 0);

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
      <Wrap onVoltar={() => router.push("/dashboard/estoque")}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: 16, color: "var(--fg)", margin: "0 0 6px" }}>Nenhum insumo cadastrado</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Suba uma nota (NF-e) ou monte fichas pra ter insumos pra contar.</p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap onVoltar={() => router.push("/dashboard/estoque")}>
      {erro && (
        <div style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "var(--fg)" }}>
          {erro}
        </div>
      )}

      {/* ── CONTANDO ── */}
      {phase === "contando" && (
        <>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 4px", lineHeight: 1.5 }}>
            Conte o que está na prateleira, insumo por insumo. O que você não contar fica como está.
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
              style={{ width: "100%", background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px 9px 34px", fontSize: 13, color: "var(--fg)", outline: "none", colorScheme: "dark", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {filtrados.map((i) => {
              const preenchido = (valores[i.id] ?? "").trim() !== "";
              return (
                <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--bg-card)", border: `1px solid ${preenchido ? "var(--accent)" : "var(--border)"}`, borderRadius: 10 }}>
                  <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", minWidth: 0 }}>{i.nome}</span>
                  <input
                    value={valores[i.id] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [i.id]: e.target.value }))}
                    inputMode="decimal"
                    placeholder="—"
                    style={{ width: 88, background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 14, color: "var(--fg)", outline: "none", colorScheme: "dark", textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span style={{ width: 28, fontSize: 12, color: "var(--fg-subtle)", flexShrink: 0 }}>{i.unidade}</span>
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
            Diferença de estoque em relação ao que o sistema tinha:{" "}
            <strong style={{ color: resultado.totalImpacto < 0 ? "var(--warn)" : "var(--fg)" }}>
              {currency.format(resultado.totalImpacto)}
            </strong>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {resultado.itens.filter((r) => r.diff !== 0).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-card)", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", minWidth: 0 }}>{r.nome}</span>
                <span style={{ fontSize: 12, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {qtd.format(r.anterior)} → {qtd.format(r.contado)} {r.unidade}
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

          <button onClick={() => router.push("/dashboard/estoque")} style={cta(false)}>Voltar ao estoque</button>
        </>
      )}
    </Wrap>
  );
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
      <div style={{ maxWidth: 640 }}>{children}</div>
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
