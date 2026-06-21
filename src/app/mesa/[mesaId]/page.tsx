import { notFound } from "next/navigation";
import { getMesaPublica, getProdutosPublicos } from "@/lib/mesa/queries";
import { MesaApp } from "@/components/mesa/mesa-app";

export const dynamic = "force-dynamic";

export default async function MesaPage({
  params,
}: {
  params: Promise<{ mesaId: string }>;
}) {
  const { mesaId } = await params;

  const mesa = await getMesaPublica(mesaId);
  if (!mesa) notFound();

  const produtos = await getProdutosPublicos(mesa.bar.id);

  return <MesaApp mesa={mesa} produtos={produtos} />;
}
