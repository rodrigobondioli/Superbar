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
  { title: "Margem invisível", desc: "Você sabe quanto vendeu. O lucro real continua escondido." },
  { title: "Faturamento atrasado", desc: "O dia fechou e os números chegam só na manhã seguinte." },
  { title: "Info presa na equipe", desc: "Quer saber o que rolou? Tem que perguntar pro bartender." },
];

const doresRight = [
  { title: "Sistema para no pico", desc: "Sexta lotada. O sistema trava justamente quando o bar enche." },
  { title: "Decisão sem direção", desc: "Você sente que algo está errado, mas não sabe onde agir." },
  { title: "Ganho escondido", desc: "Produtos lucrativos passam despercebidos todos os dias." },
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
        className="relative flex min-h-dvh w-full flex-col items-center justify-center page-x text-center"
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
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: "860px",
          }}
        >
          <span className="md:block">O primeiro sistema criado para mostrar o lucro real do seu bar.</span>
          <span className="md:block"> Veja margem, CMV e oportunidades em tempo real. Menos relatórios e mais decisões.</span>
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center">
          <CTAButton />
        </div>
      </section>

      {/* ─── DORES ─────────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-[120px]">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-4xl page-x md:mb-16 md:text-center">
          <h2
            className="mb-4 text-white text-balance md:mb-5 lg:whitespace-nowrap"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: "clamp(1.75rem, 8vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Onde o dinheiro do seu bar vaza?
          </h2>
          <p
            className="text-balance"
            style={{
              color: "#ffffff",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              lineHeight: 1.5,
            }}
          >
            Você vende todos os dias. O problema é descobrir tarde demais onde o dinheiro está vazando.
          </p>
        </div>

        {/* Grid: mobile = 1 col (mascote entre os cards), desktop = 3 col */}
        <div className="mx-auto max-w-[1440px] page-x">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px_1fr] lg:items-center lg:gap-x-8">

            {/* Left cards */}
            <div className="flex flex-col gap-4 lg:gap-5">
              {doresLeft.map((item) => (
                <div key={item.title} className="rounded-2xl p-5 md:p-7" style={{ background: "#1C1C1E", border: "1px solid #2C2C2E" }}>
                  <p
                    className="mb-3 md:mb-4"
                    style={{ color: "#FF3500", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(1.125rem, 3vw, 1.375rem)", lineHeight: 1.2 }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="leading-relaxed text-balance"
                    style={{ color: "#ffffff", fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 16 }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Mascote — coqueteleira vazando. Mobile: abre a seção (order-first,
                antes dos cards) no mesmo tamanho da coqueteleira da DonoSection
                (max-w-280). Desktop: volta pro meio das duas colunas (coluna cheia). */}
            <div className="order-first mb-4 flex justify-center lg:order-none lg:mb-0">
              <div className="w-full max-w-[280px] lg:max-w-full">
                <Image
                  src="/img-lp/coquetelaria-vazando.png"
                  alt="Coqueteleira vazando"
                  width={420}
                  height={660}
                  className="w-full"
                />
              </div>
            </div>

            {/* Right cards */}
            <div className="flex flex-col gap-4 lg:gap-5">
              {doresRight.map((item) => (
                <div key={item.title} className="rounded-2xl p-5 md:p-7" style={{ background: "#1C1C1E", border: "1px solid #2C2C2E" }}>
                  <p
                    className="mb-3 md:mb-4"
                    style={{ color: "#FF3500", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(1.125rem, 3vw, 1.375rem)", lineHeight: 1.2 }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="leading-relaxed text-balance"
                    style={{ color: "#ffffff", fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 16 }}
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
        <div className="mx-auto max-w-[1440px] page-x">
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
                className="mb-8 text-white text-balance md:mb-10"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "clamp(1.375rem, 5.5vw, 2rem)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
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
                      className="h-5 w-5 flex-shrink-0"
                      style={{ color: "#FF3500" }}
                      strokeWidth={2.5}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 400,
                        fontSize: 16,
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
          className="flex flex-col items-center gap-0 page-x py-6 text-center md:flex-row md:items-center md:justify-between md:py-6 md:text-left"
        >
          <span
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontSize: "0.75rem",
              color: "#ffffff",
              lineHeight: 1.5,
              paddingBottom: "0.75rem",
            }}
            className="w-full pb-3 md:w-auto md:pb-0 border-b border-white/20 md:border-0"
          >
            Superbar — Uma plataforma que roda a operação do seu bar em tempo real e transforma cada dado em decisão.
          </span>
          <span
            style={{
              fontFamily: "var(--font-roboto-mono)",
              fontSize: "0.75rem",
              color: "#ffffff",
              flexShrink: 0,
              paddingTop: "0.75rem",
            }}
            className="w-full pt-3 md:w-auto md:pt-0"
          >
            Copyright © 2026. Superbar. Todos os direitos Reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
