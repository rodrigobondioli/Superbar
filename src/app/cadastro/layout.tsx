import type { Metadata } from "next";

// Cadastro fora das buscas: é porta de entrada de CLIENTE PAGANTE, não página
// pública. noindex/nofollow garante que o Google não indexa nem segue.
export const metadata: Metadata = {
  title: "Criar conta — Superbar",
  robots: { index: false, follow: false, nocache: true },
};

export default function CadastroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
