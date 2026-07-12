"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { criarBarOnboarding } from "@/lib/onboarding/actions";
import { salvarProdutosImportados } from "@/lib/cardapio/import-actions";
import { ClassicosPicker } from "@/components/cardapio/classicos-picker";
import type { ProdutoPreview, ImportarResponse } from "@/lib/cardapio/import-types";

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--fg-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "6px",
};

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "12px 14px",
  color: "var(--fg)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  colorScheme: "dark",
};

const btnPrimary: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-fg)",
  border: "none",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 150ms",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "var(--fg-muted)",
  border: "none",
  padding: "12px 16px",
  fontSize: "14px",
  cursor: "pointer",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = "criar-bar" | "importar" | "classicos" | "preview" | "custo";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global
  const [step, setStep] = useState<Step>("criar-bar");

  // Step 1 — criar bar
  const [nomeBar, setNomeBar] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  const [criarLoading, setCriarLoading] = useState(false);
  const [criarError, setCriarError] = useState<string | null>(null);
  const [barId, setBarId] = useState<string | null>(null);

  // Step 2/3 — importar + preview
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProdutoPreview[]>([]);
  const [colunasNaoReconhecidas, setColunasNaoReconhecidas] = useState<string[]>([]);
  const [salvandoImportacao, setSalvandoImportacao] = useState(false);

  // ── Step 1: criar bar ──────────────────────────────────────────────────────

  async function handleCriarBar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCriarLoading(true);
    setCriarError(null);
    const fd = new FormData(e.currentTarget);
    const result = await criarBarOnboarding(fd);
    if ("error" in result) {
      setCriarError(result.error);
      setCriarLoading(false);
    } else {
      setBarId(result.barId);
      setStep("importar");
    }
  }

  // ── Step 2: upload de arquivo ──────────────────────────────────────────────

  async function handleFileChange(file: File | null) {
    if (!file || !barId) return;
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
        setUploadError("Nenhum produto reconhecido no arquivo. Verifique o formato.");
        return;
      }

      setPreview(data.produtos);
      setColunasNaoReconhecidas(data.colunasNaoReconhecidas);
      setStep("preview");
    } catch {
      setUploadError("Erro de conexão. Tente novamente.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Step 3: confirmar importação ───────────────────────────────────────────

  async function handleConfirmarImportacao() {
    if (!barId) return;
    setSalvandoImportacao(true);

    const result = await salvarProdutosImportados(barId, preview);

    if ("error" in result) {
      setUploadError(result.error);
      setSalvandoImportacao(false);
      setStep("importar");
      return;
    }

    // Custo do cardápio NÃO é digitado item a item aqui (não escala). O caminho
    // é a NF-e, que traz o custo real dos insumos. Fichas dos drinks vêm depois.
    setStep("custo");
    setSalvandoImportacao(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <style>{`
        input::placeholder { color: var(--fg-subtle); }
        .upload-zone:hover { border-color: var(--border-strong) !important; background: color-mix(in srgb, var(--fg) 2%, transparent) !important; }
      `}</style>

      {/* Logo */}
      <div style={{ position: "absolute", top: 32, left: 32 }}>
        <Image src="/superbar-logo.svg" width={92} height={31} alt="Superbar" priority />
      </div>

      {/* Conteúdo central */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "80px 16px 64px",
        }}
      >
        {/* ── STEP 1: Criar bar ─────────────────────────────────────────────── */}
        {step === "criar-bar" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "-0.01em",
                  margin: "0 0 8px",
                }}
              >
                Vamos configurar seu bar
              </h1>
              <p style={{ fontSize: "14px", color: "var(--fg-subtle)", margin: 0 }}>
                Leva menos de 1 minuto. Você completa o resto nas configurações.
              </p>
            </div>

            <form
              onSubmit={handleCriarBar}
              className="p-5 sm:p-8"
              style={{
                width: "100%",
                maxWidth: "440px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div>
                <label htmlFor="nome" style={lbl}>
                  Nome do bar
                </label>
                <input
                  id="nome"
                  name="nome"
                  placeholder="Ex: Aurora Bar"
                  value={nomeBar}
                  onChange={(e) => setNomeBar(e.target.value)}
                  required
                  autoFocus
                  style={inp}
                />
              </div>

              <div>
                <label htmlFor="nome_usuario" style={lbl}>
                  Seu nome
                </label>
                <input
                  id="nome_usuario"
                  name="nome_usuario"
                  placeholder="Como você quer ser chamado"
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  style={inp}
                />
              </div>

              {criarError && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--danger)",
                    background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    margin: 0,
                  }}
                >
                  {criarError}
                </p>
              )}

              <button
                type="submit"
                disabled={criarLoading || !nomeBar.trim()}
                style={{
                  ...btnPrimary,
                  opacity: criarLoading || !nomeBar.trim() ? 0.6 : 1,
                  cursor: criarLoading || !nomeBar.trim() ? "not-allowed" : "pointer",
                }}
              >
                {criarLoading ? "Criando..." : "Criar meu bar →"}
              </button>
            </form>

            <p
              style={{
                marginTop: "24px",
                fontSize: "12px",
                color: "var(--fg-subtle)",
                textAlign: "center",
              }}
            >
              Logo, endereço e equipe você adiciona depois nas Configurações.
            </p>
          </>
        )}

        {/* ── STEP 2: Importar cardápio ─────────────────────────────────────── */}
        {step === "importar" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "-0.01em",
                  margin: "0 0 8px",
                }}
              >
                Importe seu cardápio
              </h1>
              <p style={{ fontSize: "14px", color: "var(--fg-subtle)", margin: 0 }}>
                Tem o cardápio em PDF ou planilha? A IA lê e monta tudo.
              </p>
            </div>

            <div
              className="p-5 sm:p-8"
              style={{
                width: "100%",
                maxWidth: "480px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Upload zone */}
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
                      width: 20,
                      height: 20,
                      border: "2px solid var(--border-strong)",
                      borderTopColor: "var(--accent-bright)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ fontSize: "14px", color: "var(--fg-muted)", margin: 0 }}>
                    Interpretando seu cardápio com IA...
                  </p>
                </div>
              ) : (
                <button
                  className="upload-zone"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "40px 24px",
                    border: "1px dashed var(--border)",
                    borderRadius: 8,
                    background: "transparent",
                    cursor: "pointer",
                    width: "100%",
                    transition: "border-color 150ms, background 150ms",
                  }}
                >
                  <Upload
                    style={{ width: 24, height: 24, color: "var(--fg-subtle)" }}
                    strokeWidth={1.5}
                  />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "14px", color: "var(--fg)", margin: "0 0 4px" }}>
                      Arraste o arquivo ou clique para selecionar
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--fg-subtle)", margin: 0 }}>
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
                    fontSize: "13px",
                    color: "var(--danger)",
                    background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div
                style={{
                  height: "1px",
                  background: "var(--border)",
                }}
              />

              <button
                type="button"
                onClick={() => setStep("classicos")}
                style={{
                  ...btnGhost,
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--fg)",
                }}
              >
                Não tenho arquivo — escolher dos clássicos →
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{
                  ...btnGhost,
                  textAlign: "center",
                  fontSize: "12px",
                }}
              >
                Pular — cadastrar manual
              </button>
            </div>
          </>
        )}

        {/* ── STEP B: Clássicos ─────────────────────────────────────────────── */}
        {step === "classicos" && (
          <ClassicosPicker
            onDone={() => setStep("custo")}
            onSkip={() => setStep("importar")}
          />
        )}

        {/* ── STEP 3: Preview ───────────────────────────────────────────────── */}
        {step === "preview" && (
          <div style={{ width: "100%", maxWidth: "720px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "-0.01em",
                  margin: "0 0 8px",
                }}
              >
                {preview.length} produto{preview.length !== 1 ? "s" : ""} reconhecido
                {preview.length !== 1 ? "s" : ""}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--fg-subtle)", margin: 0 }}>
                Revise antes de confirmar. Você pode editar tudo depois no cardápio.
              </p>
            </div>

            {/* Aviso de colunas não reconhecidas */}
            {colunasNaoReconhecidas.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 16,
                  padding: "10px 14px",
                  background: "color-mix(in srgb, var(--warn) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--warn) 20%, transparent)",
                  borderRadius: 8,
                  fontSize: "13px",
                  color: "var(--fg-muted)",
                }}
              >
                <AlertTriangle
                  style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1, color: "var(--warn)" }}
                />
                <span>
                  Coluna{colunasNaoReconhecidas.length !== 1 ? "s" : ""} não importada
                  {colunasNaoReconhecidas.length !== 1 ? "s" : ""}:{" "}
                  {colunasNaoReconhecidas.map((c) => `"${c}"`).join(", ")}. Esses dados não foram
                  reconhecidos.
                </span>
              </div>
            )}

            {/* Tabela de preview */}
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* Header da tabela */}
              <div
                className="grid grid-cols-[1fr_80px_65px_24px] sm:grid-cols-[1fr_120px_90px_90px_32px]"
                style={{
                  gap: 0,
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {(["Nome", "Categoria", "Preço"] as const).map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--fg-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {h}
                  </span>
                ))}
                <span
                  className="hidden sm:block"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--fg-subtle)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Custo
                </span>
                <span />
              </div>

              {/* Linhas */}
              <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                {preview.map((p, i) => {
                  const semPreco = p.preco_venda === null;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_80px_65px_24px] sm:grid-cols-[1fr_120px_90px_90px_32px]"
                      style={{
                        gap: 0,
                        padding: "10px 16px",
                        borderBottom:
                          i < preview.length - 1 ? "1px solid var(--border)" : undefined,
                        alignItems: "center",
                        background:
                          i % 2 === 1
                            ? "color-mix(in srgb, var(--fg) 1.5%, transparent)"
                            : undefined,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--fg)",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          paddingRight: 8,
                        }}
                      >
                        {p.nome}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--fg-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          paddingRight: 8,
                        }}
                      >
                        {p.categoria ?? "—"}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: semPreco ? "var(--fg-subtle)" : "var(--fg)",
                          fontFamily: "var(--font-mono)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {p.preco_venda !== null ? currency.format(p.preco_venda) : "—"}
                      </span>
                      <span
                        className="hidden sm:block"
                        style={{
                          fontSize: 12,
                          color: "var(--fg-subtle)",
                          fontFamily: "var(--font-mono)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {p.custo !== null ? currency.format(p.custo) : "—"}
                      </span>
                      <span
                        title={semPreco ? "Sem preço cadastrado" : "OK"}
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        {semPreco ? (
                          <AlertTriangle
                            style={{ width: 13, height: 13, color: "var(--warn)" }}
                          />
                        ) : (
                          <CheckCircle2
                            style={{ width: 13, height: 13, color: "var(--ok)" }}
                          />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aviso de produtos sem preço */}
            {preview.some((p) => p.preco_venda === null) && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--fg-subtle)",
                  margin: "0 0 20px",
                }}
              >
                Produtos sem preço serão importados com valor R$ 0,00. Ajuste no cardápio depois.
              </p>
            )}

            {/* Ações */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setPreview([]);
                  setColunasNaoReconhecidas([]);
                  setStep("importar");
                }}
                style={{
                  ...btnGhost,
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <X style={{ width: 13, height: 13 }} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarImportacao}
                disabled={salvandoImportacao}
                style={{
                  ...btnPrimary,
                  opacity: salvandoImportacao ? 0.6 : 1,
                  cursor: salvandoImportacao ? "not-allowed" : "pointer",
                }}
              >
                {salvandoImportacao
                  ? "Salvando..."
                  : `Confirmar importação (${preview.length} produto${preview.length !== 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Custo (NF-e ou pular) ───────────────────────────────────── */}
        {step === "custo" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "-0.01em",
                  margin: "0 0 8px",
                }}
              >
                Agora, o custo dos seus insumos
              </h1>
              <p style={{ fontSize: "14px", color: "var(--fg-subtle)", margin: 0, maxWidth: 440 }}>
                Suba a nota fiscal (NF-e) da sua última compra — a gente puxa os insumos com o
                custo real, já convertido pra ml. Sem digitar. É o que faz sua margem ser
                verdade, não chute.
              </p>
            </div>

            <div
              className="p-5 sm:p-8"
              style={{
                width: "100%",
                maxWidth: "440px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/dashboard/estoque")}
                style={{ ...btnPrimary, textAlign: "center" }}
              >
                Importar nota fiscal (NF-e) →
              </button>

              <p style={{ fontSize: "12px", color: "var(--fg-subtle)", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
                As receitas dos drinks (fichas) você monta depois, aos poucos — comece pelos que
                mais vendem.
              </p>

              <div style={{ height: "1px", background: "var(--border)" }} />

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{ ...btnGhost, textAlign: "center", fontSize: "13px" }}
              >
                Pular por enquanto →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
