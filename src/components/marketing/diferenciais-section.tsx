/* ─────────────────────────────────────────────────────────────────────────
   DIFERENCIAIS — "Por que o Superbar, e não mais um sistema"
   Cada bloco bate num princípio do negócio (inteligência + feridas do
   mercado), nunca num feature de operação (que seria commodity).
   ──────────────────────────────────────────────────────────────────────── */

const CARD = "#1C1C1E";
const BORDER = "#2C2C2E";
const ACCENT = "#FF3500";

const DIFERENCIAIS = [
  {
    titulo: "Mostra o lucro, não só a venda.",
    corpo:
      "Qualquer sistema te diz quanto vendeu. O Superbar te diz quanto sobrou — CMV, margem por drink, onde o dinheiro vazou. Inteligência que o resto do mercado nem tenta.",
  },
  {
    titulo: "Feito pra bar. Não é PDV adaptado.",
    corpo:
      "Comanda aberta por horas, drink com variação, o pico de sexta. Foi desenhado pra isso — não empurrado de um sistema de lanchonete com a cara trocada.",
  },
  {
    titulo: "Tudo incluído. Cobra só no go-live.",
    corpo:
      "Sem módulo escondido, sem taxa por relatório, sem mensalidade antes do sistema rodar. A ferida nº 1 do mercado é essa — e a gente ataca de frente.",
  },
  {
    titulo: "O lock-in é o valor, não o contrato.",
    corpo:
      "Seu histórico fica mais esperto quanto mais você usa. Quer sair? Sai, sem multa. Se a gente não entregar, não merece te segurar.",
  },
];

export function DiferenciaisSection() {
  return (
    <section className="py-10 md:py-[120px]" style={{ background: "#111113" }}>
      <div className="mx-auto max-w-[1100px] page-x">
        {/* Cabeçalho */}
        <div className="mb-10 md:mb-16 md:text-center">
          <h2
            className="mb-4 text-white text-balance"
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 600,
              fontSize: "clamp(1.75rem, 8vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.02em",
            }}
          >
            Por que o Superbar, e não mais um sistema
          </h2>
          <p
            className="text-balance md:mx-auto"
            style={{
              color: "#ffffff", fontFamily: "var(--font-sans)", fontWeight: 400,
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)", lineHeight: 1.5, maxWidth: 620,
            }}
          >
            O mercado tem sistema de comanda de sobra. O que não tem é um que mostre onde está o seu dinheiro.
          </p>
        </div>

        {/* Grid 2×2 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {DIFERENCIAIS.map((d) => (
            <div
              key={d.titulo}
              className="rounded-2xl p-5 md:p-7"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <p
                className="mb-3 md:mb-4 text-balance"
                style={{
                  color: ACCENT, fontFamily: "var(--font-sans)", fontWeight: 600,
                  fontSize: "clamp(1.125rem, 3vw, 1.375rem)", lineHeight: 1.2,
                }}
              >
                {d.titulo}
              </p>
              <p
                className="leading-relaxed text-balance"
                style={{ color: "#ffffff", fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 16 }}
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
