"use client";

import Image from "next/image";
import { CTAButton } from "@/components/marketing/cta-button";
import { Lines, Reveal } from "@/components/marketing/motion-primitives";

export function ContactSection() {
  return (
    <section
      className="flex items-center justify-center py-24 md:min-h-[85vh] md:py-0"
      style={{ background: "#111113" }}
    >
      <div className="flex flex-col items-center gap-8 page-x text-center">
        <Reveal y={40}>
          <Image
            src="/img-lp/hands.png"
            alt=""
            width={220}
            height={160}
            style={{ objectFit: "contain" }}
          />
        </Reveal>

        <h2
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 7vw, 7rem)",
            fontWeight: 400,
            letterSpacing: "0.01em",
            textTransform: "uppercase",
            lineHeight: 0.82,
            margin: 0,
          }}
        >
          <Lines
            lines={[
              <span key="l1">Vamos conversar</span>,
              <span key="l2">
                sobre o <span style={{ color: "#FF3500" }}>seu bar?</span>
              </span>,
            ]}
          />
        </h2>

        <Reveal delay={0.3} y={20}>
          <CTAButton />
        </Reveal>
      </div>
    </section>
  );
}
