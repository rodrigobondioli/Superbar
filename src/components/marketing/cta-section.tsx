"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { CTAButton } from "@/components/marketing/cta-button";
import { Lines, Reveal } from "@/components/marketing/motion-primitives";

/* ─────────────────────────────────────────────────────────────────────────
   CTA FINAL — a seção é um copo de líquido laranja.
   1) Superfície: duas ondas sobrepostas em velocidades diferentes (profundidade).
   2) Gás: bolhas sobem do fundo com wobble e estouram perto da superfície.
   3) Splash: quando o mouse cruza do preto pro laranja, gotas espirram
      pra cima na posição do cursor (Web Animations API, sem lib).
   ──────────────────────────────────────────────────────────────────────── */

// Onda: cristas e vales em torno de y=20. Dois ciclos pra loop sem emenda.
const TOP = "M0,0 L0,20 Q60,8 120,20 T240,20 T360,20 T480,20 T600,20 T720,20 T840,20 T960,20 T1080,20 T1200,20 T1320,20 T1440,20 T1560,20 T1680,20 T1800,20 T1920,20 T2040,20 T2160,20 T2280,20 T2400,20 T2520,20 T2640,20 T2760,20 T2880,20 L2880,0 Z";
// Segunda onda, fase invertida (vales onde a outra tem cristas) — camada de profundidade.
const TOP2 = "M0,0 L0,22 Q60,34 120,22 T240,22 T360,22 T480,22 T600,22 T720,22 T840,22 T960,22 T1080,22 T1200,22 T1320,22 T1440,22 T1560,22 T1680,22 T1800,22 T1920,22 T2040,22 T2160,22 T2280,22 T2400,22 T2520,22 T2640,22 T2760,22 T2880,22 L2880,0 Z";

// Gás — configuração determinística (evita mismatch de hidratação).
const BUBBLES = [
  { left: "4%",  size: 12, dur: 9.5,  delay: 0,   wob: 22,  o: 0.4  },
  { left: "9%",  size: 7,  dur: 7.0,  delay: 3.2, wob: -18, o: 0.5  },
  { left: "14%", size: 8,  dur: 7.2,  delay: 2.1, wob: -16, o: 0.48 },
  { left: "19%", size: 15, dur: 11.4, delay: 4.3, wob: 30,  o: 0.35 },
  { left: "26%", size: 6,  dur: 6.4,  delay: 0.9, wob: 20,  o: 0.52 },
  { left: "31%", size: 10, dur: 8.1,  delay: 1.2, wob: -24, o: 0.45 },
  { left: "37%", size: 8,  dur: 7.6,  delay: 5.6, wob: 16,  o: 0.42 },
  { left: "42%", size: 6,  dur: 6.6,  delay: 3.4, wob: 14,  o: 0.55 },
  { left: "47%", size: 13, dur: 10.6, delay: 2.4, wob: -26, o: 0.34 },
  { left: "51%", size: 14, dur: 10.2, delay: 0.8, wob: -28, o: 0.38 },
  { left: "56%", size: 7,  dur: 6.8,  delay: 4.7, wob: 22,  o: 0.5  },
  { left: "60%", size: 9,  dur: 7.8,  delay: 5.1, wob: 18,  o: 0.48 },
  { left: "65%", size: 6,  dur: 6.2,  delay: 1.8, wob: -14, o: 0.52 },
  { left: "69%", size: 11, dur: 9.0,  delay: 2.7, wob: -20, o: 0.42 },
  { left: "74%", size: 8,  dur: 7.4,  delay: 0.4, wob: 24,  o: 0.46 },
  { left: "78%", size: 6,  dur: 6.9,  delay: 4.0, wob: 26,  o: 0.55 },
  { left: "83%", size: 10, dur: 8.8,  delay: 5.9, wob: -18, o: 0.4  },
  { left: "86%", size: 15, dur: 11.0, delay: 1.6, wob: -14, o: 0.33 },
  { left: "91%", size: 7,  dur: 7.1,  delay: 3.7, wob: 18,  o: 0.5  },
  { left: "95%", size: 9,  dur: 8.4,  delay: 3.0, wob: 20,  o: 0.45 },
];

export function CtaSection() {
  const reduced = useReducedMotion();
  const splashHostRef = useRef<HTMLDivElement>(null);
  const lastSplash = useRef(0);

  function splash(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const now = performance.now();
    if (now - lastSplash.current < 450) return; // não metralhar
    lastSplash.current = now;

    const host = splashHostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left;

    /* ── Gotas com balística real: sobem desacelerando, caem acelerando
       (g px/s²), giram alinhadas à velocidade e esticam com a rapidez.
       Trajetória amostrada em 12 keyframes com easing linear. ── */
    const G = 2400;
    const drops = 12;
    for (let i = 0; i < drops; i++) {
      const d = document.createElement("span");
      const size = 5 + Math.random() * 12;
      d.style.cssText = `position:absolute;left:${x - size / 2}px;top:18px;width:${size}px;height:${size}px;border-radius:50%;background:#FF3500;pointer-events:none;will-change:transform,opacity;`;
      host.appendChild(d);

      const vy = -(380 + Math.random() * 420); /* velocidade inicial pra cima */
      const vx = (Math.random() - 0.5) * 340;
      /* tempo até mergulhar de volta 46px abaixo da superfície */
      const tEnd = (-vy + Math.sqrt(vy * vy + 2 * G * 46)) / G;

      const S = 12;
      const frames = [];
      for (let k = 0; k <= S; k++) {
        const t = (tEnd * k) / S;
        const px = vx * t;
        const py = vy * t + 0.5 * G * t * t;
        const vyt = vy + G * t;
        const speed = Math.abs(vyt);
        const stretch = Math.min(1.45, 1 + speed / 1100);
        const ang = (Math.atan2(vyt, vx) * 180) / Math.PI + 90;
        frames.push({
          transform: `translate(${px}px, ${py}px) rotate(${ang}deg) scale(${1 / Math.sqrt(stretch)}, ${stretch})`,
          opacity: k === S ? 0 : 1,
          offset: k / S,
        });
      }
      d.animate(frames, { duration: tEnd * 1000, easing: "linear" }).onfinish =
        () => d.remove();
    }

    /* ── "Pegada": blob que salta da superfície com overshoot e afunda ── */
    const blobW = 46 + Math.random() * 26;
    const b = document.createElement("span");
    b.style.cssText = `position:absolute;left:${x - blobW / 2}px;top:-8px;width:${blobW}px;height:44px;border-radius:50% 50% 42% 42% / 62% 62% 38% 38%;background:#FF3500;pointer-events:none;transform-origin:50% 100%;will-change:transform,opacity;`;
    host.appendChild(b);
    b.animate(
      [
        { transform: "translateY(34px) scale(0.5, 0.15)", opacity: 1 },
        { transform: "translateY(-12px) scale(0.95, 1.2)", opacity: 1, offset: 0.3 },
        { transform: "translateY(-4px) scale(1.08, 0.88)", opacity: 1, offset: 0.52 },
        { transform: "translateY(0px) scale(0.97, 1.04)", opacity: 1, offset: 0.72 },
        { transform: "translateY(30px) scale(0.6, 0.2)", opacity: 0.9 },
      ],
      { duration: 950, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    ).onfinish = () => b.remove();

    /* ── Ondulação dupla na superfície ── */
    [0, 180].forEach((delay, ri) => {
      const r = document.createElement("span");
      const w = 70 + ri * 30;
      r.style.cssText = `position:absolute;left:${x - w / 2}px;top:12px;width:${w}px;height:18px;border-radius:50%;border:2px solid rgba(17,17,19,0.5);background:transparent;pointer-events:none;will-change:transform,opacity;`;
      host.appendChild(r);
      r.animate(
        [
          { transform: "scale(0.25)", opacity: 0.9 },
          { transform: "scale(2.4)", opacity: 0 },
        ],
        { duration: 1000, delay, easing: "ease-out" },
      ).onfinish = () => r.remove();
    });
  }

  return (
    <section
      className="relative flex items-center justify-center py-28 md:min-h-[90vh] md:py-0"
      style={{ background: "#FF3500" }}
    >
      <style>{`
        @keyframes ctaOndaSlosh  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
        @keyframes ctaOndaSlosh2 { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes sbBubble {
          0%   { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
          12%  { opacity: var(--o); }
          55%  { transform: translateY(-42vh) translateX(var(--wob)) scale(0.9); opacity: var(--o); }
          92%  { opacity: var(--o); }
          100% { transform: translateY(-76vh) translateX(calc(var(--wob) * -0.5)) scale(1.15); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-onda, .cta-onda-2, .sb-bubble { animation: none !important; }
          .sb-bubble { display: none; }
        }
      `}</style>

      {/* Camada de profundidade da onda (mais lenta, sentido oposto) */}
      <div className="absolute left-0 right-0 top-0 overflow-hidden" style={{ lineHeight: 0 }}>
        <svg
          viewBox="0 0 2880 44"
          preserveAspectRatio="none"
          className="cta-onda-2"
          style={{ width: "200%", height: 40, display: "block", opacity: 0.35, animation: "ctaOndaSlosh2 14s linear infinite" }}
        >
          <path d={TOP2} fill="#111113" />
        </svg>
      </div>

      {/* Superfície principal */}
      <div className="absolute left-0 right-0 top-0 overflow-hidden" style={{ lineHeight: 0 }}>
        <svg
          viewBox="0 0 2880 40"
          preserveAspectRatio="none"
          className="cta-onda"
          style={{ width: "200%", height: 32, display: "block", animation: "ctaOndaSlosh 9s linear infinite" }}
        >
          <path d={TOP} fill="#111113" />
        </svg>
      </div>

      {/* Gás — bolhas subindo do fundo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="sb-bubble"
            style={{
              position: "absolute",
              bottom: -24,
              left: b.left,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              boxShadow: "inset -1.5px -1.5px 0 rgba(255,255,255,0.35)",
              opacity: 0,
              ["--wob" as string]: `${b.wob}px`,
              ["--o" as string]: b.o,
              animation: `sbBubble ${b.dur}s linear ${b.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* Zona de splash — faixa no topo que detecta o mouse cruzando a superfície */}
      <div
        ref={splashHostRef}
        onMouseEnter={splash}
        className="absolute left-0 right-0 top-0 z-20 hidden md:block"
        style={{ height: 130, overflow: "visible" }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex w-full flex-col items-center text-center">
        <Reveal y={20}>
          <p
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontWeight: 400,
              fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#000000",
              marginBottom: "1rem",
            }}
          >
            Seu bar ficou super
          </p>
        </Reveal>

        {/* Palavra-cartaz full-bleed */}
        <h2
          className="w-full"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(4rem, 15.5vw, 16rem)",
            color: "#000000",
            textTransform: "uppercase",
            letterSpacing: "0.005em",
            lineHeight: 0.82,
            marginBottom: "1.75rem",
          }}
        >
          <Lines delay={0.1} lines={[<span key="l1">Inteligente</span>]} />
        </h2>

        <Reveal delay={0.3} y={20}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              fontWeight: 400,
              color: "#000000",
              marginBottom: "2rem",
            }}
          >
            Da operação ao lucro, em tempo real.
          </p>
        </Reveal>

        <Reveal delay={0.45} y={20}>
          <CTAButton variant="black" />
        </Reveal>
      </div>
    </section>
  );
}
