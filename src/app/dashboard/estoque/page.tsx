import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getEstoque, getMovimentosRecentes } from "@/lib/estoque/queries";
import { EstoqueClient } from "@/components/estoque/estoque-client";

export default async function EstoquePage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const [itens, movimentos] = await Promise.all([
    getEstoque(current.bar.id),
    getMovimentosRecentes(current.bar.id),
  ]);

  const alertas = itens.filter(i => i.abaixoDoMinimo).length;

  return (
    <div className="py-6 lg:px-10 lg:py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.01em", margin: 0 }}>
          Estoque
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "6px 0 0" }}>
          {itens.length} produto{itens.length !== 1 ? "s" : ""} com controle ativo
          {alertas > 0 && (
            <span style={{ marginLeft: 8, color: "var(--warn)", fontWeight: 500 }}>
              · {alertas} abaixo do mínimo
            </span>
          )}
        </p>
      </div>

      {/* Lista */}
      <EstoqueClient itens={itens} movimentos={movimentos} />
    </div>
  );
}
