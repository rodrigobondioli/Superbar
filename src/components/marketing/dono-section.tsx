import Image from "next/image";

export function DonoSection() {
  return (
    <section
      className="flex flex-col justify-center py-10 md:py-[120px]"
      style={{ background: "#111113" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-14">

        {/* Grid — mascote + texto */}
        <div className="mx-auto mb-6 grid max-w-[900px] grid-cols-1 items-center gap-6 md:mb-20 md:gap-10 lg:grid-cols-[420px_1fr] lg:gap-16">

          {/* Mascote — limited height on mobile */}
          <div className="mx-auto w-full max-w-[280px] lg:max-w-full">
            <Image
              src="/img-lp/coquetelaria-remendo.png"
              alt="Mascote Superbar"
              width={420}
              height={660}
              className="w-full"
            />
          </div>

          {/* Texto */}
          <div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 48,
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: "1.5rem",
              }}
            >
              O dono médio procura mais clientes.
            </h2>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 48,
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              O dono inteligente procura mais margem.
            </h2>
          </div>
        </div>

        {/* Subtítulo centralizado */}
        <p
          className="text-balance md:text-center"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            fontSize: 20,
            color: "#ffffff",
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          Você não precisa vender o dobro. Precisa enxergar melhor.
          {" "}Quando as decisões melhoram, o resultado melhora junto.
        </p>
      </div>
    </section>
  );
}
