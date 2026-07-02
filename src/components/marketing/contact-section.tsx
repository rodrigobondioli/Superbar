"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useComandaModal } from "@/components/comanda-modal";

export function ContactSection() {
  const { open } = useComandaModal();

  return (
    <section
      className="flex items-center justify-center py-20 md:min-h-[80vh] md:py-0"
      style={{ background: "#111113" }}
    >
      <div className="flex flex-col items-center gap-8 px-4 text-center">
        <Image
          src="/img-lp/hands.png"
          alt=""
          width={220}
          height={160}
          style={{ objectFit: "contain" }}
        />

        <h2
          className="text-balance"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(1.375rem, 5.5vw, 2rem)",
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Vamos conversar<br />sobre o seu bar?
        </h2>

        <button
          onClick={open}
          className="inline-flex cursor-pointer items-center gap-3 rounded-full px-8 py-4 text-sm font-bold transition hover:opacity-90"
          style={{
            background: "#FF3500",
            color: "#000000",
            fontFamily: "var(--font-roboto-mono)",
            border: "none",
          }}
        >
          Agende uma consulta grátis <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
