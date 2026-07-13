"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, X, ChevronDown } from "lucide-react";
import { previewNfe, confirmarNfe, type NfePreview } from "@/lib/nfe/actions";
import { baseDoItem, quantidadeBaseImportada } from "@/lib/nfe/converter";
import { PassosImport } from "@/components/ui/passos-import";
import { currency } from "@/lib/format";


const inp: React.CSSProperties = {
  background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8,
  padding: "7px 9px", fontSize: 13, color: "var(--fg)", outline: "none",
  colorScheme: "dark", width: "100%", boxSizing: "border-box",
};

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
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  function reset() {
    setStep("upload"); setPreview(null); setError(null);
    setMatch([]); setCustos([]); setQtds([]); setImportados(0);
  }
  function fechar() { reset(); onClose(); }

  async function processFile(file: File) {
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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleConfirm() {
    if (!preview) return;
    setLoading(true); setError(null);
    const itens = preview.itens
      .map((it, i) => ({ it, i }))
      .filter(({ i }) => match[i] !== "ignorar")
      .map(({ it, i }) => {
        const b = baseDoItem(it);
        const qtyNota = parseFloat((qtds[i] ?? "0").replace(",", ".")) || 0;
        // Custo e quantidade em unidade-base (ver lib/nfe/converter, testado).
        const quantidadeBase = quantidadeBaseImportada(it, qtyNota);
        return {
          ingredienteId: match[i] === "novo" ? null : match[i],
          nome: it.nome,
          unidade: b.unidade,
          custoUnitario: parseFloat((custos[i] ?? "0").replace(",", ".")) || 0,
          quantidade: quantidadeBase,
          gtin: it.gtin,
          cprod: it.cprod,
          tamanhoEmbalagem: it.tamanhoEmbalagem,
          unidadeCompra: it.unidadeCompra,
        };
      });

    if (itens.length === 0) { setError("Nenhum item selecionado para importar."); setLoading(false); return; }

    try {
      const res = await confirmarNfe({
        cnpj: preview.fornecedor.cnpj,
        fornecedorNome: preview.fornecedor.nome,
        chaveNfe: preview.chaveNfe,
        itens,
      });
      if ("error" in res) { setError(res.error); return; }
      setImportados(res.itens); setStep("done");
    } catch (e) {
      // Server action que lança (rede/serialização) não pode travar a UI no "Importando…".
      setError(e instanceof Error ? e.message : "Falha inesperada ao importar. Tente de novo.");
    } finally {
      setLoading(false);
    }
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
          {error && step !== "preview" && (
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
                onDragOver={(e) => { e.preventDefault(); if (!loading) setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={handleDrop}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  padding: "36px 16px", borderRadius: 16,
                  border: `1px dashed ${dragOver ? "var(--accent)" : "var(--border-strong)"}`,
                  background: dragOver ? "color-mix(in srgb, var(--accent) 8%, var(--bg-card))" : "var(--bg-card)",
                  color: dragOver ? "var(--accent)" : "var(--fg-muted)",
                  cursor: loading ? "wait" : "pointer", fontSize: 14,
                  transition: "border-color 120ms, background 120ms, color 120ms",
                }}
              >
                <Upload size={18} /> {loading ? "Lendo…" : dragOver ? "Solte o XML aqui" : "Arraste o XML aqui ou clique"}
              </button>
              <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" onChange={handleFile} style={{ display: "none" }} />
            </div>
          )}

          {step === "preview" && preview && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 6px" }}>Fornecedor</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0, lineHeight: 1.3 }}>{preview.fornecedor.nome ?? "—"}</p>
                {preview.fornecedor.cnpj && (
                  <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>{preview.fornecedor.cnpj}</p>
                )}
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
                      <div style={{ position: "relative", minWidth: 0 }}>
                        <select
                          value={match[i]}
                          onChange={e => setMatch(m => m.map((v, j) => j === i ? e.target.value : v))}
                          style={{ ...inp, cursor: "pointer", padding: "9px 34px 9px 12px", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", textOverflow: "ellipsis" }}
                        >
                          <option value="novo">✨ Criar insumo novo</option>
                          {preview.insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                          <option value="ignorar">Ignorar este item</option>
                        </select>
                        <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                      </div>
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
                        {it.tamanhoEmbalagem && (() => {
                          const q = parseFloat((qtds[i] ?? "0").replace(",", ".")) || 0;
                          return <> Estoque: {q} {it.unidadeCompra ?? "un"} = {(q * it.tamanhoEmbalagem).toLocaleString("pt-BR")} {baseDoItem(it).unidade}.</>;
                        })()}
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
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          {/* Erro fica ao lado do botão (na etapa preview o corpo é longo e o topo some da vista) */}
          {error && step === "preview" && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "color-mix(in srgb, var(--danger) 12%, transparent)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--fg)" }}>
              <AlertTriangle size={16} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
      </div>
    </>
  );
}
