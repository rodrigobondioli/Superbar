import { ConexaoBanner } from "@/components/ui/conexao-banner";

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
