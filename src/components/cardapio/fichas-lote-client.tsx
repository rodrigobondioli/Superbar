"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowLeft, Check } from "lucide-react";
import { normalizarNome } from "@/lib/cardapio/import-types";
import { salvarFichasLote, type FichaLoteInput, type FichaLoteResult } from "@/lib/ficha/actions";
import type { DrinkParaFicha } from "@/lib/ficha/queries";
import type { InsumoSugerido, SugerirFichaResponse, UnidadeInsumo } from "@/lib/ficha/sugestao-types";
import { margem, margemPercentual } from "@/lib/custo";
import { currency } from "@/lib/format";


type Phase = "lista" | "gerando" | "revisar" | "salvando" | "resumo";

interface InsumoConsolidado {
  key: string;
  nome: string;
  unidade: UnidadeInsumo;
  custoUnitario: number | null;
  ingredienteId: string | null;
}

export function FichasLoteClient({ drinks }: { drinks: DrinkParaFicha[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("lista");
  const [progresso, setProgresso] = useState({ done: 0, total: 0 });
  const [fichasPorDrink, setFichasPorDrink] = useState<Record<string, InsumoSugerido[]>>({});
  const [insumos, setInsumos] = useState<InsumoConsolidado[]>([]);
  const [resultados, setResultados] = useState<FichaLoteResult[]>([]);
  const temVendas = drinks.some((d) => d.quantidadeVendida > 0);

  async function gerar() {
    setPhase("gerando");
    setProgresso({ done: 0, total: drinks.length });
    const porDrink: Record<string, InsumoSugerido[]> = {};

    for (let i = 0; i < drinks.length; i++) {
      const d = drinks[i];
      try {
        const res = await fetch("/api/sugerir-ficha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: d.nome }),
        });
        const data = (await res.json()) as SugerirFichaResponse & { error?: string };
        if (res.ok && !data.error) porDrink[d.id] = data.insumos;
      } catch {
        /* drink sem sugestão — segue */
      }
      setProgresso({ done: i + 1, total: drinks.length });
    }

    // Consolida insumos únicos (dedup por nome normalizado)
    const map = new Map<string, InsumoConsolidado>();
    for (const lista of Object.values(porDrink)) {
      for (const s of lista) {
        const nome = s.ingredienteNome ?? s.papel;
        const key = normalizarNome(nome);
        const ex = map.get(key);
        if (ex) {
          if (ex.custoUnitario == null && s.custoUnitario != null) ex.custoUnitario = s.custoUnitario;
          if (!ex.ingredienteId && s.ingredienteId) ex.ingredienteId = s.ingredienteId;
        } else {
          map.set(key, { key, nome, unidade: s.unidade, custoUnitario: s.custoUnitario, ingredienteId: s.ingredienteId });
        }
      }
    }

    setFichasPorDrink(porDrink);
    setInsumos([...map.values()]);
    setPhase("revisar");
  }

  function setCusto(key: string, valor: string) {
    const v = valor.replace(",", ".");
    setInsumos((prev) => prev.map((i) => (i.key === key ? { ...i, custoUnitario: v === "" ? null : parseFloat(v) || 0 } : i)));
  }

  async function salvar() {
    setPhase("salvando");
    const custoPorKey = new Map(insumos.map((i) => [i.key, i]));

    const fichas: FichaLoteInput[] = drinks
      .filter((d) => (fichasPorDrink[d.id] ?? []).length > 0)
      .map((d) => ({
        produtoId: d.id,
        nome: d.nome,
        preco: d.preco,
        linhas: (fichasPorDrink[d.id] ?? []).map((s) => {
          const info = custoPorKey.get(normalizarNome(s.ingredienteNome ?? s.papel));
          return {
            ingredienteId: info?.ingredienteId ?? s.ingredienteId,
            nome: info?.nome ?? s.papel,
            quantidade: s.quantidade,
            unidade: s.unidade,
            custoUnitario: info?.custoUnitario ?? null,
          };
        }),
      }));

    const res = await salvarFichasLote(fichas);
    setResultados(res);
    setPhase("resumo");
  }

  const drinksComSugestao = Object.values(fichasPorDrink).filter((l) => l.length > 0).length;
  const custosPreenchidos = insumos.filter((i) => i.custoUnitario != null).length;

  // ─── Sem drinks ───
  if (drinks.length === 0 && phase === "lista") {
    return (
      <Wrap onVoltar={() => router.push("/dashboard/cardapio")}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: 16, color: "var(--fg)", margin: "0 0 6px" }}>Todo drink já tem ficha 🎉</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Não há fichas pendentes pra gerar.</p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap onVoltar={() => router.push("/dashboard/cardapio")}>
      {/* ── LISTA ── */}
      {phase === "lista" && (
        <>
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 4px" }}>
            {drinks.length} drink{drinks.length !== 1 ? "s" : ""} sem ficha:
          </p>
          {temVendas && (
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 14px", lineHeight: 1.5 }}>
              Ordenados pelos mais vendidos — comece por eles, é onde a margem cega mais pesa.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, marginTop: temVendas ? 0 : 10 }}>
            {drinks.map((d) => (
              <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 999, padding: "6px 14px", fontSize: 13, color: "var(--fg-muted)" }}>
                {d.nome}
                {d.quantidadeVendida > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                    {d.quantidadeVendida} vend.
                  </span>
                )}
              </span>
            ))}
          </div>
          <button onClick={gerar} style={cta()}>
            <Sparkles style={{ width: 16, height: 16 }} /> Gerar fichas com IA
          </button>
        </>
      )}

      {/* ── GERANDO ── */}
      {phase === "gerando" && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <Loader2 style={{ width: 26, height: 26, color: "var(--accent)", margin: "0 auto 16px" }} className="animate-spin" />
          <p style={{ fontSize: 15, color: "var(--fg)", margin: "0 0 6px" }}>Pensando nas receitas…</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>{progresso.done} de {progresso.total} drinks</p>
        </div>
      )}

      {/* ── REVISAR (precificar insumos) ── */}
      {phase === "revisar" && (
        <>
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 4px" }}>
            {drinksComSugestao} ficha{drinksComSugestao !== 1 ? "s" : ""} montada{drinksComSugestao !== 1 ? "s" : ""}. Precifique os {insumos.length} insumos — cada um vale pra todos os drinks que o usam.
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 20px" }}>
            Custo por unidade (ex: garrafa de 750ml por R$ 34 → 0,045 por ml). Insumos que já estão no estoque vêm preenchidos.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 110px", gap: 8, marginBottom: 8 }}>
            <span style={lbl}>Insumo</span><span style={lbl}>Un.</span><span style={lbl}>Custo/un.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {insumos.map((i) => (
              <div key={i.key} style={{ display: "grid", gridTemplateColumns: "1fr 60px 110px", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--fg)", display: "flex", alignItems: "center", gap: 6 }}>
                  {i.nome}
                  {i.ingredienteId && <span title="Já no estoque" style={{ fontSize: 10, color: "var(--ok)" }}>• no estoque</span>}
                </span>
                <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>{i.unidade}</span>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--fg-subtle)", pointerEvents: "none" }}>R$</span>
                  <input
                    value={i.custoUnitario != null ? String(i.custoUnitario) : ""}
                    onChange={(e) => setCusto(i.key, e.target.value)}
                    inputMode="decimal" placeholder="—"
                    style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 8px 8px 28px", fontSize: 13, color: "var(--fg)", outline: "none", colorScheme: "dark", boxSizing: "border-box", textAlign: "right" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{custosPreenchidos}/{insumos.length} com custo</span>
            <button onClick={salvar} style={cta()}>
              Salvar {drinksComSugestao} ficha{drinksComSugestao !== 1 ? "s" : ""} →
            </button>
          </div>
        </>
      )}

      {/* ── SALVANDO ── */}
      {phase === "salvando" && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <Loader2 style={{ width: 26, height: 26, color: "var(--accent)", margin: "0 auto 16px" }} className="animate-spin" />
          <p style={{ fontSize: 15, color: "var(--fg)", margin: 0 }}>Salvando fichas e calculando margens…</p>
        </div>
      )}

      {/* ── RESUMO ── */}
      {phase === "resumo" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Check style={{ width: 18, height: 18, color: "var(--ok)" }} />
            <p style={{ fontSize: 15, color: "var(--fg)", margin: 0 }}>{resultados.length} ficha{resultados.length !== 1 ? "s" : ""} salva{resultados.length !== 1 ? "s" : ""}.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {resultados.map((r) => {
              const mrg = margem(r.preco, r.custo);
              const pct = margemPercentual(r.preco, r.custo);
              return (
                <div key={r.produtoId} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-card)", borderRadius: 8, padding: "10px 14px" }}>
                  <span style={{ flex: 1, fontSize: 14, color: "var(--fg)" }}>{r.nome}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: r.status === "confirmada" ? "var(--ok)" : "var(--warn)" }}>
                    {r.status === "confirmada" ? "real" : "estimada"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums", minWidth: 130, textAlign: "right" }}>
                    {mrg != null ? `margem ${currency.format(mrg)}${pct != null ? ` · ${pct.toFixed(0)}%` : ""}` : "sem custo"}
                  </span>
                </div>
              );
            })}
          </div>
          <button onClick={() => router.push("/dashboard/cardapio")} style={cta()}>Voltar ao cardápio</button>
        </>
      )}
    </Wrap>
  );
}

function Wrap({ children, onVoltar }: { children: React.ReactNode; onVoltar: () => void }) {
  return (
    <div>
      <button onClick={onVoltar} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--fg-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Cardápio
      </button>
      {/* Cabeçalho no padrão do dashboard */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Fichas em lote</h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>A IA sugere os insumos dos drinks sem ficha e você precifica de uma vez.</p>
      </div>
      <div style={{ maxWidth: 640 }}>
        {children}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500,
};

function cta(): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
    background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999,
    padding: "13px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  };
}
