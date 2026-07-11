/* ─────────────────────────────────────────────────────────────────────────
   DIFERENCIAIS — a tese anti-commodity.
   Cada bloco bate num princípio (inteligência + feridas do mercado), nunca
   num feature de operação. Layout editorial: eyebrow + headline-tese +
   4 blocos com índice, contraste "o comum → o Superbar" e hover com vida.
   ──────────────────────────────────────────────────────────────────────── */

const CARD = "#1C1C1E";
const BORDER = "#2C2C2E";
const ACCENT = "#FF3500";

const DIFERENCIAIS = [
  {
    num: "01",
    comum: "O comum mostra quanto você vendeu.",
    titulo: "A gente mostra quanto sobrou.",
    corpo:
      "CMV, margem por drink, onde o dinheiro vazou na sexta. A parte que decide o lucro — e que o resto do mercado nem tenta.",
  },
  {
    num: "02",
    comum: "O comum é PDV de lanchonete adaptado.",
    titulo: "O Superbar é feito pra bar.",
    corpo:
      "Comanda aberta a noite inteira, drink com variação, o caos do pico. Desenhado pra isso — não empurrado com a cara trocada.",
  },
  {
    num: "03",
    comum: "O comum cobra módulo, taxa e mensalidade antes de rodar.",
    titulo: "Aqui é tudo incluído, e cobra só no go-live.",
    corpo:
      "Sem relatório pago à parte, sem surpresa na fatura, sem pagar por promessa. A ferida nº 1 do mercado, atacada de frente.",
  },
  {
    num: "04",
    comum: "O comum te prende com multa e contrato.",
    titulo: "A gente te segura pelo valor.",
    corpo:
      "Seu histórico fica mais esperto quanto mais você usa. Quer sair? Sai, sem multa. Se a gente não entregar, não merece te segurar.",
  },
];

export function DiferenciaisSection() {
  return (
    <section className="py-14 md:py-[120px]" style={{ background: "#0D0D0E" }}>
      <style>{`
        .dif-card {
          position: relative; overflow: hidden;
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 16px;
          padding: 28px 28px 30px;
          transition: transform .22s ease, border-color .22s ease, background .22s ease;
        }
        @media (hover: hover) {
          .dif-card:hover {
            transform: translateY(-4px);
            border-color: color-mix(in srgb, ${ACCENT} 45%, transparent);
            background: #202022;
          }
          .dif-card:hover .dif-watermark { color: color-mix(in srgb, ${ACCENT} 14%, transparent); }
        }
        .dif-watermark {
          position: absolute; right: 14px; bottom: -18px; pointer-events: none;
          font-family: var(--font-roboto-mono); font-weight: 700; font-size: 118px; line-height: 1;
          color: rgba(255,255,255,0.035); transition: color .22s ease; user-select: none;
        }
      `}</style>

      <div className="mx-auto max-w-[1100px] page-x">
        {/* Cabeçalho — eyebrow + tese */}
        <div className="mb-10 md:mb-16 md:max-w-[820px]">
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

        {/* Grid 2×2 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {DIFERENCIAIS.map((d) => (
            <div key={d.num} className="dif-card">
              <span className="dif-watermark">{d.num}</span>

              <p
                style={{
                  fontFamily: "var(--font-roboto-mono)", fontSize: 12, letterSpacing: "0.06em",
                  color: "rgba(255,255,255,0.4)", margin: "0 0 14px",
                }}
              >
                {d.comum}
              </p>

              <h3
                className="text-balance"
                style={{
                  fontFamily: "var(--font-sans)", fontWeight: 600,
                  fontSize: "clamp(1.25rem, 3vw, 1.5rem)", lineHeight: 1.15, letterSpacing: "-0.01em",
                  color: "#fff", margin: "0 0 12px",
                }}
              >
                {d.titulo}
              </h3>

              <p
                className="leading-relaxed text-pretty"
                style={{
                  color: "rgba(255,255,255,0.72)", fontFamily: "var(--font-sans)", fontWeight: 400,
                  fontSize: 15.5, position: "relative", zIndex: 1,
                }}
              >
                {d.corpo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
