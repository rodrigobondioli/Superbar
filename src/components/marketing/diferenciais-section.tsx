import { X, Check } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   DIFERENCIAIS — comparação afiada "o sistema comum ✕ / o Superbar ✓".
   Vende o contraste direto, sem caixa pesada. Cada linha bate num princípio
   (inteligência + feridas do mercado), nunca num feature de operação.
   Desktop: duas colunas alinhadas. Mobile: pares empilhados (mantém o contraste).
   ──────────────────────────────────────────────────────────────────────── */

const ACCENT = "#FF3500";
const BORDER = "#2C2C2E";

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
      <div className="mx-auto max-w-[1100px] page-x">
        {/* Cabeçalho — eyebrow + tese */}
        <div className="mb-10 md:mb-14 md:max-w-[820px]">
          <p
            style={{
              fontFamily: "var(--font-roboto-mono)", fontSize: 12, letterSpacing: "0.08em",
              textTransform: "uppercase", color: ACCENT, margin: "0 0 16px",
            }}
          >
            Por que o Superbar
          </p>
          <h2
            className="text-white text-balance"
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 600,
              fontSize: "clamp(2rem, 6vw, 3.25rem)", lineHeight: 1.05, letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Todo mundo te mostra o que vendeu.{" "}
            <span style={{ color: ACCENT }}>A gente te mostra o que sobrou.</span>
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
          {LINHAS.map((l) => (
            <div
              key={l.titulo}
              className="grid grid-cols-1 md:grid-cols-2"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              {/* Lado comum */}
              <div
                className="flex items-start gap-3"
                style={{ padding: "20px 0 8px", color: "rgba(255,255,255,0.45)" }}
              >
                <X style={{ width: 17, height: 17, flexShrink: 0, marginTop: 2 }} strokeWidth={2.5} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.4 }}>
                  {l.comum}
                </span>
              </div>

              {/* Lado Superbar */}
              <div
                className="flex items-start gap-3 md:pl-8"
                style={{ padding: "8px 0 22px" }}
              >
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
          ))}
          {/* fecha a última linha */}
          <div style={{ borderTop: `1px solid ${BORDER}` }} />
        </div>
      </div>
    </section>
  );
}
