import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuApp } from "@/components/menu/menu-app";
import { getTopPedidos } from "@/lib/menu/queries";
import { getDestaques } from "@/lib/destaques/queries";
import type { Bar, Mesa, Categoria, Produto } from "@/types/database";

interface Props {
  params: Promise<{ barSlug: string; mesaId: string }>;
}

export default async function MenuPage({ params }: Props) {
  const { barSlug, mesaId } = await params;
  const supabase = await createClient();

  const { data: bar } = await supabase
    .from("bars")
    .select("*")
    .eq("slug", barSlug)
    .eq("ativo", true)
    .maybeSingle<Bar>();

  if (!bar) notFound();

  const { data: mesa } = await supabase
    .from("mesas")
    .select("*")
    .eq("id", mesaId)
    .eq("bar_id", bar.id)
    .eq("ativo", true)
    .maybeSingle<Mesa>();

  if (!mesa) notFound();

  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("*")
      .eq("bar_id", bar.id)
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .returns<Categoria[]>(),
    supabase
      .from("produtos")
      .select("*")
      .eq("bar_id", bar.id)
      .eq("ativo", true)
      .returns<Produto[]>(),
  ]);

  // Cliente só vê categorias com produto — nada de categoria vazia/lixo do admin.
  const cardapio = (categorias ?? [])
    .map((cat) => ({
      ...cat,
      produtos: (produtos ?? []).filter((p) => p.categoria_id === cat.id),
    }))
    .filter((cat) => cat.produtos.length > 0);

  const [topPedidos, destaques] = await Promise.all([getTopPedidos(bar.id), getDestaques(bar.id)]);

  return <MenuApp bar={bar} mesa={mesa} cardapio={cardapio} topPedidos={topPedidos} destaques={destaques} />;
}
