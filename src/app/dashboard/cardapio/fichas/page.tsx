import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getDrinksParaFicha } from "@/lib/ficha/queries";
import { FichasLoteClient } from "@/components/cardapio/fichas-lote-client";

export default async function FichasLotePage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const drinks = await getDrinksParaFicha(current.bar.id);
  return (
    <div className="py-6 lg:px-10 lg:py-8">
      <FichasLoteClient drinks={drinks} />
    </div>
  );
}
