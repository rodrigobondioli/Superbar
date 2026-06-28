"use client";

import { useEffect, useRef } from "react";

const WORDS =
  "Imagine seu bar como uma coqueteleira. Você coloca tudo dentro. Insumo, Equipe, Tempo, e Energia. Trabalha a semana inteira para encher o bar. Serve. Repete. Mas existe um vazamento que você não vê. Enquanto o bar enche, o lucro vaza. Você sabe quanto entrou. Não sabe quanto sobrou."
    .split(" ");

const FEATHER = 10;

const TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 500,
  fontSize: "clamp(1.75rem, 4.5vw, 3.5rem)",
  lineHeight: 1.25,
  color: "#ffffff",
  maxWidth: "1100px",
};

export function TextRevealSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordRefs   = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let rafId: number;

    const tick = () => {
      const rect      = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      const cursor   = progress * (WORDS.length - 1 + 2 * FEATHER) - FEATHER;

      wordRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = Math.max(0, Math.min(1, (cursor - i) / FEATHER));
        el.style.opacity = String(0.13 + t * 0.87);
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {/* ── Mobile: texto estático, sem sticky ── */}
      <section className="md:hidden px-4 py-20">
        <p style={{ ...TEXT_STYLE, fontSize: "1.5rem" }}>
          {WORDS.join(" ")}
        </p>
      </section>

      {/* ── Desktop: word-reveal com sticky ── */}
      <section
        ref={sectionRef}
        className="hidden md:block"
        style={{ minHeight: "140vh" }}
      >
        <div className="sticky top-0 flex min-h-screen items-center">
          <div className="mx-auto w-full max-w-[1440px] px-8 lg:px-14">
            <p style={TEXT_STYLE}>
              {WORDS.map((word, i) => (
                <span
                  key={i}
                  ref={(el) => { wordRefs.current[i] = el; }}
                  style={{ opacity: 0.13 }}
                >
                  {word}{" "}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
