import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapio, getComandaById, getItensComanda, agruparItens } from "@/lib/bartender/queries";
import { ProdutoGrid } from "@/components/bartender/produto-grid";
import { ComandaConteudo } from "@/components/bartender/comanda-conteudo";
import { ComandaBottomSheet } from "@/components/bartender/comanda-bottom-sheet";
import { PessoaTabs, type PessoaTab } from "@/components/bartender/pessoa-tabs";
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
    getCardapio(current.bar.id),   // cacheado por bar — troca de pessoa não refaz
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
        .order("aberta_em", { ascending: true })
        .returns<PessoaTab[]>(),
    ]);
    if (mesa) mesaLabel = mesa.nome ?? `Mesa ${mesa.numero}`;
    pessoas = irmas ?? [];
  }

  const itens = agruparItens(itensBrutos);
  const subtotal = itens.reduce((acc, item) => acc + item.precoTotal, 0);
  const totalUnidades = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      {/* Breadcrumb bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <Link
          href="/garcom"
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-muted)", textDecoration: "none", fontSize: 13 }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Mesas
        </Link>
        <span style={{ color: "var(--fg-subtle)", fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{mesaLabel}</span>
        {comanda.status !== "aberta" && (
          <span style={{
            fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2,
            background: "var(--warn-bg)", color: "var(--warn)", marginLeft: 4,
          }}>
            {comanda.status === "aguardando_pagamento" ? "Aguard. pagamento" : comanda.status}
          </span>
        )}
      </div>

      {/* Troca rápida de pessoa dentro da mesa */}
      {comanda.mesa_id && pessoas.length > 0 && (
        <PessoaTabs comandas={pessoas} atualId={comanda.id} mesaId={comanda.mesa_id} />
      )}

      {/* Main: product grid + comanda panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ProdutoGrid cardapio={cardapio} comandaId={comanda.id} />
        </div>

        {/* Painel lateral — oculto no mobile; bottom sheet assume o papel */}
        <aside
          className="hidden md:flex md:flex-col md:flex-none"
          style={{ width: 360, borderLeft: "1px solid var(--border)" }}
        >
          <ComandaConteudo comanda={comanda} itens={itens} subtotal={subtotal} />
        </aside>

        <div className="md:hidden">
          <ComandaBottomSheet itemCount={totalUnidades} subtotal={subtotal}>
            <ComandaConteudo comanda={comanda} itens={itens} subtotal={subtotal} />
          </ComandaBottomSheet>
        </div>
      </div>
    </div>
  );
}
