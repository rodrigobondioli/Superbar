"use client";
import { useState } from "react";
import Image from "next/image";
import { Lines, Reveal, SectionRule } from "@/components/marketing/motion-primitives";

const YELLOW = "#FF3500";
const BG = "#111113";

const FAQS = [
  {
    num: "/1",
    q: "Quanto custa?",
    a: "Uma mensalidade única. Sem módulo à parte, sem taxa de instalação, sem surpresa na fatura. E a mensalidade só começa quando o sistema está rodando no seu bar — no go-live. Você não paga por promessa.",
  },
  {
    num: "/2",
    q: "Quanto tempo leva pra colocar no ar?",
    a: "Um dia. O onboarding guia você pelo cadastro de cardápio, equipe e mesas. No primeiro dia o bar já está operando no SUPERBAR.",
  },
  {
    num: "/3",
    q: "Preciso digitar meu estoque todo?",
    a: "Não. Você sobe a nota fiscal (NF-e) e o SUPERBAR importa produtos, custos e fornecedores automaticamente. O que faltar, você ajusta em segundos. O custo entra junto — que é de onde a margem e o CMV nascem.",
  },
  {
    num: "/4",
    q: "O SUPERBAR processa pagamentos?",
    a: "Não. O sistema registra como o cliente pagou — Pix, dinheiro, débito, crédito ou cortesia. O dinheiro vai direto pra sua maquininha, como sempre foi. A gente não toca no caixa do bar.",
  },
  {
    num: "/5",
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem multa, sem contrato de fidelidade. Se o SUPERBAR não entregar valor, você sai. O lock-in tem que vir do produto, não do contrato.",
  },
  {
    num: "/6",
    q: "Funciona para o meu bar?",
    a: "O SUPERBAR entrega mais valor onde a operação tem complexidade: bartender, garçom e caixa trabalhando ao mesmo tempo, comanda aberta por horas, drinks com variantes, volume alto no fim de semana. Se você tem equipe operando separada e quer saber o que sobra no final da noite — é pra você.",
  },
];

function FaqItem({ faq, initialOpen = false }: { faq: (typeof FAQS)[0]; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="sb-faq-item" style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 text-left md:py-6"
        style={{ background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="flex items-baseline gap-3 text-balance md:gap-4">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                fontWeight: 400,
                color: YELLOW,
                lineHeight: 1,
                letterSpacing: "0.02em",
                flexShrink: 0,
              }}
            >
              {faq.num}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(1.0625rem, 2.5vw, 1.375rem)",
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: 1.15,
              }}
            >
              {faq.q}
            </span>
          </span>
          <span
            className="sb-faq-plus"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: YELLOW,
              lineHeight: 1,
              flexShrink: 0,
              userSelect: "none",
              display: "inline-block",
              transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
              transform: open ? "rotate(45deg)" : "rotate(0deg)",
            }}
          >
            +
          </span>
        </div>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p
            className="text-pretty"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.7,
              padding: "0 0 24px",
              maxWidth: "680px",
            }}
          >
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="py-14 md:py-[120px]" style={{ background: BG }}>
      <style>{`
        @keyframes faq-float {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50%       { transform: translateY(-14px) rotate(-4deg); }
        }
        .sb-faq-item { transition: background 0.35s ease; }
        .sb-faq-item:hover { background: rgba(255,255,255,0.025); }
        @media (prefers-reduced-motion: reduce) {
          .sb-faq-item, .sb-faq-plus { transition: none !important; }
        }
      `}</style>

      <SectionRule num="05" label="Perguntas" className="mb-10 md:mb-14" />

      <div className="page-x">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:gap-24">

          {/* Left */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 400,
                color: "#ffffff",
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                lineHeight: 0.82,
                marginBottom: "1rem",
              }}
            >
              <Lines lines={[<span key="l1">Perguntas</span>, <span key="l2">frequentes</span>]} />
            </h2>
            <Reveal delay={0.2} y={16}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                  marginBottom: "1rem",
                  maxWidth: "280px",
                }}
              >
                As dúvidas mais comuns. O que faltar, a gente conversa quando olhar seu bar.
              </p>
            </Reveal>
            {/* Ice cube hidden on mobile to save space */}
            <div className="hidden lg:block" style={{ animation: "faq-float 3.5s ease-in-out infinite", marginTop: "48px" }}>
              <Image src="/img-lp/cubo-gelo.png" alt="" width={180} height={180} />
            </div>
          </div>

          {/* Right: accordion */}
          <div>
            {FAQS.map((faq, i) => (
              <Reveal key={faq.num} delay={i * 0.07} y={20}>
                <FaqItem faq={faq} initialOpen={i === 0} />
              </Reveal>
            ))}
            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }} />
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
