"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertTriangle } from "lucide-react";
import { Lines, Reveal, SectionRule } from "@/components/marketing/motion-primitives";

/* ─────────────────────────────────────────────────────────────────────────
   VEJA FUNCIONANDO — animação "Da nota ao lucro"
   Conta a história do produto: sobe a NF-e → o estoque se preenche sozinho
   (produto + custo + fornecedor) → vira inteligência (margem, CMV, alerta).
   O Backbar termina em "estoque montado"; a gente termina em DECISÃO.
   Dispara no scroll (IntersectionObserver) e repete no hover. Respeita
   prefers-reduced-motion (mostra o estado final, sem movimento).
   Sem biblioteca — só CSS keyframes com animation-delay encadeado.
   ──────────────────────────────────────────────────────────────────────── */

const ACCENT = "#FF3500";
const CARD = "#1C1C1E";
const BORDER = "#2C2C2E";

// Linhas do "estoque" que aparecem uma a uma (custo real de referência).
const ITENS = [
  { nome: "Absolut Peach Vodka", fornecedor: "6 Corners Beverage", custo: "R$ 19,75" },
  { nome: "Bacardi Spiced 70", fornecedor: "Northern Point", custo: "R$ 18,34" },
  { nome: "Tônica Fever-Tree", fornecedor: "6 Corners Beverage", custo: "R$ 4,20" },
];

export function VejaFuncionandoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  // 0 = nunca tocou (idle); >0 = tocando (o valor força remount pra reiniciar).
  const [runId, setRunId] = useState(0);
  const jaTocou = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !jaTocou.current) {
            jaTocou.current = true;
            setRunId(1);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Rever no hover — só depois de já ter tocado uma vez.
  function replay() {
    if (jaTocou.current) setRunId((r) => r + 1);
  }

  return (
    <section ref={sectionRef} className="py-14 md:py-[120px]" style={{ background: "#111113" }}>
      <style>{`
        @keyframes vfReveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes vfBar    { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .vf-el  { opacity: 0; }
        .vf-bar { transform: scaleX(0); transform-origin: left; }
        .vf-play .vf-el  { animation: vfReveal .55s cubic-bezier(.2,.7,.2,1) both; }
        .vf-play .vf-bar { animation: vfBar .9s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .vf-el, .vf-play .vf-el { opacity: 1 !important; animation: none !important; transform: none !important; }
          .vf-bar, .vf-play .vf-bar { transform: scaleX(1) !important; animation: none !important; }
        }
      `}</style>

      <SectionRule num="03" label="Na tela" />

      <div className="page-x pt-10 md:pt-14">
      <div className="mx-auto max-w-[1440px]">
        {/* Cabeçalho */}
        <div className="mb-8 md:mb-12 md:text-center">
          <h2
            className="mb-5 text-white"
            style={{
              fontFamily: "var(--font-display)", fontWeight: 400,
              fontSize: "clamp(2.5rem, 6.5vw, 5.5rem)", lineHeight: 0.82,
              letterSpacing: "0.01em", textTransform: "uppercase",
            }}
          >
            <Lines
              lines={[
                <span key="l1">A nota entra.</span>,
                <span key="l2">
                  O <span style={{ color: ACCENT }}>lucro</span> aparece.
                </span>,
              ]}
            />
          </h2>
          <Reveal delay={0.25} y={20}>
            <p
              className="text-balance md:mx-auto"
              style={{
                color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-sans)", fontWeight: 400,
                fontSize: "clamp(1rem, 2.5vw, 1.25rem)", lineHeight: 1.5, maxWidth: 760,
              }}
            >
              <span className="md:block">Sobe o XML e o SUPERBAR monta estoque, custo e fornecedor</span>
              <span className="md:block">sozinho — até a decisão que te espera de manhã.</span>
            </p>
          </Reveal>
        </div>

        {/* Device / mock animado + cards satélites saindo dele */}
        <div className="flex justify-center">
          <style>{`
            @keyframes vfFloatA { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-12px) rotate(-2.5deg); } }
            @keyframes vfFloatB { 0%,100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-14px) rotate(4.5deg); } }
            @media (prefers-reduced-motion: reduce) {
              .vf-sat { animation: none !important; }
            }
          `}</style>

          {/* Wrapper relativo do device — os satélites ancoram na borda dele */}
          <div className="relative w-full" style={{ maxWidth: 560 }}>
            {/* Satélite: ticket médio — nasce de dentro do card e salta pra fora */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute hidden lg:block"
              style={{ left: -104, top: 96, zIndex: 2 }}
              initial={{ x: 150, y: 90, scale: 0.6, opacity: 0 }}
              whileInView={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-25% 0px" }}
              transition={{
                type: "spring", stiffness: 95, damping: 20, mass: 1,
                delay: 0.25,
                opacity: { duration: 0.45, delay: 0.25 },
              }}
            >
              <div
                className="vf-sat"
                style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
                  padding: "16px 20px", boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
                  animation: "vfFloatA 5.5s ease-in-out 1.4s infinite",
                  willChange: "transform",
                }}
              >
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0 0 6px" }}>
                  Ticket médio
                </p>
                <p style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 26, color: "#fff", margin: 0, lineHeight: 1 }}>
                  R$ 86
                </p>
                <p style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 12, color: ACCENT, margin: "6px 0 0" }}>
                  ▲ 12% vs. semana passada
                </p>
              </div>
            </motion.div>

            {/* Satélite: top drinks — nasce de dentro do card e salta pra fora */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute hidden lg:block"
              style={{ right: -118, bottom: 130, zIndex: 2 }}
              initial={{ x: -160, y: 100, scale: 0.6, opacity: 0 }}
              whileInView={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-25% 0px" }}
              transition={{
                type: "spring", stiffness: 95, damping: 20, mass: 1,
                delay: 0.5,
                opacity: { duration: 0.45, delay: 0.5 },
              }}
            >
              <div
                className="vf-sat"
                style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
                  padding: "16px 20px", boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
                  animation: "vfFloatB 6.5s ease-in-out 1.8s infinite",
                  willChange: "transform",
                  minWidth: 210,
                }}
              >
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0 0 10px" }}>
                  Top drinks da noite
                </p>
                {[
                  { n: "1", nome: "Negroni", qtd: "×214" },
                  { n: "2", nome: "Gin Tônica", qtd: "×187" },
                  { n: "3", nome: "Caipirinha", qtd: "×162" },
                ].map((d) => (
                  <div key={d.n} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "4px 0" }}>
                    <span style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 11, color: ACCENT }}>/{d.n}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{d.nome}</span>
                    <span style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>{d.qtd}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          <div
            key={runId}
            className={runId > 0 ? "vf-play" : ""}
            onMouseEnter={replay}
            style={{
              width: "100%",
              position: "relative", zIndex: 1,
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
              padding: "clamp(16px, 4vw, 24px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            }}
          >
            {/* Passo 1 — a nota chega */}
            <div
              className="vf-el"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8,
                background: "color-mix(in srgb, #FF3500 10%, transparent)",
                border: "1px solid color-mix(in srgb, #FF3500 30%, transparent)",
                animationDelay: "0.15s",
              }}
            >
              <FileText style={{ width: 18, height: 18, color: ACCENT, flexShrink: 0 }} strokeWidth={2} />
              <span style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 13, color: "#fff" }}>
                nota-fiscal.xml
              </span>
              <span
                style={{
                  marginLeft: "auto", fontFamily: "var(--font-roboto-mono)", fontSize: 12,
                  color: ACCENT, letterSpacing: "0.02em",
                }}
              >
                importada
              </span>
            </div>

            {/* Passo 2 — o estoque se preenche */}
            <p
              className="vf-el"
              style={{
                fontFamily: "var(--font-roboto-mono)", fontSize: 11, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
                margin: "18px 0 8px", animationDelay: "0.7s",
              }}
            >
              Produtos, custo e fornecedor — sozinho
            </p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {ITENS.map((it, i) => (
                <div
                  key={it.nome}
                  className="vf-el"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                    animationDelay: `${0.9 + i * 0.55}s`,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "#fff", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {it.nome}
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                      {it.fornecedor}
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 13, color: "#fff", flexShrink: 0 }}>
                    {it.custo}
                  </span>
                </div>
              ))}
            </div>

            {/* Passo 3 — vira inteligência */}
            <p
              className="vf-el"
              style={{
                fontFamily: "var(--font-roboto-mono)", fontSize: 11, letterSpacing: "0.06em",
                textTransform: "uppercase", color: ACCENT,
                margin: "22px 0 12px", animationDelay: "2.9s",
              }}
            >
              E a inteligência aparece
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Margem com barra que enche */}
              <div
                className="vf-el"
                style={{
                  flex: "1 1 150px", minWidth: 0, padding: "12px 14px", borderRadius: 8,
                  background: "#232325", border: `1px solid ${BORDER}`, animationDelay: "3.2s",
                }}
              >
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>
                  Margem média por drink
                </p>
                <div style={{ height: 8, borderRadius: "var(--r-pill)", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div
                    className="vf-bar"
                    style={{ height: "100%", width: "72%", background: ACCENT, borderRadius: "var(--r-pill)", animationDelay: "3.5s" }}
                  />
                </div>
                <p style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 15, color: "#fff", margin: "8px 0 0" }}>
                  72%
                </p>
              </div>

              {/* CMV */}
              <div
                className="vf-el"
                style={{
                  flex: "1 1 110px", minWidth: 0, padding: "12px 14px", borderRadius: 8,
                  background: "#232325", border: `1px solid ${BORDER}`, animationDelay: "3.5s",
                }}
              >
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>
                  CMV
                </p>
                <p style={{ fontFamily: "var(--font-roboto-mono)", fontSize: 22, color: "#fff", margin: 0, lineHeight: 1 }}>
                  28%
                </p>
              </div>
            </div>

            {/* Alerta — o momento "onde agir" */}
            <div
              className="vf-el"
              style={{
                display: "flex", alignItems: "center", gap: 10, marginTop: 10,
                padding: "12px 14px", borderRadius: 8,
                background: "color-mix(in srgb, #FF3500 12%, transparent)",
                border: "1px solid color-mix(in srgb, #FF3500 35%, transparent)",
                animationDelay: "4.0s",
              }}
            >
              <AlertTriangle style={{ width: 18, height: 18, color: ACCENT, flexShrink: 0 }} strokeWidth={2} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "#fff", lineHeight: 1.35 }}>
                <strong style={{ fontWeight: 600 }}>Gin Tônica caiu 43%</strong> desde sexta. Sem mudança de preço ou estoque.
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
