import type { Viewport } from "next";
import { ConexaoBanner } from "@/components/ui/conexao-banner";

// Telas de toque rápido: sem pinch-zoom (evita zoom acidental no pico). O root
// permite zoom no resto (menu do cliente, dashboard, landing) — WCAG 1.4.4.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Layout raiz das telas operacionais (bartender, caixa, garçom, produção).
 * Monta o banner de conexão uma única vez para todas elas.
 */
export default function OperacionalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ConexaoBanner />
      {children}
    </>
  );
}
