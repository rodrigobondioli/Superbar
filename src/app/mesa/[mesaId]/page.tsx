import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMesaPublica, getEsgotados } from "@/lib/mesa/queries";
import { getTopPedidos } from "@/lib/menu/queries";
import { getDestaques } from "@/lib/destaques/queries";
import { MesaApp } from "@/components/mesa/mesa-app";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MesaPage({
  params,
}: {
  params: Promise<{ mesaId: string }>;
}) {
  const { mesaId } = await params;

  const mesa = await getMesaPublica(mesaId);
  if (!mesa) notFound();

  const supabase = createAdminClient();
  const [{ data: bar }, { data: mesaRow }, { data: categorias }, { data: produtos }] = await Promise.all([
    supabase.from("bars").select("*").eq("id", mesa.bar.id).maybeSingle<Bar>(),
    supabase.from("mesas").select("*").eq("id", mesaId).maybeSingle<Mesa>(),
    supabase.from("categorias").select("*").eq("bar_id", mesa.bar.id).eq("ativo", true).order("ordem", { ascending: true }).returns<Categoria[]>(),
    supabase.from("produtos").select("*").eq("bar_id", mesa.bar.id).eq("ativo", true).returns<Produto[]>(),
  ]);
  if (!bar || !mesaRow) notFound();

  const cardapio = (categorias ?? [])
    .map((c) => ({ ...c, produtos: (produtos ?? []).filter((p) => p.categoria_id === c.id) }))
    .filter((c) => c.produtos.length > 0);

  const [topPedidos, destaques, esgotados] = await Promise.all([
    getTopPedidos(mesa.bar.id),
    getDestaques(mesa.bar.id),
    getEsgotados(mesa.bar.id),
  ]);

  return (
    <MesaApp
      mesa={mesa}
      bar={bar}
      mesaRow={mesaRow}
      cardapio={cardapio}
      topPedidos={topPedidos}
      destaques={destaques}
      esgotados={esgotados}
    />
  );
}
