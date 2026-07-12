"use client";

import { ArrowRight } from "lucide-react";
import { useComandaModal } from "@/components/comanda-modal";
import { Magnetic } from "@/components/marketing/motion-primitives";

interface CTAButtonProps {
  label?: string;
  className?: string;
  /** Inverte pra preto (uso sobre fundo laranja, ex.: CTA final) */
  variant?: "orange" | "black";
}

export function CTAButton({
  label = "Agendar demonstração",
  className = "",
  variant = "orange",
}: CTAButtonProps) {
  const { open } = useComandaModal();
  const isBlack = variant === "black";

  return (
    <Magnetic>
      <style>{`
        .sb-cta:hover { transform: scale(1.04); box-shadow: 0 8px 32px rgba(255,53,0,0.35); }
        .sb-cta:active { transform: scale(0.97); }
        .sb-cta .sb-cta-arrow { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .sb-cta:hover .sb-cta-arrow { transform: translateX(4px); }
        @media (prefers-reduced-motion: reduce) {
          .sb-cta, .sb-cta .sb-cta-arrow { transition: none !important; }
        }
      `}</style>
      <button
        onClick={open}
        className={`sb-cta group inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-8 py-4 text-sm font-bold ${className}`}
        style={{
          background: isBlack ? "#000000" : "#FF3500",
          color: isBlack ? "#ffffff" : "#000000",
          fontFamily: "var(--font-roboto-mono)",
          border: "none",
          minHeight: 44,
          transition:
            "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease",
        }}
      >
        {label}
        <ArrowRight className="sb-cta-arrow h-4 w-4" />
      </button>
    </Magnetic>
  );
}
