import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { HeroSection } from "@/components/marketing/hero-section";
import { CTAButton } from "@/components/marketing/cta-button";
import {
  Reveal,
  Lines,
  SectionRule,
} from "@/components/marketing/motion-primitives";
import { TextRevealSection } from "@/components/marketing/text-reveal";
import { ParallaxScene } from "@/components/marketing/parallax-scene";
import { ProcessoSection } from "@/components/marketing/processo-section";
import { VejaFuncionandoSection } from "@/components/marketing/veja-funcionando-section";
import { DiferenciaisSection } from "@/components/marketing/diferenciais-section";
import { DonoSection } from "@/components/marketing/dono-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { ContactSection } from "@/components/marketing/contact-section";
import { FooterSection } from "@/components/marketing/footer-section";

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
  "Cansou de sistema de restaurante adaptado para bar.",
];

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  if (host.startsWith("app.")) redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "#111113", color: "#FFFFFF" }}>
      {/* sistema de linhas da landing */}
      <style>{`
        .sb-dore { border-top: 1px dashed rgba(255,255,255,0.25); }
        .sb-row .sb-row-arrow { opacity: 0; }
      `}</style>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ─── DORES ─────────────────────────────────────────────────────────── */}
      <section className="pb-10 pt-6 md:pb-[120px] md:pt-8">
        <SectionRule num="01" label="Onde vaza" />

        {/* Header — título cartaz à esquerda, subtítulo na direita */}
        <div className="page-x mb-10 pt-10 md:mb-16 md:pt-14">
        <div className="mx-auto max-w-[1440px] md:flex md:items-end md:justify-between md:gap-12">
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(2.25rem, 6.25vw, 6rem)",
              lineHeight: 0.82,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              maxWidth: "18ch",
            }}
          >
            <Lines
              lines={[
                <span key="l1">Onde o dinheiro</span>,
                <span key="l2">
                  do seu bar <span style={{ color: "#FF3500" }}>vaza?</span>
                </span>,
              ]}
            />
          </h2>
          <Reveal delay={0.25} y={20} className="md:flex-shrink-0 md:self-end">
            <p
              className="mt-6 text-balance md:mt-0 md:pb-2"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "var(--font-sans)",
                fontWeight: 400,
                fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
                lineHeight: 1.55,
                maxWidth: 400,
              }}
            >
              Você vende todos os dias. O problema é descobrir tarde demais
              onde o dinheiro está vazando.
            </p>
          </Reveal>
        </div>
        </div>

        {/* Grid: mobile = 1 col (mascote abre a seção), desktop = 3 col
            Dores como LINHAS numeradas — mesma linguagem gráfica da página. */}
        <div className="page-x">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(380px,460px)_1fr] lg:items-center lg:gap-x-12">
            {/* Coluna esquerda — /1 a /3 */}
            <div className="flex flex-col">
              {doresLeft.map((item, i) => (
                <Reveal key={item.title} delay={i * 0.1}>
                  <div className="sb-dore py-6 md:py-7">
                    <p
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-roboto-mono)",
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        color: "#FF3500",
                      }}
                    >
                      /{i + 1}
                    </p>
                    <p
                      className="sb-dore-title mb-2"
                      style={{ color: "#ffffff", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(1.25rem, 2vw, 1.5rem)", lineHeight: 1.15, letterSpacing: "-0.01em" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-pretty"
                      style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 15.5, lineHeight: 1.55 }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
              {/* linha de fechamento — só no desktop; no mobile a coluna
                  seguinte já abre com a própria régua (evita linha dupla) */}
              <div className="sb-dore hidden lg:block" style={{ height: 0 }} />
            </div>

            {/* Mascote — coqueteleira vazando, protagonista */}
            <div className="order-first flex justify-center lg:order-none">
              <Reveal delay={0.1} y={56} className="flex w-full justify-center">
                <div className="w-full max-w-[320px] lg:max-w-[460px]">
                  <Image
                    src="/img-lp/coquetelaria-vazando.png"
                    alt="Coqueteleira vazando"
                    width={564}
                    height={710}
                    className="w-full"
                  />
                </div>
              </Reveal>
            </div>

            {/* Coluna direita — /4 a /6 */}
            <div className="flex flex-col">
              {doresRight.map((item, i) => (
                <Reveal key={item.title} delay={i * 0.1 + 0.05}>
                  <div className="sb-dore py-6 md:py-7">
                    <p
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-roboto-mono)",
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        color: "#FF3500",
                      }}
                    >
                      /{i + 4}
                    </p>
                    <p
                      className="sb-dore-title mb-2"
                      style={{ color: "#ffffff", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(1.25rem, 2vw, 1.5rem)", lineHeight: 1.15, letterSpacing: "-0.01em" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-pretty"
                      style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 15.5, lineHeight: 1.55 }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
              <div className="sb-dore" style={{ height: 0 }} />
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ─── TEXT REVEAL ───────────────────────────────────────────────────── */}
      <TextRevealSection />

      {/* ─── PARA QUEM É ──────────────────────────────────────────────────── */}
      <section id="produto" className="py-10 md:py-[100px]">
        <SectionRule num="02" label="Pra quem é" />

        <div className="page-x pt-10 md:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-10 lg:items-stretch lg:gap-20 lg:grid-cols-[1fr_2fr]">
            {/* Foto */}
            <Reveal y={48} className="relative h-[260px] overflow-hidden rounded-2xl lg:h-auto">
              <div className="relative h-full min-h-[260px] w-full">
                <Image
                  src="/img-lp/foto-drink1.png"
                  alt="Bartender com drink"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </Reveal>

            {/* Conteúdo */}
            <div>
              <h2
                className="mb-8 text-white md:mb-10"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
                  lineHeight: 0.82,
                  letterSpacing: "0.01em",
                  textTransform: "uppercase",
                }}
              >
                <Lines
                  lines={[
                    <span key="l1">O Superbar é</span>,
                    <span key="l2">
                      pra <span style={{ color: "#FF3500" }}>você</span> que:
                    </span>,
                  ]}
                />
              </h2>

              <div className="mb-8 flex flex-col md:mb-10">
                {paraVoce.map((item, i) => (
                  <Reveal key={item} delay={i * 0.08} y={20}>
                    <div
                      className="sb-row flex items-center gap-4 py-5 md:gap-6 md:py-6"
                      style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }}
                    >
                      <span
                        className="flex-shrink-0"
                        style={{
                          fontFamily: "var(--font-roboto-mono)",
                          fontSize: 13,
                          color: "#FF3500",
                          letterSpacing: "0.04em",
                        }}
                      >
                        /{i + 1}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontWeight: 400,
                          fontSize: "clamp(1rem, 2vw, 1.25rem)",
                          color: "#ffffff",
                          lineHeight: 1.5,
                        }}
                      >
                        {item}
                      </span>
                      <span
                        className="sb-row-arrow ml-auto hidden md:inline"
                        aria-hidden="true"
                        style={{ color: "#FF3500", fontSize: 20 }}
                      >
                        →
                      </span>
                    </div>
                  </Reveal>
                ))}
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.25)" }} />
              </div>

              <Reveal delay={0.2}>
                <CTAButton />
              </Reveal>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ─── PARALLAX / MARQUEE ───────────────────────────────────────────── */}
      <ParallaxScene />

      {/* ─── PROCESSO ─────────────────────────────────────────────────────── */}
      <div id="processo">
        <ProcessoSection />
      </div>

      {/* ─── VEJA FUNCIONANDO (animação Da nota ao lucro) ─────────────────── */}
      <div id="tela">
        <VejaFuncionandoSection />
      </div>

      {/* ─── DIFERENCIAIS (por que o Superbar) ────────────────────────────── */}
      <DiferenciaisSection />

      {/* ─── DONO MÉDIO vs DONO INTELIGENTE ───────────────────────────────── */}
      <DonoSection />

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────── */}
      <CtaSection />

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <div id="faq">
        <FaqSection />
      </div>

      {/* ─── CONTATO FINAL ─────────────────────────────────────────────────── */}
      <div id="contato">
        <ContactSection />
      </div>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <FooterSection />
    </div>
  );
}
