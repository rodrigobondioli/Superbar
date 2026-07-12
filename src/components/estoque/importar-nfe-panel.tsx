"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { previewNfe, confirmarNfe, type NfePreview } from "@/lib/nfe/actions";
import { PassosImport } from "@/components/ui/passos-import";
import { currency } from "@/lib/format";


const inp: React.CSSProperties = {
  background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "7px 9px", fontSize: 13, color: "var(--fg)", outline: "none",
  colorScheme: "dark", width: "100%", boxSizing: "border-box",
};

// Converte custo de compra → custo por unidade base. Quando a nota traz o tamanho
// da embalagem (ex: garrafa 750ml), o insumo entra como ml/g com o custo POR ML
// (custo ÷ tamanho) — não como "un" a preço de garrafa. É o que impede o clássico
// erro de custo por garrafa que estoura o CMV (Princípio 10).
function baseDoItem(it: { custoUnitario: number; tamanhoEmbalagem: number | null; baseEmbalagem: "ml" | "g" | null; unidadeSugerida: string }): { unidade: string; custo: number; convertido: boolean } {
  if (it.tamanhoEmbalagem && it.tamanhoEmbalagem > 0 && it.baseEmbalagem) {
    return {
      unidade: it.baseEmbalagem,
      custo: Math.round((it.custoUnitario / it.tamanhoEmbalagem) * 10000) / 10000,
      convertido: true,
    };
  }
  return { unidade: it.unidadeSugerida, custo: it.custoUnitario, convertido: false };
}

type Step = "upload" | "preview" | "done";

export function ImportarNfePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<NfePreview | null>(null);
  // Por item (índice): "novo" | "ignorar" | ingredienteId
  const [match, setMatch] = useState<string[]>([]);
  const [custos, setCustos] = useState<string[]>([]);
  const [qtds, setQtds] = useState<string[]>([]);
  const [importados, setImportados] = useState(0);

  if (!open) return null;

  function reset() {
    setStep("upload"); setPreview(null); setError(null);
    setMatch([]); setCustos([]); setQtds([]); setImportados(0);
  }
  function fechar() { reset(); onClose(); }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const xml = await file.text();
      const res = await previewNfe(xml);
      if ("error" in res) { setError(res.error); setLoading(false); return; }
      const p = res.preview;
      setPreview(p);
      setMatch(p.itens.map(i => i.sugeridoIngredienteId ?? "novo"));
      setCustos(p.itens.map(i => String(baseDoItem(i).custo)));
      setQtds(p.itens.map(i => String(i.quantidade)));
      setStep("preview");
    } catch {
      setError("Não consegui ler o arquivo.");
    }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleConfirm() {
    if (!preview) return;
    setLoading(true); setError(null);
    const itens = preview.itens
      .map((it, i) => ({ it, i }))
      .filter(({ i }) => match[i] !== "ignorar")
      .map(({ it, i }) => ({
        ingredienteId: match[i] === "novo" ? null : match[i],
        nome: it.nome,
        unidade: baseDoItem(it).unidade,
        custoUnitario: parseFloat((custos[i] ?? "0").replace(",", ".")) || 0,
        quantidade: parseFloat((qtds[i] ?? "0").replace(",", ".")) || 0,
        gtin: it.gtin,
        cprod: it.cprod,
        tamanhoEmbalagem: it.tamanhoEmbalagem,
        unidadeCompra: it.unidadeCompra,
      }));

    if (itens.length === 0) { setError("Nenhum item selecionado para importar."); setLoading(false); return; }

    const res = await confirmarNfe({
      cnpj: preview.fornecedor.cnpj,
      fornecedorNome: preview.fornecedor.nome,
      chaveNfe: preview.chaveNfe,
      itens,
    });
    setLoading(false);
    if ("error" in res) { setError(res.error); return; }
    setImportados(res.itens); setStep("done");
  }

  return (
    <>
      <div onClick={fechar} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)", zIndex: 201,
        background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 2px" }}>Importar nota fiscal</p>
            <h2 style={{ fontSize: 17, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Custo do estoque pela NF-e</h2>
          </div>
          <button onClick={fechar} style={{ background: "none", border: "none", color: "var(--fg-subtle)", cursor: "pointer", padding: 4 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "color-mix(in srgb, var(--danger) 12%, transparent)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "var(--fg)" }}>
              <AlertTriangle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} /> {error}
            </div>
          )}

          {step === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 14, color: "var(--fg)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                Atualize custo e estoque pela nota da sua compra — sem digitar nada.
              </p>
              <PassosImport passos={[
                <>Baixe o arquivo <strong style={{ color: "var(--fg)" }}>XML</strong> da nota no site da distribuidora (ou pegue no e-mail da compra). Foto ou PDF não serve.</>,
                <>Suba aqui. A gente lê <strong style={{ color: "var(--fg)" }}>fornecedor, produtos e custos</strong> automaticamente.</>,
                <>Você confere e liga cada item a um insumo (ou cria novo). <strong style={{ color: "var(--fg)" }}>Nada entra sem você confirmar.</strong></>,
              ]} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "28px 16px", borderRadius: 16, border: "1px dashed var(--border-strong)", background: "var(--bg-card)", color: "var(--fg-muted)", cursor: loading ? "wait" : "pointer", fontSize: 14 }}
              >
                <Upload size={18} /> {loading ? "Lendo…" : "Escolher arquivo XML"}
              </button>
              <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" onChange={handleFile} style={{ display: "none" }} />
            </div>
          )}

          {step === "preview" && preview && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                Fornecedor: <strong style={{ color: "var(--fg)" }}>{preview.fornecedor.nome ?? "—"}</strong>
                {preview.fornecedor.cnpj && <span style={{ color: "var(--fg-subtle)" }}> · {preview.fornecedor.cnpj}</span>}
              </div>
              {preview.jaImportada && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", background: "color-mix(in srgb, var(--warn) 12%, transparent)", border: "1px solid var(--warn)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--fg)" }}>
                  <AlertTriangle size={16} style={{ color: "var(--warn)", flexShrink: 0 }} /> Esta nota já foi importada antes. Confirmar de novo será bloqueado.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {preview.itens.map((it, i) => (
                  <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, opacity: match[i] === "ignorar" ? 0.5 : 1 }}>
                    <p style={{ fontSize: 14, color: "var(--fg)", margin: "0 0 8px", fontWeight: 500 }}>{it.nome}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px", gap: 8, alignItems: "center" }}>
                      <select value={match[i]} onChange={e => setMatch(m => m.map((v, j) => j === i ? e.target.value : v))} style={{ ...inp, cursor: "pointer" }}>
                        <option value="novo">➕ Criar insumo novo</option>
                        {preview.insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                        <option value="ignorar">Ignorar este item</option>
                      </select>
                      <input value={qtds[i]} onChange={e => setQtds(q => q.map((v, j) => j === i ? e.target.value : v))} style={inp} title="Quantidade" />
                      <input value={custos[i]} onChange={e => setCustos(c => c.map((v, j) => j === i ? e.target.value : v))} style={inp} title="Custo unitário (R$)" />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "6px 0 0" }}>
                      Nota: {it.quantidade} {it.unidadeNota || "un"} · {currency.format(it.custoUnitario)} un
                      {it.custoAtual !== null && <> · custo atual {currency.format(it.custoAtual)}</>}
                      {it.tamanhoEmbalagem && it.baseEmbalagem && (
                        <> · {it.unidadeCompra ?? "garrafa"} {it.tamanhoEmbalagem}{it.baseEmbalagem}</>
                      )}
                    </p>
                    {baseDoItem(it).convertido && (
                      <p style={{ fontSize: 11, color: "var(--ok)", margin: "4px 0 0" }}>
                        → entra como {currency.format(baseDoItem(it).custo)}/{baseDoItem(it).unidade} — já convertido pra você usar por {baseDoItem(it).unidade} na ficha do drink.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "done" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", textAlign: "center" }}>
              <CheckCircle2 size={40} style={{ color: "var(--ok)" }} />
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--fg)", margin: 0 }}>{importados} {importados === 1 ? "insumo atualizado" : "insumos atualizados"}</p>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Custo e estoque entraram pela nota. Da próxima vez, os itens desse fornecedor já vêm casados.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          {step === "preview" && (
            <>
              <button onClick={() => setStep("upload")} style={{ background: "none", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "9px 18px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer" }}>Voltar</button>
              <button onClick={handleConfirm} disabled={loading || preview?.jaImportada} style={{ background: "var(--accent)", border: "none", borderRadius: 999, padding: "9px 20px", fontSize: 13, fontWeight: 500, color: "var(--accent-fg)", cursor: loading || preview?.jaImportada ? "not-allowed" : "pointer", opacity: loading || preview?.jaImportada ? 0.6 : 1 }}>
                {loading ? "Importando…" : "Importar para o estoque"}
              </button>
            </>
          )}
          {step === "done" && (
            <button onClick={fechar} style={{ background: "var(--accent)", border: "none", borderRadius: 999, padding: "9px 20px", fontSize: 13, fontWeight: 500, color: "var(--accent-fg)", cursor: "pointer" }}>Concluir</button>
          )}
        </div>
      </div>
    </>
  );
}
