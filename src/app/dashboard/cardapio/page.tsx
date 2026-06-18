import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapioAdmin } from "@/lib/cardapio/queries";
import { CardapioClient } from "@/components/cardapio/cardapio-client";
import { LABEL, H1, SUBTITLE } from "@/lib/ui";

export default async function CardapioPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const cardapio = await getCardapioAdmin(current.bar.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "32px 40px 24px", flexShrink: 0 }}>
        <h1 style={H1}>Cardápio</h1>
        <p style={SUBTITLE}>Gerencie categorias e produtos do seu bar.</p>
      </div>

      {/* Content — fills remaining height */}
      <div style={{ flex: 1, minHeight: 0, padding: "0 40px 32px" }}>
        <CardapioClient cardapio={cardapio} />
      </div>
    </div>
  );
}
