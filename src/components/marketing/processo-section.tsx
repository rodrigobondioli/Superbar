"use client";
import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   PROCESSO — scroll horizontal pinado.
   A seção trava na tela e os 3 passos deslizam lateralmente conforme o
   scroll, com dwell (para em cada passo, transiciona rápido). Cada passo:
   número outline gigante + pill laranja torta + corpo. Linha pontilhada
   horizontal atravessa os números. Mobile: lista estática.
   ──────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    title: "Comece hoje",
    body: "Em um dia, você cadastra o cardápio completo, configura a equipe e organiza as mesas. Nada de técnico agendado, nada de semanas esperando implantação. O onboarding guia cada etapa — e quando termina, o bar já está operando.",
  },
  {
    title: "A operação vira inteligente",
    body: "A partir daí, cada pedido, comanda e pagamento é capturado em tempo real. Sem papel, sem planilha, sem depender de ninguém lembrar de anotar. A equipe trabalha normalmente — e o SUPERBAR transforma cada turno em dado confiável.",
  },
  {
    title: "Saiba o que merece atenção",
    body: "De manhã, você abre o painel e o SUPERBAR já fez o trabalho pesado: CMV, margem por produto, ticket médio, oportunidades que você ainda não enxergou. Em segundos você sabe onde agir — sem precisar procurar, interpretar ou adivinhar.",
  },
];

const N = STEPS.length;
const BG = "#111113";
const ACCENT = "#FF3500";
const TILTS = [-3, 2, -2];

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* Dwell: segura em cada passo, transiciona rápido entre eles. */
function dwellProgress(p: number) {
  const t = p * (N - 1);
  const seg = Math.min(N - 2, Math.floor(t));
  const frac = t - seg;
  const PLATEAU = 0.28;
  let eased: number;
  if (frac < PLATEAU) eased = 0;
  else if (frac > 1 - PLATEAU) eased = 1;
  else eased = easeInOutCubic((frac - PLATEAU) / (1 - 2 * PLATEAU));
  return (seg + eased) / (N - 1);
}

export function ProcessoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId: number;

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel > 0) {
        const raw = Math.max(0, Math.min(1, -rect.top / travel));
        const progress = reduced ? raw : dwellProgress(raw);
        const xVw = -progress * (N - 1) * 100;
        track.style.transform = `translateX(${xVw}vw)`;

        /* passo ativo em destaque, vizinhos apagados */
        itemRefs.current.forEach((el, i) => {
          if (!el) return;
          const dist = Math.abs(progress * (N - 1) - i); /* 0 = ativo */
          el.style.opacity = String(Math.max(0.25, 1 - dist * 0.75));
        });
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {/* ── Mobile: lista estática ── */}
      <section className="md:hidden page-x py-14" style={{ background: BG }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(2rem, 8vw, 2.75rem)",
            textTransform: "uppercase",
            letterSpacing: "0.01em",
            lineHeight: 0.82,
            color: "#ffffff",
            margin: "0 0 32px",
          }}
        >
          Nosso processo
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {STEPS.map((step, i) => (
            <div key={step.title} style={{ borderTop: "1px dashed rgba(255,255,255,0.25)", paddingTop: 24 }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "3.5rem",
                  lineHeight: 0.82,
                  color: "transparent",
                  WebkitTextStroke: "1.5px rgba(255,255,255,0.4)",
                  margin: "0 0 12px",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </p>
              <p
                style={{
                  display: "inline-block",
                  background: ACCENT,
                  color: "#000",
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  fontSize: "1.1rem",
                  letterSpacing: "0.02em",
                  borderRadius: 999,
                  padding: "8px 20px",
                  margin: "0 0 16px",
                  transform: `rotate(${TILTS[i]}deg)`,
                }}
              >
                {step.title}
              </p>
              <p
                className="text-pretty"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.85)",
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

      {/* ── Desktop: horizontal pinado ── */}
      <section
        ref={sectionRef}
        className="hidden md:block"
        style={{ minHeight: `${N * 120}vh`, background: BG }}
      >
        <div className="sticky top-0 h-screen overflow-hidden" style={{ background: BG }}>
          {/* Título fixo */}
          <h2
            className="absolute left-1/2 top-14 z-10 -translate-x-1/2"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: "#ffffff",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Nosso processo
          </h2>

          {/* Contador fixo à direita */}
          <div
            className="absolute right-8 top-16 z-10 lg:right-14"
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontSize: 12,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            /{N} passos
          </div>

          {/* Trilho horizontal */}
          <div
            ref={trackRef}
            className="flex h-full"
            style={{ width: `${N * 100}vw`, willChange: "transform" }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative flex h-full items-center justify-center"
                style={{ width: "100vw", flexShrink: 0 }}
              >
                {/* Linha pontilhada horizontal — atravessa o slide inteiro na
                    altura do número (contínua entre slides adjacentes) */}
                <div
                  aria-hidden="true"
                  className="absolute left-0 right-0"
                  style={{
                    top: "calc(50% - 150px)",
                    borderTop: "2px dotted rgba(255,255,255,0.22)",
                  }}
                />

                <div
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="relative flex flex-col items-center text-center"
                  style={{ width: "min(88vw, 760px)", willChange: "opacity" }}
                >
                  {/* Número outline gigante */}
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(9.5rem, 18vw, 15.5rem)",
                      lineHeight: 0.85,
                      color: BG,
                      WebkitTextStroke: "2px rgba(255,255,255,0.45)",
                      margin: "0 0 30px",
                      userSelect: "none",
                      position: "relative",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>

                  {/* Pill título */}
                  <p
                    style={{
                      display: "inline-block",
                      background: ACCENT,
                      color: "#000",
                      fontFamily: "var(--font-display)",
                      textTransform: "uppercase",
                      fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                      letterSpacing: "0.02em",
                      borderRadius: 999,
                      padding: "12px 32px",
                      margin: "0 0 24px",
                      transform: `rotate(${TILTS[i]}deg)`,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.title}
                  </p>

                  {/* Corpo */}
                  <p
                    className="text-pretty"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "clamp(1rem, 1.3vw, 1.125rem)",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.82)",
                      lineHeight: 1.65,
                      maxWidth: 720,
                      margin: 0,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
