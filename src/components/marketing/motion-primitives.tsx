"use client";

/* ─────────────────────────────────────────────────────────────────────────
   MOTION PRIMITIVES — vocabulário de animação da landing.
   Referência de craft: buckssauce.com (Buzzworthy Studio).
   Tudo com framer-motion (já no bundle) + CSS. Respeita
   prefers-reduced-motion via useReducedMotion onde importa.
   ──────────────────────────────────────────────────────────────────────── */

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/* ── Reveal — fade + rise ao entrar na viewport ─────────────────────────── */

export function Reveal({
  children,
  delay = 0,
  y = 32,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/* ── Lines — reveal linha a linha com máscara (títulos cartaz) ──────────── */

export function Lines({
  lines,
  delay = 0,
  stagger = 0.09,
  as: Tag = "span",
  lineClassName,
}: {
  lines: React.ReactNode[];
  delay?: number;
  stagger?: number;
  as?: "span" | "div";
  lineClassName?: string;
}) {
  const reduced = useReducedMotion();

  /* IMPORTANTE: o whileInView fica no CONTAINER (nunca clipado) e propaga
     pras linhas via variants. Se ficar na própria linha, o clip da máscara
     esconde o elemento do IntersectionObserver e a animação nunca dispara. */
  const lineVariant = {
    hidden: reduced ? { y: 0 } : { y: "140%" },
    visible: (i: number) => ({
      y: 0,
      transition: {
        duration: 1.1,
        delay: delay + i * stagger,
        ease: EASE_OUT_EXPO,
      },
    }),
  };

  /* A máscara tem padding vertical generoso (0.18em) pros diacríticos de
     maiúscula (Á, Ã, É — que desenham ACIMA da caixa da linha) não serem
     cortados, e margem negativa igual pra não abrir o espaçamento visual.
     O y inicial (140%) é maior que 100% + padding, então nada vaza antes. */
  return (
    <motion.span
      style={{ display: "block" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
    >
      {lines.map((line, i) => (
        <Tag
          key={i}
          className={lineClassName}
          style={{
            display: "block",
            overflow: "hidden",
            /* folga vertical pros diacríticos e horizontal pra elementos que
               transbordam a palavra (ex.: CircleScribble) — compensada com
               margem negativa pra não deslocar o layout */
            padding: "0.18em 0.32em",
            margin: "-0.18em -0.32em",
          }}
        >
          <motion.span
            custom={i}
            variants={lineVariant}
            style={{ display: "block", willChange: "transform" }}
          >
            {line}
          </motion.span>
        </Tag>
      ))}
    </motion.span>
  );
}

/* ── Counter — número que conta ao entrar na viewport ───────────────────── */

export function Counter({
  to,
  suffix = "",
  duration = 1.6,
  style,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let rafId: number;
    if (reduced) {
      rafId = requestAnimationFrame(() => setVal(to));
      return () => cancelAnimationFrame(rafId);
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(eased * to));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} style={style} className={className}>
      {val}{suffix}
    </span>
  );
}

/* ── Marquee — faixa infinita (tipografia gigante correndo) ─────────────── */

export function Marquee({
  children,
  direction = "left",
  speed = 60,
  className,
  style,
}: {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: number; /* segundos por ciclo */
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ overflow: "hidden", whiteSpace: "nowrap", ...style }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes sb-marquee-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes sb-marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .sb-marquee-track { animation: none !important; } }
      `}</style>
      <div
        className="sb-marquee-track"
        style={{
          display: "inline-flex",
          willChange: "transform",
          animation: `${direction === "left" ? "sb-marquee-l" : "sb-marquee-r"} ${speed}s linear infinite`,
        }}
      >
        <div style={{ display: "inline-flex", flexShrink: 0 }}>{children}</div>
        <div style={{ display: "inline-flex", flexShrink: 0 }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Magnetic — elemento que gruda no cursor (botões) ───────────────────── */

export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent) {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, display: "inline-block" }}
    >
      {children}
    </motion.div>
  );
}

/* ── ArrowDoodle — seta rabiscada que se desenha ao entrar na tela ──────── */

export function ArrowDoodle({
  className,
  style,
  color = "#FF3500",
}: {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      initial={reduced ? false : { opacity: 0, x: -16, y: -16 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* curva única, suave */}
      <path
        d="M14 10 C 62 16, 86 46, 96 92"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* ponta cheia, alinhada à tangente */}
      <path d="M99 110 L105 89 L87 93 Z" fill={color} />
    </motion.svg>
  );
}

/* ── CircleScribble — círculo rabiscado que se desenha em volta de uma
      palavra (uso: <span relative inline-block>palavra<CircleScribble/></span>) ── */

export function CircleScribble({
  delay = 1.1,
  color = "#FF3500",
  className,
  style,
}: {
  delay?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 300 120"
      fill="none"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-7%",
        top: "-16%",
        width: "114%",
        height: "138%",
        pointerEvents: "none",
        overflow: "visible",
        ...style,
      }}
    >
      <motion.path
        d="M158 10 C 74 4, 14 26, 12 60 C 10 94, 82 114, 166 110 C 250 106, 290 84, 287 54 C 284 22, 206 2, 122 12 C 88 16, 60 26, 48 38"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{
          pathLength: { duration: 1.0, delay, ease: "easeInOut" as const },
          opacity: { duration: 0.01, delay },
        }}
      />
    </motion.svg>
  );
}

/* ── SectionRule — linha fina + label numerado (sistema gráfico) ────────── */

export function SectionRule({
  num,
  label,
  right = "Superbar®",
  className,
}: {
  num: string;
  label: string;
  right?: string;
  className?: string;
}) {
  return (
    <div className={`page-x ${className ?? ""}`}>
      <div
        className="mx-auto flex max-w-[1440px] items-baseline justify-between"
        style={{
          borderTop: "1px dashed rgba(255,255,255,0.25)",
          paddingTop: 14,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-roboto-mono)",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <span style={{ color: "#FF3500" }}>/{num}</span>
          {"  "}{label}
        </span>
        <span
          className="hidden md:inline"
          style={{
            fontFamily: "var(--font-roboto-mono)",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {right}
        </span>
      </div>
    </div>
  );
}

/* ── Grain — textura de ruído por cima de tudo (craft) ──────────────────── */

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function Grain() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        pointerEvents: "none",
        backgroundImage: NOISE_SVG,
        backgroundRepeat: "repeat",
        backgroundSize: 180,
        opacity: 0.05,
        mixBlendMode: "overlay",
      }}
    />
  );
}
