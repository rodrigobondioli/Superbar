import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapioAdmin, getIdsComFicha } from "@/lib/cardapio/queries";
import { getDestaques } from "@/lib/destaques/queries";
import { CardapioClient } from "@/components/cardapio/cardapio-client";

export default async function CardapioPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const [cardapio, fichaIds, destaques] = await Promise.all([
    getCardapioAdmin(current.bar.id),
    getIdsComFicha(current.bar.id),
    getDestaques(current.bar.id),
  ]);

  return (
    <div className="py-6 lg:py-8 flex flex-col lg:h-full lg:overflow-hidden">
      <CardapioClient cardapio={cardapio} barId={current.bar.id} fichaIds={[...fichaIds]} destaques={destaques} />
    </div>
  );
}
