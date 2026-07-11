import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getInsumosParaContagem } from "@/lib/estoque/queries";
import { ContagemClient } from "@/components/estoque/contagem-client";

export default async function ContagemPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const insumos = await getInsumosParaContagem(current.bar.id);

  return (
    <div className="py-6 lg:px-10 lg:py-8">
      <ContagemClient insumos={insumos} />
    </div>
  );
}
