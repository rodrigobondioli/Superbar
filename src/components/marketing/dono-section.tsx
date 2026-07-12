import Image from "next/image";
import { CircleScribble, Lines, Reveal } from "@/components/marketing/motion-primitives";

export function DonoSection() {
  return (
    <section
      className="flex flex-col justify-center py-16 md:py-[140px]"
      style={{ background: "#111113" }}
    >
      <div className="page-x">
      <div className="mx-auto max-w-[1440px]">
        {/* Grid — mascote + texto */}
        <div className="mx-auto mb-8 grid max-w-[1180px] grid-cols-1 items-center gap-6 md:mb-16 md:gap-10 lg:grid-cols-[460px_1fr] lg:gap-16">
          {/* Mascote */}
          <Reveal y={48}>
            <div className="mx-auto w-full max-w-[320px] lg:max-w-full">
              <Image
                src="/img-lp/coquetelaria-remendo2.png"
                alt="Mascote Superbar"
                width={540}
                height={723}
                className="w-full"
              />
            </div>
          </Reveal>

          {/* Texto — cartaz com contraste */}
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.25rem, 5.5vw, 5rem)",
              fontWeight: 400,
              lineHeight: 0.82,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
            }}
          >
            <Lines
              stagger={0.12}
              lines={[
                <span key="a" style={{ color: "rgba(255,255,255,0.45)" }}>
                  O dono médio procura
                </span>,
                <span key="b" style={{ color: "rgba(255,255,255,0.45)" }}>
                  mais clientes.
                </span>,
                <span key="c">O dono inteligente</span>,
                <span key="d">
                  procura mais{" "}
                  <span style={{ position: "relative", display: "inline-block" }}>
                    margem.
                    <CircleScribble delay={1.2} />
                  </span>
                </span>,
              ]}
            />
          </h2>
        </div>

        {/* Subtítulo centralizado */}
        <Reveal delay={0.2} y={20}>
          <p
            className="text-balance md:text-center"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Você não precisa vender o dobro. Precisa enxergar melhor. Quando as
            decisões melhoram, o resultado melhora junto.
          </p>
        </Reveal>
      </div>
      </div>
    </section>
  );
}
