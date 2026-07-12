import { X, Check } from "lucide-react";
import { Lines, Reveal, SectionRule } from "@/components/marketing/motion-primitives";

/* ─────────────────────────────────────────────────────────────────────────
   DIFERENCIAIS — comparação afiada "o sistema comum ✕ / o Superbar ✓".
   Vende o contraste direto, sem caixa pesada. Cada linha bate num princípio
   (inteligência + feridas do mercado), nunca num feature de operação.
   Desktop: duas colunas alinhadas. Mobile: pares empilhados (mantém o contraste).
   ──────────────────────────────────────────────────────────────────────── */

const ACCENT = "#FF3500";

const LINHAS = [
  {
    comum: "Mostra quanto você vendeu.",
    titulo: "Mostra quanto você lucrou.",
    corpo: "CMV, margem por drink, onde o dinheiro vazou na sexta.",
  },
  {
    comum: "PDV de lanchonete adaptado.",
    titulo: "Feito pra bar, de verdade.",
    corpo: "Comanda longa, drink com variação, o caos do pico.",
  },
  {
    comum: "Cobra módulo e taxa antes de rodar.",
    titulo: "Tudo incluído. Cobra só no go-live.",
    corpo: "Sem surpresa na fatura, sem pagar por promessa.",
  },
  {
    comum: "Te prende com multa e contrato.",
    titulo: "Te segura pelo valor.",
    corpo: "Seu histórico fica mais esperto. Quer sair? Sai, sem multa.",
  },
];

export function DiferenciaisSection() {
  return (
    <section className="py-14 md:py-[120px]" style={{ background: "#0D0D0E" }}>
      <SectionRule num="04" label="Por que o Superbar" />

      <div className="page-x pt-10 md:pt-14">
      <div className="mx-auto max-w-[1440px]">
        {/* Cabeçalho — tese cartaz */}
        <div className="mb-10 md:mb-14">
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)", fontWeight: 400,
              fontSize: "clamp(2.25rem, 6vw, 5.5rem)", lineHeight: 0.82,
              letterSpacing: "0.01em", textTransform: "uppercase",
              margin: 0,
            }}
          >
            <Lines
              lines={[
                <span key="l1">Todo mundo te mostra</span>,
                <span key="l2">o que vendeu.</span>,
                <span
                  key="l3"
                  style={{
                    display: "block",
                    textAlign: "right",
                    color: "transparent",
                    WebkitTextStroke: `2px ${ACCENT}`,
                  }}
                >
                  A gente, o que sobrou.
                </span>,
              ]}
            />
          </h2>
        </div>

        {/* Cabeçalho das colunas — só desktop */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <span style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 13, letterSpacing: "0.03em", color: "rgba(255,255,255,0.4)", paddingBottom: 16 }}>
            O sistema comum
          </span>
          <span style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 13, letterSpacing: "0.03em", color: ACCENT, paddingBottom: 16, paddingLeft: 32 }}>
            O Superbar
          </span>
        </div>

        {/* Linhas */}
        <div>
          {LINHAS.map((l, li) => (
            <Reveal key={l.titulo} delay={li * 0.1} y={24}>
            <div
              className="grid grid-cols-1 md:grid-cols-2 md:items-center"
              style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }}
            >
              {/* Lado comum */}
              <div
                className="flex items-start gap-3 pt-7 pb-3 md:py-9"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <X style={{ width: 17, height: 17, flexShrink: 0, marginTop: 2 }} strokeWidth={2.5} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.4 }}>
                  {l.comum}
                </span>
              </div>

              {/* Lado Superbar */}
              <div className="flex items-start gap-3 pt-3 pb-8 md:py-9 md:pl-8">
                <Check style={{ width: 18, height: 18, flexShrink: 0, marginTop: 3, color: ACCENT }} strokeWidth={2.75} />
                <div style={{ minWidth: 0 }}>
                  <p
                    className="text-balance"
                    style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.2, color: "#fff", margin: "0 0 6px" }}
                  >
                    {l.titulo}
                  </p>
                  <p
                    className="text-pretty"
                    style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}
                  >
                    {l.corpo}
                  </p>
                </div>
              </div>
            </div>
            </Reveal>
          ))}
          {/* fecha a última linha */}
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }} />
        </div>
      </div>
      </div>
    </section>
  );
}
