"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { carregarFicha, salvarFicha, type LinhaFichaInput } from "@/lib/ficha/actions";
import type { UnidadeInsumo, SugerirFichaResponse } from "@/lib/ficha/sugestao-types";
import { custoDaFicha, margem, margemPercentual } from "@/lib/custo";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const UNIDADES: UnidadeInsumo[] = ["un", "ml", "l", "g", "kg"];

type Linha = LinhaFichaInput;

const input: React.CSSProperties = {
  background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 4,
  padding: "8px 10px", fontSize: 13, color: "var(--fg)", outline: "none",
  colorScheme: "dark", width: "100%", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase",
  letterSpacing: "0.1em", marginBottom: 4, display: "block", fontWeight: 500,
};

export function FichaEditor({
  open, onClose, produtoId, produtoNome, preco, varianteId = null, varianteNome, base, sabor, descricao,
}: {
  open: boolean;
  onClose: () => void;
  produtoId: string;
  produtoNome: string;
  preco: number;
  varianteId?: string | null;
  varianteNome?: string;
  base?: string;
  sabor?: string;
  descricao?: string;
}) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    carregarFicha(produtoId, varianteId).then((f) => {
      if (!active) return;
      // Ficha existente carrega como está; ficha vazia já abre 1 linha pronta pra digitar.
      setLinhas(
        f.linhas.length > 0
          ? f.linhas.map((l) => ({ ...l }))
          : [{ ingredienteId: null, nome: "", quantidade: 1, unidade: "ml", custoUnitario: null }],
      );
      setLoading(false);
    });
    return () => { active = false; };
  }, [open, produtoId, varianteId]);

  function set(i: number, patch: Partial<Linha>) {
    setLinhas((prev) => prev.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  }
  function addLinha() {
    setLinhas((prev) => [...prev, { ingredienteId: null, nome: "", quantidade: 1, unidade: "ml", custoUnitario: null }]);
  }
  function removeLinha(i: number) {
    setLinhas((prev) => prev.filter((_, k) => k !== i));
  }

  async function sugerir() {
    setSuggesting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/sugerir-ficha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: varianteNome ? `${produtoNome} ${varianteNome}` : produtoNome, base, sabor, descricao }),
      });
      const data = (await res.json()) as SugerirFichaResponse & { error?: string };
      if (!res.ok || data.error) {
        setMsg({ ok: false, texto: data.error ?? "Não consegui sugerir agora." });
        return;
      }
      if (data.insumos.length === 0) {
        setMsg({ ok: false, texto: "A IA não achou uma receita padrão. Cadastre manual." });
        return;
      }
      // descarta linhas vazias (ex: a linha em branco do empty state) antes do merge
      const preenchidas = linhas.filter((l) => l.nome.trim());
      const jaTem = new Set(preenchidas.map((l) => l.nome.toLowerCase().trim()));
      const novas: Linha[] = data.insumos
        .filter((s) => !jaTem.has(s.papel.toLowerCase().trim()))
        .map((s) => ({
          ingredienteId: s.ingredienteId,
          nome: s.ingredienteNome ?? s.papel,
          quantidade: s.quantidade,
          unidade: s.unidade,
          custoUnitario: s.custoUnitario,
        }));
      setLinhas([...preenchidas, ...novas]);
      setMsg({
        ok: true,
        texto: novas.length > 0
          ? `${novas.length} insumo${novas.length !== 1 ? "s" : ""} sugerido${novas.length !== 1 ? "s" : ""} — confira e ajuste o custo.`
          : "A ficha já tem esses insumos.",
      });
    } catch {
      setMsg({ ok: false, texto: "Erro de conexão." });
    } finally {
      setSuggesting(false);
    }
  }

  async function salvar() {
    setSaving(true);
    const res = await salvarFicha(produtoId, varianteId, linhas);
    setSaving(false);
    if ("error" in res) {
      toast(res.error, "error");
      return;
    }
    toast(
      res.status === "confirmada"
        ? "Ficha salva — margem calculada."
        : res.status === "sugerida"
          ? "Ficha salva. Faltam custos pra margem real."
          : "Ficha salva.",
      "ok",
    );
    router.refresh();
    onClose();
  }

  // Cálculo ao vivo
  const custoCompleto = linhas.length > 0 && linhas.every((l) => l.nome.trim() && l.custoUnitario != null);
  const custo = custoCompleto
    ? custoDaFicha(linhas.map((l) => ({ quantidade: l.quantidade, custoUnitario: l.custoUnitario as number })))
    : null;
  const mrg = margem(preco, custo);
  const mrgPct = margemPercentual(preco, custo);

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)" }} />}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ficha técnica"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(94vw, 620px)", zIndex: 100,
          background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Ficha técnica</p>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
              {produtoNome}{varianteNome ? ` · ${varianteNome}` : ""}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-subtle)", padding: 6 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "var(--fg-subtle)", fontSize: 13, gap: 8 }}>
              <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Carregando ficha…
            </div>
          ) : (
            <>
              {/* Botão IA — preenchimento neutro, só o ícone em laranja (sinaliza IA) */}
              <button
                onClick={sugerir}
                disabled={suggesting}
                className="hover:brightness-110"
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center",
                  background: "var(--bg-card-hi)", border: "none",
                  color: "var(--fg)", borderRadius: 8, padding: "12px 16px", fontSize: 13, fontWeight: 600,
                  cursor: suggesting ? "wait" : "pointer", marginBottom: 12,
                }}
              >
                {suggesting
                  ? <><Loader2 style={{ width: 15, height: 15, color: "var(--accent)" }} className="animate-spin" /> Pensando na receita…</>
                  : <><Sparkles style={{ width: 15, height: 15, color: "var(--accent)" }} /> Sugerir insumos com IA</>}
              </button>

              {/* Aviso inline (não usa toast pra não cobrir o botão Salvar) */}
              {msg && (
                <p style={{
                  fontSize: 12, margin: "0 0 16px",
                  color: msg.ok ? "var(--ok)" : "var(--danger)",
                }}>
                  {msg.texto}
                </p>
              )}

              {/* Cabeçalho da grade */}
              {linhas.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 60px 90px 28px", gap: 8, marginBottom: 6 }}>
                  <span style={lbl}>Insumo</span>
                  <span style={lbl}>Qtd</span>
                  <span style={lbl}>Un.</span>
                  <span style={lbl}>Custo/un.</span>
                  <span />
                </div>
              )}

              {/* Linhas */}
              {linhas.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 64px 60px 90px 28px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input value={l.nome} onChange={(e) => set(i, { nome: e.target.value, ingredienteId: null })} placeholder="Ex: cachaça" style={input} />
                  <input value={String(l.quantidade)} onChange={(e) => set(i, { quantidade: parseFloat(e.target.value.replace(",", ".")) || 0 })} inputMode="decimal" style={{ ...input, textAlign: "right" }} />
                  <select value={l.unidade} onChange={(e) => set(i, { unidade: e.target.value as UnidadeInsumo })} style={{ ...input, padding: "8px 4px" }}>
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--fg-subtle)", pointerEvents: "none" }}>R$</span>
                    <input
                      value={l.custoUnitario != null ? String(l.custoUnitario) : ""}
                      onChange={(e) => { const v = e.target.value.replace(",", "."); set(i, { custoUnitario: v === "" ? null : parseFloat(v) || 0 }); }}
                      inputMode="decimal" placeholder="—"
                      style={{ ...input, padding: "8px 8px 8px 26px", textAlign: "right" }}
                    />
                  </div>
                  <button onClick={() => removeLinha(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 4, display: "flex", justifyContent: "center" }} title="Remover">
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}

              <button onClick={addLinha} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 13, padding: "8px 0", marginTop: 2 }}>
                <Plus style={{ width: 13, height: 13 }} /> Adicionar insumo
              </button>

              {linhas.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 4 }}>
                  Nenhum insumo ainda. Use a IA pra sugerir a receita ou adicione manual. O custo de cada insumo é o que você paga por unidade (ex: garrafa de 750ml → custo por ml).
                </p>
              )}
            </>
          )}
        </div>

        {/* Rodapé: custo/margem + salvar */}
        <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
            <Metric label="Preço" value={currency.format(preco)} />
            <Metric label="Custo" value={custo != null ? currency.format(custo) : "—"} muted={custo == null} />
            <Metric
              label="Margem"
              value={mrg != null ? `${currency.format(mrg)}${mrgPct != null ? ` · ${mrgPct.toFixed(0)}%` : ""}` : "—"}
              muted={mrg == null}
              accent={mrg != null && mrg > 0}
            />
          </div>
          {!custoCompleto && linhas.length > 0 && (
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "0 0 12px" }}>
              Preencha o custo de todos os insumos pra margem virar real. Sem isso, ela fica marcada como estimativa.
            </p>
          )}
          <button
            onClick={salvar}
            disabled={saving || loading}
            style={{
              width: "100%", background: "var(--accent)", color: "var(--accent-fg)", border: "none",
              borderRadius: 999, padding: "13px", fontSize: 14, fontWeight: 600,
              cursor: saving ? "wait" : "pointer", opacity: saving || loading ? 0.6 : 1,
            }}
          >
            {saving ? "Salvando…" : "Salvar ficha"}
          </button>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0, fontVariantNumeric: "tabular-nums", color: muted ? "var(--fg-subtle)" : accent ? "var(--ok)" : "var(--fg)" }}>{value}</p>
    </div>
  );
}
