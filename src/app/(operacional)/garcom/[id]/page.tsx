import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapio, getComandaById, getItensComanda, agruparItens } from "@/lib/bartender/queries";
import { OrderWorkspace } from "@/components/bartender/order-workspace";
import type { PessoaTab } from "@/components/bartender/pessoa-tabs";
import type { Mesa } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GarcomComandaPage({ params }: Props) {
  const { id } = await params;

  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const [comanda, cardapio, itensBrutos] = await Promise.all([
    getComandaById(id),
    getCardapio(current.bar.id),   // cacheado por bar
    getItensComanda(id),
  ]);

  if (!comanda || comanda.bar_id !== current.bar.id) redirect("/garcom");

  let mesaLabel = "Balcão";
  let pessoas: PessoaTab[] = [];
  if (comanda.mesa_id) {
    const supabase = await createClient();
    const [{ data: mesa }, { data: irmas }] = await Promise.all([
      supabase.from("mesas").select("numero, nome").eq("id", comanda.mesa_id)
        .maybeSingle<Pick<Mesa, "numero" | "nome">>(),
      supabase.from("comandas").select("id, nome_cliente, status")
        .eq("bar_id", current.bar.id).eq("mesa_id", comanda.mesa_id)
        .in("status", ["aberta", "aguardando_pagamento"])
        .order("aberta_em", { ascending: true }),
    ]);
    if (mesa) mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;
    pessoas = irmas ?? [];
  }

  const itens = agruparItens(itensBrutos);
  const subtotal = itens.reduce((acc, item) => acc + item.precoTotal, 0);

  return (
    <OrderWorkspace
      cardapio={cardapio}
      mesaId={comanda.mesa_id}
      mesaLabel={mesaLabel}
      pessoasIniciais={pessoas}
      detalheInicial={{ comanda, itens, subtotal }}
    />
  );
}
