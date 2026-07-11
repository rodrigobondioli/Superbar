"use client";

import { ArrowRight } from "lucide-react";
import { useComandaModal } from "@/components/comanda-modal";

// Onda suave (superfície de líquido) só no TOPO. Curvas Q/T alternando cristas e
// vales em torno da base (y=20), amplitude ~12. Path com DOIS ciclos (0→2880) pra
// a animação deslizar meia largura (1440 = 6 ondas) e voltar sem emenda.
const TOP = "M0,0 L0,20 Q60,8 120,20 T240,20 T360,20 T480,20 T600,20 T720,20 T840,20 T960,20 T1080,20 T1200,20 T1320,20 T1440,20 T1560,20 T1680,20 T1800,20 T1920,20 T2040,20 T2160,20 T2280,20 T2400,20 T2520,20 T2640,20 T2760,20 T2880,20 L2880,0 Z";

export function CtaSection() {
  const { open } = useComandaModal();

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden py-28 md:min-h-[80vh] md:py-0"
      style={{ background: "#FF3500" }}
    >
      {/* Onda líquida animada — só no topo (base fica reta). O SVG tem o dobro da
          largura e desliza -50% em loop: balanço contínuo, sem emenda. */}
      <style>{`
        @keyframes ctaOndaSlosh { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .cta-onda { animation: none !important; } }
      `}</style>
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

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center md:px-8 lg:px-14">
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            fontSize: "clamp(1.25rem, 3.5vw, 3.25rem)",
            color: "#000000",
            lineHeight: 1.05,
            marginBottom: "8px",
          }}
        >
          Seu bar ficou super
        </p>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "clamp(3rem, 10vw, 9rem)",
            color: "#000000",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
            marginBottom: "1.5rem",
          }}
        >
          Inteligente.
        </p>

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

        <button
          onClick={open}
          className="inline-flex cursor-pointer items-center gap-3 rounded-full px-8 py-4 text-sm font-bold transition hover:opacity-90"
          style={{
            background: "#000000",
            color: "#ffffff",
            fontFamily: "var(--font-roboto-mono)",
            border: "none",
            minHeight: "44px",
          }}
        >
          Agendar demonstração <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
