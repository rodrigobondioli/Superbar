import { Londrina_Solid } from "next/font/google";
import { SiteNav } from "@/components/marketing/site-nav";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { Grain } from "@/components/marketing/motion-primitives";
import { ComandaModalProvider } from "@/components/comanda-modal";

/* Fonte display — EXCEÇÃO documentada no DESIGN.md: display só na landing.
   Londrina Solid (Google Fonts, OFL — sem pendência de licença).
   O app inteiro continua 100% Inter. */
const londrina = Londrina_Solid({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-londrina",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={londrina.variable}
      style={{
        ["--font-display" as string]: "var(--font-londrina)",
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
