"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProdutoGrid } from "./produto-grid";
import { ComandaConteudo } from "./comanda-conteudo";
import { ComandaBottomSheet } from "./comanda-bottom-sheet";
import { PessoaTabs, type PessoaTab } from "./pessoa-tabs";
import { getComandaDetalhe, listarComandasMesa, abrirComandasMesa } from "@/lib/bartender/actions";
import type { CategoriaComProdutos, ItemAgrupado } from "@/lib/bartender/queries";
import type { Comanda } from "@/types/database";

type Detalhe = { comanda: Comanda; itens: ItemAgrupado[]; subtotal: number };

/** Tela de pedido como app client-side: trocar de pessoa e voltar são estado,
 *  não navegação. O cardápio carrega uma vez; a troca é instantânea. */
export function OrderWorkspace({
  cardapio, mesaId, mesaLabel, pessoasIniciais, detalheInicial,
}: {
  cardapio: CategoriaComProdutos[];
  mesaId: string | null;
  mesaLabel: string;
  pessoasIniciais: PessoaTab[];
  detalheInicial: Detalhe;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(detalheInicial.comanda.id);
  const [detalhe, setDetalhe]   = useState<Detalhe>(detalheInicial);
  const [pessoas, setPessoas]   = useState<PessoaTab[]>(pessoasIniciais);
  const [, startTransition]     = useTransition();

  const carregar = async (id: string) => {
    const d = await getComandaDetalhe(id);
    if (d) setDetalhe(d);
  };
  const refrescarPessoas = async () => {
    if (!mesaId) return;
    const lite = await listarComandasMesa(mesaId);
    setPessoas(lite.map(c => ({ id: c.id, nome_cliente: c.nome_cliente, status: c.status })));
  };

  const trocar = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    startTransition(() => { carregar(id); });
  };

  const aoEnviar = () => startTransition(async () => { await carregar(activeId); await refrescarPessoas(); });

  const adicionarPessoa = () => startTransition(async () => {
    if (!mesaId) return;
    const r = await abrirComandasMesa(mesaId, [""]);
    if ("ids" in r && r.ids[0]) {
      const novo = r.ids[0];
      await refrescarPessoas();
      setActiveId(novo);
      await carregar(novo);
    }
  });

  const totalUnidades = detalhe.itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      {/* Header — Voltar em destaque + mesa */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/garcom")}
          className="hover:brightness-110"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "8px 16px", color: "var(--fg)", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Mesas
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mesaLabel}</span>
      </div>

      {/* Troca de pessoa — client, instantânea */}
      {mesaId && pessoas.length > 0 && (
        <PessoaTabs
          comandas={pessoas}
          atualId={activeId}
          mesaId={mesaId}
          onSwitch={trocar}
          onAddPessoa={adicionarPessoa}
        />
      )}

      {/* Pedido */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* key por comanda: o carrinho reseta ao trocar de pessoa */}
          <ProdutoGrid key={activeId} cardapio={cardapio} comandaId={activeId} onEnviado={aoEnviar} />
        </div>

        <aside className="hidden md:flex md:flex-col md:flex-none" style={{ width: 360, borderLeft: "1px solid var(--border)" }}>
          <ComandaConteudo comanda={detalhe.comanda} itens={detalhe.itens} subtotal={detalhe.subtotal} />
        </aside>

        <div className="md:hidden">
          <ComandaBottomSheet itemCount={totalUnidades} subtotal={detalhe.subtotal}>
            <ComandaConteudo comanda={detalhe.comanda} itens={detalhe.itens} subtotal={detalhe.subtotal} />
          </ComandaBottomSheet>
        </div>
      </div>
    </div>
  );
}
