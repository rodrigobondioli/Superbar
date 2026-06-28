"use client";
import { useEffect, useRef } from "react";

const STEPS = [
  {
    num: "/1",
    title: "Comece hoje",
    body: "Em um dia, você cadastra o cardápio completo, configura a equipe e organiza as mesas. Nada de técnico agendado, nada de semanas esperando implantação. O onboarding guia cada etapa — e quando termina, o bar já está operando.",
  },
  {
    num: "/2",
    title: "A operação vira inteligente",
    body: "A partir daí, cada pedido, comanda e pagamento é capturado em tempo real. Sem papel, sem planilha, sem depender de ninguém lembrar de anotar. A equipe trabalha normalmente — e o SUPERBAR registra tudo e transforma cada turno em dado confiável.",
  },
  {
    num: "/3",
    title: "Saiba o que merece atenção",
    body: "De manhã, você abre o painel e o SUPERBAR já fez o trabalho pesado: CMV, margem por produto, ticket médio, oportunidades que você ainda não enxergou. Em segundos você sabe onde agir — sem precisar procurar, interpretar ou adivinhar.",
  },
];

const N    = STEPS.length;
const BG   = "#111113";
const DARK = "#FAFAFA";
const CARD_COLORS = ["#1C1C1E", "#232325", "#2A2A2C"];

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 32,
  letterSpacing: "-0.01em",
  color: "#ffffff",
};

const PEEK_PX = 20;
const SHRINK  = 0.025;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function getCardT(i: number, progress: number): number {
  if (i === 0) return 1;
  const ENTRY_START = 0.1;
  const ENTRY_END   = 0.90;
  const slot  = (ENTRY_END - ENTRY_START) / (N - 1);
  const width = slot * 0.55;
  const start = ENTRY_START + (i - 1) * slot;
  return easeOutCubic(Math.max(0, Math.min(1, (progress - start) / width)));
}

export function ProcessoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let rafId: number;

    const tick = () => {
      const rect   = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      const ts = STEPS.map((_, i) => getCardT(i, progress));

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const t     = ts[i];
        const depth = ts.slice(i + 1).reduce((s, p) => s + p, 0);
        const pushY = depth * PEEK_PX;
        const entryY = (1 - t) * 60;
        const scale  = Math.max(0.88, 1 - depth * SHRINK - (1 - t) * 0.08);
        card.style.transform = `translateY(${pushY + entryY}px) scale(${scale})`;
        card.style.opacity   = String(Math.min(1, t * 2.5));
        card.style.zIndex    = String(i + 1);
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {/* ── Mobile: cards estáticos empilhados, sem sticky ── */}
      <section className="md:hidden px-4 py-10" style={{ background: BG }}>
        <h2 style={{ ...TITLE_STYLE, margin: "0 0 24px" }}>
          Nosso Processo
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              style={{
                background: "#1C1C1E",
                borderRadius: 20,
                padding: "28px 24px",
                border: "1px solid #2C2C2E",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              <p
                className="text-balance"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 32,
                  fontWeight: 600,
                  color: "#F59E0B",
                  letterSpacing: "-0.01em",
                  margin: "0 0 16px",
                  lineHeight: 1.1,
                }}
              >
                {step.num} {step.title}
              </p>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
              <p
                className="text-pretty"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  fontWeight: 400,
                  color: DARK,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Desktop: sticky scroll animation ── */}
      <section
        ref={sectionRef}
        className="hidden md:block"
        style={{ minHeight: `${N * 100}vh`, background: BG }}
      >
        <style>{`
          .processo-stack { height: 320px; }
          .processo-card  { padding: 40px 36px; }
          @media (min-width: 1024px) {
            .processo-stack { height: 300px; }
            .processo-card  { padding: 44px 52px; }
          }
        `}</style>

        <div
          className="sticky top-0 z-10 flex h-screen flex-col items-center justify-center"
          style={{ background: BG }}
        >
          <h2 className="text-center" style={{ ...TITLE_STYLE, margin: "0 0 28px", padding: "0 16px" }}>
            Nosso Processo
          </h2>

          <div className="w-full px-8 lg:px-14">
            <div className="relative processo-stack mx-auto" style={{ maxWidth: 980 }}>
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="processo-card"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    background: CARD_COLORS[i],
                    border: "1px solid #2C2C2E",
                    borderRadius: "24px",
                    opacity: 0,
                    willChange: "transform, opacity",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    transformOrigin: "top center",
                  }}
                >
                  <p
                    className="text-balance"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 32,
                      fontWeight: 600,
                      color: "#F59E0B",
                      letterSpacing: "-0.01em",
                      margin: "0 0 20px",
                      lineHeight: 1.1,
                    }}
                  >
                    {step.num} {step.title}
                  </p>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: "20px" }} />
                  <p
                    className="text-pretty"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 16,
                      fontWeight: 400,
                      color: DARK,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
