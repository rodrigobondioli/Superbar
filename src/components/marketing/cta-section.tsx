"use client";

import { ArrowRight } from "lucide-react";
import { useComandaModal } from "@/components/comanda-modal";

const TOP = "M 0,0 L 40,20 L 80,0 L 120,20 L 160,0 L 200,20 L 240,0 L 280,20 L 320,0 L 360,20 L 400,0 L 440,20 L 480,0 L 520,20 L 560,0 L 600,20 L 640,0 L 680,20 L 720,0 L 760,20 L 800,0 L 840,20 L 880,0 L 920,20 L 960,0 L 1000,20 L 1040,0 L 1080,20 L 1120,0 L 1160,20 L 1200,0 L 1240,20 L 1280,0 L 1320,20 L 1360,0 L 1400,20 L 1440,0 Z";
const BOT = "M 0,20 L 40,0 L 80,20 L 120,0 L 160,20 L 200,0 L 240,20 L 280,0 L 320,20 L 360,0 L 400,20 L 440,0 L 480,20 L 520,0 L 560,20 L 600,0 L 640,20 L 680,0 L 720,20 L 760,0 L 800,20 L 840,0 L 880,20 L 920,0 L 960,20 L 1000,0 L 1040,20 L 1080,0 L 1120,20 L 1160,0 L 1200,20 L 1240,0 L 1280,20 L 1320,0 L 1360,20 L 1400,0 L 1440,20 Z";

export function CtaSection() {
  const { open } = useComandaModal();

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden py-28 md:min-h-[80vh] md:py-0"
      style={{ background: "#0A0A0B" }}
    >
      {/* Serrilhado topo */}
      <div className="absolute left-0 right-0 top-0" style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 20" preserveAspectRatio="none" className="w-full" style={{ height: 20, display: "block" }}>
          <path d={TOP} fill="#111113" />
        </svg>
      </div>

      {/* Serrilhado base */}
      <div className="absolute bottom-0 left-0 right-0" style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 20" preserveAspectRatio="none" className="w-full" style={{ height: 20, display: "block" }}>
          <path d={BOT} fill="#111113" />
        </svg>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center md:px-8 lg:px-14">
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(1.25rem, 3.5vw, 3.25rem)",
            color: "#ffffff",
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
            color: "#ffffff",
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
            fontSize: "1.25rem",
            fontWeight: 400,
            color: "#ffffff",
            marginBottom: "2rem",
          }}
        >
          Da operação ao lucro, em tempo real.
        </p>

        <button
          onClick={open}
          className="inline-flex cursor-pointer items-center gap-3 rounded-full px-8 py-4 text-sm font-bold transition hover:opacity-90"
          style={{
            background: "#F59E0B",
            color: "#000000",
            fontFamily: "var(--font-roboto-mono)",
            border: "none",
            minHeight: "44px",
          }}
        >
          Quero meu Superbar <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
