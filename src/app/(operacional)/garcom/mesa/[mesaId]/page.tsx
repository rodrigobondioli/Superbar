import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { MesaView, type PessoaComanda } from "@/components/bartender/mesa-view";
import type { Mesa } from "@/types/database";

interface Props {
  params: Promise<{ mesaId: string }>;
  searchParams: Promise<{ n?: string }>;
}

export const dynamic = "force-dynamic";

export default async function MesaPage({ params, searchParams }: Props) {
  const { mesaId } = await params;
  const { n } = await searchParams;

  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const supabase = await createClient();

  const { data: mesa } = await supabase
    .from("mesas")
    .select("id, numero, nome")
    .eq("id", mesaId)
    .eq("bar_id", current.bar.id)
    .maybeSingle<Pick<Mesa, "id" | "numero" | "nome">>();

  if (!mesa) redirect("/garcom");

  const { data: comandas } = await supabase
    .from("comandas")
    .select("id, nome_cliente, total, status, aberta_em")
    .eq("bar_id", current.bar.id)
    .eq("mesa_id", mesaId)
    .in("status", ["aberta", "aguardando_pagamento"])
    .order("aberta_em", { ascending: true })
    .returns<PessoaComanda[]>();

  const label = mesa.nome ?? `Mesa ${mesa.numero}`;
  const nSugerido = Math.max(0, Math.min(12, parseInt(n ?? "", 10) || 0));

  return (
    <MesaView
      barId={current.bar.id}
      mesaId={mesa.id}
      label={label}
      comandasIniciais={comandas ?? []}
      nSugerido={nSugerido}
    />
  );
}
