import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapioAdmin } from "@/lib/cardapio/queries";
import { CardapioClient } from "@/components/cardapio/cardapio-client";

export default async function CardapioPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const cardapio = await getCardapioAdmin(current.bar.id);

  return (
    <div className="py-6 lg:px-10 lg:py-8 flex flex-col lg:h-full lg:overflow-hidden">
      <CardapioClient cardapio={cardapio} barId={current.bar.id} />
    </div>
  );
}
