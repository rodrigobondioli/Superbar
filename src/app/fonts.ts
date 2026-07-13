import { Londrina_Solid } from "next/font/google";

/* Fonte display do SUPERBAR — Londrina Solid (Google Fonts, OFL).
   EXCEÇÃO documentada no DESIGN.md: a display vive na landing e nas telas de
   ENTRADA (login, cadastro, recuperar/nova senha, convite, onboarding) — o
   primeiro contato com a marca. O dashboard/app continua 100% Inter.
   Aplicar via `className={londrina.variable}` no wrapper e usar
   `fontFamily: "var(--font-londrina)"` (ou --font-display) nos títulos. */
export const londrina = Londrina_Solid({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-londrina",
  display: "swap",
});
