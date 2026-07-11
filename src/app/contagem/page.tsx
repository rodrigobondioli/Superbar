import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getInsumosParaContagem } from "@/lib/estoque/queries";
import { podeContarEstoque, isOperacional, homePath } from "@/lib/auth/roles";
import { ContagemClient } from "@/components/estoque/contagem-client";

/**
 * Contagem de insumos — rota própria (fora do /dashboard) pra ser alcançável
 * também pelo bartender (que não entra no dashboard). Protegida por papel.
 */
export default async function ContagemPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");
  if (!podeContarEstoque(current.role)) redirect(homePath(current.role));

  const insumos = await getInsumosParaContagem(current.bar.id);
  // Volta pra casa do papel: bartender → sua tela; dono/bar manager → estoque.
  const voltar = isOperacional(current.role) ? homePath(current.role) : "/dashboard/estoque";

  return (
    <div data-theme="dark" style={{ minHeight: "100dvh", background: "var(--bg)", padding: "24px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <ContagemClient insumos={insumos} voltarHref={voltar} />
      </div>
    </div>
  );
}
