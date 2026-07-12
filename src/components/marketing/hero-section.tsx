"use client";

/* ─────────────────────────────────────────────────────────────────────────
   HERO — o cartaz. Título display gigante (Anton via --font-display),
   reveal linha a linha com máscara, glow laranja respirando atrás,
   CTA magnético e indicador de scroll. Referência: buckssauce.com.
   ──────────────────────────────────────────────────────────────────────── */

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/components/marketing/cta-button";
import { Lines, Reveal } from "@/components/marketing/motion-primitives";

const ACCENT = "#FF3500";

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative flex min-h-dvh w-full flex-col justify-between overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #0A0A0B 0%, #111113 100%)" }}
    >
      {/* Glow laranja respirando atrás do título */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: "70vw",
            height: "70vw",
            maxWidth: 900,
            maxHeight: 900,
            x: "-50%",
            y: "-50%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 62%)`,
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Miolo */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center page-x pb-14 pt-28 text-center md:pb-20 md:pt-24">
        {/* Eyebrow */}
        <Reveal delay={0.1} y={16}>
          <p
            className="mb-6 md:mb-10"
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <span style={{ color: ACCENT }}>/</span> Inteligência operacional
            para donos de bar
          </p>
        </Reveal>

        {/* H1 cartaz */}
        <h1
          className="mb-6 text-white md:mb-8"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 8.75vw, 8.75rem)",
            lineHeight: 0.82,
            letterSpacing: "0.01em",
            textTransform: "uppercase",
          }}
        >
          <Lines
            delay={0.2}
            lines={[
              <span key="l1">Seu bar está</span>,
              <span key="l2">
                ganhando <span style={{ color: ACCENT }}>dinheiro</span>
              </span>,
              <span key="l3">ou só vendendo mais?</span>,
            ]}
          />
        </h1>

        {/* Sub */}
        <Reveal delay={0.65} y={24}>
          <p
            className="mb-9 md:mb-11"
            style={{
              color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1rem, 2.2vw, 1.25rem)",
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: "880px",
            }}
          >
            <span className="md:block">
              O primeiro sistema criado para mostrar o lucro real do seu bar.
            </span>
            <span className="md:block">
              Margem, CMV e oportunidades em tempo real — menos relatórios,
              mais decisões.
            </span>
          </p>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.8} y={20}>
          <CTAButton />
        </Reveal>
      </div>

      {/* Rodapé do hero — só o scroll indicator (a régua fica com a seção seguinte) */}
      <div className="relative z-10 page-x pb-7">
        <Reveal delay={1.1} y={0}>
          <div className="mx-auto flex max-w-[1440px] items-center justify-end">
            <span
              className="inline-flex items-center gap-3"
              style={{
                fontFamily: "var(--font-roboto-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Scroll
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 34,
                  height: 1,
                  overflow: "hidden",
                  position: "relative",
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                {!reduced && (
                  <motion.span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: ACCENT,
                    }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.4,
                    }}
                  />
                )}
              </span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
