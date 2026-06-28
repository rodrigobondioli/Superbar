import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { TextRevealSection } from "@/components/marketing/text-reveal";
import { CTAButton } from "@/components/marketing/cta-button";
import { ParallaxScene } from "@/components/marketing/parallax-scene";
import { ProcessoSection } from "@/components/marketing/processo-section";
import { DonoSection } from "@/components/marketing/dono-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { ContactSection } from "@/components/marketing/contact-section";

const doresLeft = [
  { title: "Margem Invisível", desc: "Você sabe quanto vendeu. O lucro real continua escondido." },
  { title: "Faturamento Atrasado", desc: "O dia fechou e os números chegam só na manhã seguinte." },
  { title: "Info Presa na Equipe", desc: "Quer saber o que rolou? Tem que perguntar pro bartender." },
];

const doresRight = [
  { title: "Sistema Para no Pico", desc: "Sexta lotada. O sistema trava justamente quando o bar enche." },
  { title: "Decisão Sem Direção", desc: "Você sente que algo está errado, mas não sabe onde agir." },
  { title: "Ganho Escondido", desc: "Produtos lucrativos passam despercebidos todos os dias." },
];

const paraVoce = [
  'Já ouviu "vamos resolver na implantação". E nada mudou.',
  "Abre cinco relatórios e continua sem resposta.",
  "Recebe números. Mas não recebe decisões.",
  "Quer um copiloto. Não mais um painel.",
  "Cansou de usar sistema de restaurante adaptado para bar.",
];

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  if (host.startsWith("app.")) redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "#111113", color: "#FFFFFF" }}>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[calc(100dvh-96px)] w-full flex-col items-center justify-center px-4 text-center md:min-h-dvh md:px-8 lg:px-14"
        style={{ background: "linear-gradient(to bottom, #0A0A0B 0%, #111113 100%)" }}
      >
        {/* Badge */}
        <div
          className="mb-6 inline-flex items-center rounded-full px-4 py-2 text-xs text-white/80 md:mb-8 md:px-5 md:text-sm"
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: "var(--font-roboto-mono)",
            letterSpacing: "0.04em",
          }}
        >
          Inteligência operacional para donos de bar
        </div>

        {/* H1 */}
        <h1
          className="mb-5 text-white text-balance md:mb-6"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 8vw, 72px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          <span className="block">Seu bar está ganhando</span>
          <span className="block">dinheiro ou só vendendo mais?</span>
        </h1>

        {/* Subtitle */}
        <p
          className="mb-8 text-center md:mb-10"
          style={{
            color: "#ffffff",
            fontFamily: "var(--font-sans)",
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: "860px",
          }}
        >
          <span className="block">O primeiro sistema criado para mostrar o lucro real do seu bar.</span>
          <span className="block">Veja margem, CMV e oportunidades em tempo real. Menos relatórios e mais decisões.</span>
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center">
          <CTAButton />
        </div>
      </section>

      {/* ─── DORES ─────────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-[120px]">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-4xl px-4 md:mb-16 md:px-8 md:text-center lg:px-14">
          <h2
            className="mb-4 uppercase text-white text-balance md:mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(1.375rem, 4vw, 2.5rem)",
              lineHeight: 1.05,
              letterSpacing: "0.08em",
            }}
          >
            Onde o dinheiro do seu bar vaza?
          </h2>
          <p
            className="text-pretty"
            style={{
              color: "#ffffff",
              fontFamily: "var(--font-roboto-mono)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            Você vende todos os dias. O problema é descobrir tarde demais onde o dinheiro está vazando.
          </p>
        </div>

        {/* Grid: mobile = 1 col (mascote hidden), desktop = 3 col */}
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-14">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px_1fr] lg:items-center lg:gap-x-8">

            {/* Left cards */}
            <div className="flex flex-col gap-4 lg:gap-5">
              {doresLeft.map((item) => (
                <div key={item.title} className="rounded-2xl p-5 md:p-7" style={{ background: "#1C1C1E", border: "1px solid #2C2C2E" }}>
                  <p
                    className="mb-3 uppercase text-balance md:mb-4"
                    style={{ color: "#F59E0B", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1rem", letterSpacing: "0.08em" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="leading-relaxed text-pretty"
                    style={{ color: "#ffffff", fontFamily: "var(--font-roboto-mono)", fontSize: "0.875rem" }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Mascote — hidden on mobile */}
            <div className="hidden items-center justify-center lg:flex">
              <Image
                src="/img-lp/coquetelaria-vazando.png"
                alt="Coqueteleira vazando"
                width={420}
                height={660}
                className="w-full"
              />
            </div>

            {/* Right cards */}
            <div className="flex flex-col gap-4 lg:gap-5">
              {doresRight.map((item) => (
                <div key={item.title} className="rounded-2xl p-5 md:p-7" style={{ background: "#1C1C1E", border: "1px solid #2C2C2E" }}>
                  <p
                    className="mb-3 uppercase text-balance md:mb-4"
                    style={{ color: "#F59E0B", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1rem", letterSpacing: "0.08em" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="leading-relaxed text-pretty"
                    style={{ color: "#ffffff", fontFamily: "var(--font-roboto-mono)", fontSize: "0.875rem" }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TEXT REVEAL ───────────────────────────────────────────────────── */}
      <TextRevealSection />

      {/* ─── PARA QUEM É ──────────────────────────────────────────────────── */}
      <section id="produto" className="py-10 md:py-[120px]">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-14">
          <div className="grid grid-cols-1 gap-10 lg:items-stretch lg:gap-20 lg:grid-cols-[1fr_2fr]">

            {/* Foto */}
            <div className="relative h-[260px] overflow-hidden rounded-2xl lg:h-full">
              <Image
                src="/img-lp/foto-drink1.png"
                alt="Bartender com drink"
                fill
                className="object-cover object-center"
              />
            </div>

            {/* Conteúdo */}
            <div>
              <h2
                className="mb-8 uppercase text-white text-balance md:mb-10"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(1.25rem, 3.5vw, 2rem)",
                  letterSpacing: "0.08em",
                  lineHeight: 1.1,
                }}
              >
                O Superbar é para você que:
              </h2>

              <ul className="mb-8 flex flex-col md:mb-10">
                {paraVoce.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 py-5 md:gap-4 md:py-7"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <Check
                      className="h-4 w-4 flex-shrink-0 md:h-5 md:w-5"
                      style={{ color: "#F59E0B" }}
                      strokeWidth={2.5}
                    />
                    <span
                      className="text-pretty"
                      style={{
                        fontFamily: "var(--font-roboto-mono)",
                        fontSize: "clamp(0.8125rem, 2.5vw, 1rem)",
                        color: "#ffffff",
                        lineHeight: 1.5,
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <CTAButton />
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARALLAX SCENE ───────────────────────────────────────────────── */}
      <ParallaxScene />

      {/* ─── PROCESSO ─────────────────────────────────────────────────────── */}
      <ProcessoSection />

      {/* ─── DONO MÉDIO vs DONO INTELIGENTE ───────────────────────────────── */}
      <DonoSection />

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────── */}
      <CtaSection />

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ─── CONTATO FINAL ─────────────────────────────────────────────────── */}
      <ContactSection />

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "#111113" }}>
        <div
          className="flex flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-6 lg:px-14"
        >
          <span
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontSize: "0.75rem",
              color: "#ffffff",
              lineHeight: 1.5,
            }}
          >
            SUPERBAR — Uma plataforma que roda a operação do seu bar em tempo real e transforma cada dado em decisão.
          </span>
          <span
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}
          >
            Copyright © 2026. Superbar. Todos os direitos Reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
