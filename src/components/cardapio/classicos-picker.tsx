"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CLASSICOS, CATEGORIAS_CLASSICOS } from "@/lib/cardapio/classicos";
import { criarProdutosClassicos } from "@/lib/cardapio/actions";

interface Marca { on: boolean; preco: string }

export function ClassicosPicker({
  onDone,
  onSkip,
}: {
  onDone: (criados: number) => void;
  onSkip?: () => void;
}) {
  const [marcas, setMarcas] = useState<Record<string, Marca>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const marcados = Object.entries(marcas).filter(([, m]) => m.on);
  const total = marcados.length;

  function toggle(nome: string) {
    setMarcas((prev) => {
      const atual = prev[nome];
      return { ...prev, [nome]: { on: !atual?.on, preco: atual?.preco ?? "" } };
    });
  }
  function setPreco(nome: string, preco: string) {
    setMarcas((prev) => ({ ...prev, [nome]: { on: true, preco } }));
  }

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    const items = marcados.map(([nome, m]) => {
      const item = CLASSICOS.find((c) => c.nome === nome)!;
      const p = parseFloat((m.preco || "").replace(",", "."));
      return { nome, categoria: item.categoria, preco: isNaN(p) ? null : p };
    });
    const res = await criarProdutosClassicos(items);
    if ("error" in res) {
      setErro(res.error);
      setSalvando(false);
      return;
    }
    onDone(res.criados);
  }

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.01em", margin: "0 0 8px" }}>
          Marque os clássicos que você serve
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>
          A gente já cadastra pra você. Depois a IA sugere a ficha de cada um.
        </p>
      </div>

      <div style={{ maxHeight: "48vh", overflowY: "auto", marginBottom: 16, paddingRight: 4 }}>
        {CATEGORIAS_CLASSICOS.map((cat) => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px", fontWeight: 500 }}>{cat}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {CLASSICOS.filter((c) => c.categoria === cat).map((c) => {
                const m = marcas[c.nome];
                const on = !!m?.on;
                return (
                  <div
                    key={c.nome}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: on ? "var(--bg-card-hi)" : "var(--bg-card)",
                      border: `1px solid ${on ? "var(--border-strong)" : "transparent"}`,
                      borderRadius: 8, padding: "9px 12px", transition: "background 120ms",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(c.nome)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, flex: 1,
                        background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: `1.5px solid ${on ? "var(--fg-muted)" : "var(--border-strong)"}`,
                        background: on ? "var(--fg-muted)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {on && <Check style={{ width: 13, height: 13, color: "var(--bg)" }} strokeWidth={3} />}
                      </span>
                      <span style={{ fontSize: 14, color: on ? "var(--fg)" : "var(--fg-muted)" }}>{c.nome}</span>
                    </button>
                    {on && (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--fg-subtle)", pointerEvents: "none" }}>R$</span>
                        <input
                          value={m?.preco ?? ""}
                          onChange={(e) => setPreco(c.nome, e.target.value)}
                          inputMode="decimal"
                          placeholder="preço"
                          style={{
                            width: 96, background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: 4,
                            padding: "7px 8px 7px 28px", fontSize: 13, color: "var(--fg)", outline: "none",
                            colorScheme: "dark", boxSizing: "border-box",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {erro && <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 12px" }}>{erro}</p>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        {onSkip && (
          <button type="button" onClick={onSkip} style={{ background: "none", border: "none", color: "var(--fg-muted)", fontSize: 13, cursor: "pointer", padding: "12px 8px" }}>
            Pular
          </button>
        )}
        <button
          type="button"
          onClick={confirmar}
          disabled={total === 0 || salvando}
          style={{
            background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999,
            padding: "12px 24px", fontSize: 14, fontWeight: 600,
            cursor: total === 0 || salvando ? "not-allowed" : "pointer",
            opacity: total === 0 || salvando ? 0.5 : 1,
          }}
        >
          {salvando ? "Criando…" : total === 0 ? "Selecione os clássicos" : `Adicionar ${total} clássico${total !== 1 ? "s" : ""} →`}
        </button>
      </div>
    </div>
  );
}
