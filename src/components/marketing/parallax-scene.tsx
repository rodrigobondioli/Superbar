"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { Marquee } from "@/components/marketing/motion-primitives";

/* ─────────────────────────────────────────────────────────────────────────
   PARALLAX + MARQUEE — o momento tipográfico do meio da página.
   Duas faixas gigantes em Anton correndo em direções opostas
   ("DIMINUÍMOS O CMV" cheia / "AUMENTAMOS A MARGEM" contornada em laranja),
   com os PNGs (gelo, limão, mascote) flutuando por cima em parallax de
   scroll + float contínuo. Referência: buckssauce.com.
   ──────────────────────────────────────────────────────────────────────── */

type Img = {
  id: string;
  src: string;
  w: number;
  h: number;
  left: string;
  top: string;
  speedY: number;
  speedX: number;
  rot: number;
  z: number;
  imgRot?: number;
  float: string;
  dur: string;
  delay: string;
};

const ITEMS: Img[] = [
  { id: "ice", src: "/img-lp/cubo-gelo.png", w: 190, h: 190,
    left: "66%", top: "0%", speedY: 120, speedX: -55, rot: 32, z: 4,
    float: "float-img-a", dur: "3.8s", delay: "0.2s" },
  { id: "lemon", src: "/img-lp/limao.png", w: 240, h: 240, imgRot: 20,
    left: "72%", top: "62%", speedY: 60, speedX: 60, rot: -24, z: 3,
    float: "float-img-b", dur: "5.2s", delay: "1s" },
  { id: "mascot", src: "/img-lp/logo-superbar.svg", w: 155, h: 155,
    left: "44%", top: "56%", speedY: 80, speedX: -30, rot: 16, z: 5,
    float: "float-img-c", dur: "4.1s", delay: "0.4s" },
];

const MARQUEE_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 400,
  fontSize: "clamp(3rem, 7.5vw, 7.5rem)",
  lineHeight: 1,
  textTransform: "uppercase",
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
};

function Row({ text, outline }: { text: string; outline?: boolean }) {
  const style: React.CSSProperties = outline
    ? {
        ...MARQUEE_TEXT_STYLE,
        color: "transparent",
        WebkitTextStroke: "2px #FF3500",
      }
    : { ...MARQUEE_TEXT_STYLE, color: "#FFFFFF" };

  return (
    <>
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.2em",
            /* padding vertical: respiro pros acentos de maiúscula (Í, É)
               que desenham acima da caixa da linha — sem isso o overflow
               do marquee corta o acento */
            padding: "0.14em 0.1em",
            fontSize: MARQUEE_TEXT_STYLE.fontSize,
          }}
        >
          <span style={style}>{text}</span>
          {/* bolinha desenhada (não glifo) — centraliza perfeito na altura das caixas-altas */}
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "0.13em",
              height: "0.13em",
              borderRadius: "50%",
              background: "#FF3500",
              flexShrink: 0,
            }}
          />
        </span>
      ))}
    </>
  );
}

export function ParallaxScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const outerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let rafId: number;

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const mid = window.innerHeight / 2;
      const d = Math.max(-0.55, Math.min(0.55, (center - mid) / window.innerHeight));

      outerRefs.current.forEach((el, i) => {
        if (!el) return;
        const item = ITEMS[i];
        el.style.transform = `translateX(${d * item.speedX}px) translateY(${d * item.speedY}px) rotate(${d * item.rot}deg)`;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col justify-center overflow-hidden"
      style={{ height: "clamp(380px, 62vh, 640px)", background: "#111113" }}
    >
      <style>{`
        @keyframes float-img-a {
          0%   { transform: translateY(0px) rotate(-4deg) scale(1); }
          40%  { transform: translateY(-28px) rotate(5deg) scale(1.04); }
          70%  { transform: translateY(14px) rotate(-2deg) scale(0.97); }
          100% { transform: translateY(0px) rotate(-4deg) scale(1); }
        }
        @keyframes float-img-b {
          0%   { transform: translateY(0px) rotate(6deg) scale(1); }
          35%  { transform: translateY(-32px) rotate(-8deg) scale(1.05); }
          65%  { transform: translateY(18px) rotate(3deg) scale(0.96); }
          100% { transform: translateY(0px) rotate(6deg) scale(1); }
        }
        @keyframes float-img-c {
          0%   { transform: translateY(0px) rotate(0deg) scale(1); }
          45%  { transform: translateY(-22px) rotate(10deg) scale(1.06); }
          75%  { transform: translateY(12px) rotate(-5deg) scale(0.97); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sb-float { animation: none !important; }
        }
      `}</style>

      {/* Faixas gigantes */}
      <div className="relative z-[2] flex flex-col">
        <Marquee direction="left" speed={38}>
          <Row text="Diminuímos o CMV" />
        </Marquee>
        <Marquee direction="right" speed={44} className="-mt-3 md:-mt-6">
          <Row text="Aumentamos a margem" outline />
        </Marquee>
      </div>

      {/* PNGs flutuando por cima */}
      {ITEMS.map((item, i) => (
        <div
          key={item.id}
          ref={(el) => { outerRefs.current[i] = el; }}
          style={{
            position: "absolute",
            left: item.left,
            top: item.top,
            zIndex: item.z,
            willChange: "transform",
          }}
        >
          <div
            className="sb-float"
            style={{
              animation: `${item.float} ${item.dur} ease-in-out ${item.delay} infinite`,
              willChange: "transform",
            }}
          >
            <Image
              src={item.src}
              alt=""
              width={item.w}
              height={item.h}
              style={{
                transform: item.imgRot ? `rotate(${item.imgRot}deg)` : undefined,
                filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.45))",
              }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
