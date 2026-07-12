import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmHost } from "@/components/ui/confirm-dialog";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SUPERBAR — Seu Bar Mais Inteligente",
  description: "Plataforma de gestão inteligente para bares. Operação em tempo real, CMV, margem e decisões — tudo num painel feito exclusivamente para bar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Superbar",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "SUPERBAR — Seu Bar Mais Inteligente",
    description: "Plataforma de gestão inteligente para bares. Operação em tempo real, CMV, margem e decisões — tudo num painel feito exclusivamente para bar.",
    url: "https://superbar.com.br",
    siteName: "Superbar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Superbar — Seu bar ficou super inteligente.",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SUPERBAR — Seu Bar Mais Inteligente",
    description: "Plataforma de gestão inteligente para bares. Operação em tempo real, CMV, margem e decisões — tudo num painel feito exclusivamente para bar.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom PERMITIDO por padrão (menu do cliente, dashboard, landing) — WCAG 1.4.4.
  // O grupo (operacional) sobrescreve e desabilita o zoom nas telas de toque rápido.
  viewportFit: "cover",
  themeColor: "#FF3500",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
        <ConfirmHost />
      </body>
    </html>
  );
}
