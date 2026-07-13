"use client";

import { useRef, useState } from "react";
import { Upload, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { mergeImportacao } from "@/lib/cardapio/import-actions";
import { normalizarNome } from "@/lib/cardapio/import-types";
import { PassosImport } from "@/components/ui/passos-import";
import type { ProdutoPreview, ImportarResponse } from "@/lib/cardapio/import-types";
import { currency } from "@/lib/format";


const inp: React.CSSProperties = {
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--fg)",
  outline: "none",
  colorScheme: "dark",
  width: "100%",
  boxSizing: "border-box",
};

type PanelStep = "upload" | "preview" | "done";
type MergeDecisao = "atualizar" | "ignorar";

interface ImportarCardapioPanelProps {
  barId: string;
  nomesExistentes: string[];
  open: boolean;
  onClose: () => void;
}

export function ImportarCardapioPanel({
  barId,
  nomesExistentes,
  open,
  onClose,
}: ImportarCardapioPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [panelStep, setPanelStep] = useState<PanelStep>("upload");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProdutoPreview[]>([]);
  const [colunasNaoReconhecidas, setColunasNaoReconhecidas] = useState<string[]>([]);
  const [decisoes, setDecisoes] = useState<Record<string, MergeDecisao>>({});
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ adicionados: number; atualizados: number } | null>(
    null
  );

  // Normalização para comparação fuzzy
  const normalizadosExistentes = new Set(nomesExistentes.map(normalizarNome));

  function jaExiste(nome: string) {
    return normalizadosExistentes.has(normalizarNome(nome));
  }

  function handleClose() {
    // Reset state on close
    setPanelStep("upload");
    setUploadLoading(false);
    setUploadError(null);
    setPreview([]);
    setColunasNaoReconhecidas([]);
    setDecisoes({});
    setSalvando(false);
    setResultado(null);
    onClose();
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploadLoading(true);
    setUploadError(null);

    const fd = new FormData();
    fd.append("arquivo", file);

    try {
      const res = await fetch("/api/importar-cardapio", { method: "POST", body: fd });
      const data = (await res.json()) as ImportarResponse & { error?: string };

      if (!res.ok || data.error) {
        setUploadError(data.error ?? "Erro ao processar o arquivo.");
        return;
      }

      if (data.produtos.length === 0) {
        setUploadError("Nenhum produto reconhecido. Verifique o formato do arquivo.");
        return;
      }

      // Pré-definir decisões de merge: padrão "ignorar" para existentes
      const dec: Record<string, MergeDecisao> = {};
      for (const p of data.produtos) {
        if (jaExiste(p.nome)) dec[normalizarNome(p.nome)] = "ignorar";
      }

      setPreview(data.produtos);
      setColunasNaoReconhecidas(data.colunasNaoReconhecidas);
      setDecisoes(dec);
      setPanelStep("preview");
    } catch {
      setUploadError("Erro de conexão. Tente novamente.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleConfirmar() {
    setSalvando(true);

    const result = await mergeImportacao(barId, preview, decisoes);

    if ("error" in result) {
      setUploadError(result.error);
      setSalvando(false);
      setPanelStep("upload");
      return;
    }

    setResultado(result);
    setPanelStep("done");
    setSalvando(false);
  }

  const novoCount = preview.filter((p) => !jaExiste(p.nome)).length;
  const conflitosCount = preview.filter((p) => jaExiste(p.nome)).length;
  const atualizarCount = Object.values(decisoes).filter((d) => d === "atualizar").length;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={handleClose}
          style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)" }}
        />
      )}

      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Importar cardápio (PDF ou planilha)"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(92vw, 560px)",
          zIndex: 100,
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--fg)",
              fontFamily: "var(--font-mono)",
              margin: 0,
            }}
          >
            Importar cardápio
          </h2>
          <button
            onClick={handleClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
            aria-label="Fechar"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          <style>{`
            .upload-zone-panel:hover { border-color: var(--border-strong) !important; }
            @keyframes spin2 { to { transform: rotate(360deg); } }
          `}</style>

          {/* ── Upload ── */}
          {panelStep === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 14, color: "var(--fg)", margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                Suba seu cardápio e a IA cadastra os produtos pra você.
              </p>
              <PassosImport passos={[
                <>Tenha o cardápio numa <strong style={{ color: "var(--fg)" }}>planilha (.xlsx/.csv)</strong> ou <strong style={{ color: "var(--fg)" }}>PDF</strong> — com nome, categoria e preço.</>,
                <>Suba aqui. A <strong style={{ color: "var(--fg)" }}>IA identifica as colunas</strong> sozinha.</>,
                <>Produtos novos entram; os que já existem, <strong style={{ color: "var(--fg)" }}>você escolhe atualizar ou ignorar.</strong></>,
              ]} />
              <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
                Custo por produto aqui é opcional e estimado — o custo <strong style={{ color: "var(--fg-muted)" }}>real</strong> vem da importação da nota fiscal (NF-e) no Estoque.
              </p>

              {uploadLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "40px 24px",
                    border: "1px dashed var(--border-strong)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid var(--border-strong)",
                      borderTopColor: "var(--accent-bright)",
                      borderRadius: "50%",
                      animation: "spin2 0.8s linear infinite",
                    }}
                  />
                  <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                    Interpretando com IA...
                  </p>
                </div>
              ) : (
                <button
                  className="upload-zone-panel"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "32px 20px",
                    border: "1px dashed var(--border)",
                    borderRadius: 8,
                    background: "transparent",
                    cursor: "pointer",
                    width: "100%",
                    transition: "border-color 150ms",
                  }}
                >
                  <Upload style={{ width: 20, height: 20, color: "var(--fg-subtle)" }} strokeWidth={1.5} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--fg)", margin: "0 0 3px" }}>
                      Clique para selecionar
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                      PDF, .xlsx ou .csv
                    </p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />

              {uploadError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--danger)",
                    background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Preview ── */}
          {panelStep === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Resumo */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "color-mix(in srgb, var(--ok) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--ok) 20%, transparent)",
                    color: "var(--ok)",
                    fontWeight: 500,
                  }}
                >
                  {novoCount} novo{novoCount !== 1 ? "s" : ""}
                </span>
                {conflitosCount > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "color-mix(in srgb, var(--warn) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--warn) 20%, transparent)",
                      color: "var(--warn)",
                      fontWeight: 500,
                    }}
                  >
                    {conflitosCount} já existe{conflitosCount !== 1 ? "m" : ""}
                  </span>
                )}
              </div>

              {/* Aviso de colunas não reconhecidas */}
              {colunasNaoReconhecidas.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    background: "color-mix(in srgb, var(--warn) 6%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--warn) 15%, transparent)",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <AlertTriangle
                    style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1, color: "var(--warn)" }}
                  />
                  <span>
                    Não importado: {colunasNaoReconhecidas.map((c) => `"${c}"`).join(", ")}
                  </span>
                </div>
              )}

              {/* Lista de produtos */}
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {preview.map((p, i) => {
                  const existe = jaExiste(p.nome);
                  const normalizado = normalizarNome(p.nome);
                  const decisao = decisoes[normalizado] ?? "ignorar";

                  return (
                    <div
                      key={i}
                      style={{
                        padding: "11px 14px",
                        borderBottom:
                          i < preview.length - 1 ? "1px solid var(--border)" : undefined,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background:
                          i % 2 === 1
                            ? "color-mix(in srgb, var(--fg) 1.5%, transparent)"
                            : undefined,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--fg)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.nome}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
                          {[
                            p.categoria,
                            p.preco_venda !== null ? currency.format(p.preco_venda) : null,
                            p.custo !== null ? `custo ${currency.format(p.custo)}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Sem dados adicionais"}
                        </p>
                      </div>

                      {existe ? (
                        /* Seletor atualizar/ignorar */
                        <div
                          style={{
                            display: "flex",
                            flexShrink: 0,
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            overflow: "hidden",
                          }}
                        >
                          {(["atualizar", "ignorar"] as MergeDecisao[]).map((op) => (
                            <button
                              key={op}
                              type="button"
                              onClick={() =>
                                setDecisoes((prev) => ({ ...prev, [normalizado]: op }))
                              }
                              style={{
                                padding: "5px 10px",
                                fontSize: 11,
                                fontWeight: 500,
                                border: "none",
                                cursor: "pointer",
                                background:
                                  decisao === op
                                    ? op === "atualizar"
                                      ? "color-mix(in srgb, var(--accent-bright) 15%, transparent)"
                                      : "var(--bg-hover)"
                                    : "transparent",
                                color:
                                  decisao === op
                                    ? op === "atualizar"
                                      ? "var(--accent-bright)"
                                      : "var(--fg-muted)"
                                    : "var(--fg-subtle)",
                                transition: "background 100ms, color 100ms",
                              }}
                            >
                              {op === "atualizar" ? "Atualizar" : "Ignorar"}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--ok)",
                            flexShrink: 0,
                            padding: "4px 8px",
                            background: "color-mix(in srgb, var(--ok) 10%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--ok) 20%, transparent)",
                            borderRadius: 8,
                          }}
                        >
                          Novo
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setPreview([]);
                    setDecisoes({});
                    setPanelStep("upload");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "transparent",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    color: "var(--fg-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={salvando || (novoCount === 0 && atualizarCount === 0)}
                  style={{
                    flex: 2,
                    padding: "10px",
                    background: "var(--accent)",
                    color: "var(--accent-fg)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor:
                      salvando || (novoCount === 0 && atualizarCount === 0)
                        ? "not-allowed"
                        : "pointer",
                    opacity: salvando || (novoCount === 0 && atualizarCount === 0) ? 0.6 : 1,
                  }}
                >
                  {salvando
                    ? "Salvando..."
                    : `Confirmar (${novoCount + atualizarCount} produto${novoCount + atualizarCount !== 1 ? "s" : ""})`}
                </button>
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {panelStep === "done" && resultado && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "40px 0",
                textAlign: "center",
              }}
            >
              <CheckCircle2 style={{ width: 40, height: 40, color: "var(--ok)" }} />
              <div>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--fg)",
                    margin: "0 0 6px",
                  }}
                >
                  Cardápio atualizado
                </p>
                <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                  {resultado.adicionados > 0 &&
                    `${resultado.adicionados} produto${resultado.adicionados !== 1 ? "s" : ""} adicionado${resultado.adicionados !== 1 ? "s" : ""}`}
                  {resultado.adicionados > 0 && resultado.atualizados > 0 && " · "}
                  {resultado.atualizados > 0 &&
                    `${resultado.atualizados} atualizado${resultado.atualizados !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  marginTop: 8,
                  padding: "10px 24px",
                  background: "var(--accent)",
                  color: "var(--accent-fg)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Componente de input de custo inline ─────────────────────────────────────

export function CustoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 12,
          color: "var(--fg-subtle)",
          pointerEvents: "none",
        }}
      >
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inp, width: 100, padding: "7px 10px 7px 28px", fontSize: 12 }}
      />
    </div>
  );
}
