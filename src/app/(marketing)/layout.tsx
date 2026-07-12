import localFont from "next/font/local";
import { SiteNav } from "@/components/marketing/site-nav";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { Grain } from "@/components/marketing/motion-primitives";
import { ComandaModalProvider } from "@/components/comanda-modal";

/* Fonte display — EXCEÇÃO documentada no DESIGN.md: display só na landing.
   Peperoncino Sans Regular (Resistenza) via next/font/local.
   ATENÇÃO: licença webfont (MyFonts, 1 domínio) deve estar comprada antes
   de qualquer deploy em produção. O app inteiro continua 100% Inter. */
const peperoncino = localFont({
  src: "../../fonts/PeperoncinoSans-Regular.woff",
  weight: "400",
  variable: "--font-peperoncino",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={peperoncino.variable}
      style={{
        ["--font-display" as string]: "var(--font-peperoncino)",
        /* Corta vazamentos horizontais (máscaras com margem negativa,
           marquee, splash) sem quebrar position: sticky — por isso
           "clip" e não "hidden". */
        overflowX: "clip",
      }}
    >
      <ComandaModalProvider>
        <SmoothScroll />
        <Grain />
        <SiteNav />
        <main>{children}</main>
      </ComandaModalProvider>
    </div>
  );
}
