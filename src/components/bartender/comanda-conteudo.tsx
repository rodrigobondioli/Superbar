"use client";

import { useState } from "react";
import { Minus, Loader2 } from "lucide-react";
import { cancelarComanda, removerItem } from "@/lib/bartender/actions";
import { toast } from "@/components/ui/toaster";
import { FecharComandaBtn } from "./fechar-comanda-btn";
import type { ItemAgrupado } from "@/lib/bartender/queries";
import type { Comanda } from "@/types/database";
import { currency } from "@/lib/format";


interface ComandaConteudoProps {
  comanda: Comanda | null;
  itens: ItemAgrupado[];
  subtotal: number;
}

export function ComandaConteudo({ comanda, itens, subtotal }: ComandaConteudoProps) {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [cancelando, setCancelando] = useState(false);

  async function handleRemover(itemId: string, comandaId: string) {
    if (removingIds.has(itemId)) return;
    setRemovingIds(prev => { const n = new Set(prev); n.add(itemId); return n; });
    try {
      await removerItem(itemId, comandaId);
    } catch {
      toast("Erro ao remover item.", "error");
      setRemovingIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
    }
  }

  async function handleCancelar() {
    if (!comanda || cancelando) return;
    setCancelando(true);
    try {
      const result = await cancelarComanda(comanda.id);
      if ("error" in result) {
        toast(result.error, "error");
        setCancelando(false);
      } else {
        window.location.href = "/garcom";
      }
    } catch {
      toast("Erro ao cancelar comanda.", "error");
      setCancelando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Comanda atual</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0 }}>
            {comanda?.identificador ?? (comanda ? "Sem identificação" : "Nenhuma comanda aberta")}
          </p>
        </div>
        {comanda && (
          comanda.status === "aguardando_pagamento"
            ? <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 2, background: "var(--danger-bg)", color: "var(--danger)" }}>Quer pagar</span>
            : <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 2, background: "var(--ok-bg)", color: "var(--ok)" }}>Aberta</span>
        )}
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        {itens.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
            Toque em um produto para adicionar à comanda.
          </p>
        ) : (() => {
          const emPreparo = itens.filter(i => i.pedidoStatus === "em_preparo");
          const entregues = itens.filter(i => i.pedidoStatus === "entregue");
          const semPedido = itens.filter(i => i.pedidoStatus === null);

          const ItemLinha = ({ item }: { item: typeof itens[0] }) => {
            const isRemoving = removingIds.has(item.ultimoItemId);
            // Só permite remover itens ainda não enviados para produção
            const podeSelecionarRemover = item.pedidoStatus === null;
            return (
              <li
                key={`${item.produtoId}-${item.pedidoStatus}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)",
                  opacity: isRemoving ? 0.4 : 1, transition: "opacity 150ms",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.produtoNome}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
                    {currency.format(item.precoUnitario)} cada
                  </p>
                </div>
                <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 8 }}>
                  {podeSelecionarRemover && (
                    <button
                      type="button"
                      aria-label={`Remover um ${item.produtoNome}`}
                      disabled={isRemoving || !comanda}
                      onClick={() => comanda && handleRemover(item.ultimoItemId, comanda.id)}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "color-mix(in srgb, var(--fg) 6%, transparent)",
                        border: "none", cursor: isRemoving ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--fg-muted)", flexShrink: 0,
                      }}
                    >
                      {isRemoving
                        ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                        : <Minus style={{ width: 14, height: 14 }} strokeWidth={2} />}
                    </button>
                  )}
                  {!podeSelecionarRemover && <div style={{ width: 32 }} />}
                  <span style={{ fontSize: 14, color: "var(--fg)", width: 20, textAlign: "center", fontFamily: "var(--font-mono)" }}>
                    {item.quantidade}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--fg)", fontFamily: "var(--font-mono)", width: 70, textAlign: "right" }}>
                    {currency.format(item.precoTotal)}
                  </span>
                </div>
              </li>
            );
          };

          const SecaoLabel = ({ label, cor }: { label: string; cor: string }) => (
            <p style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: cor, margin: "16px 0 4px",
            }}>{label}</p>
          );

          return (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {emPreparo.length > 0 && <SecaoLabel label={`Em preparo · ${emPreparo.reduce((s,i)=>s+i.quantidade,0)}`} cor="var(--accent-bright)" />}
              {emPreparo.map(item => <ItemLinha key={`${item.produtoId}-em_preparo`} item={item} />)}
              {entregues.length > 0 && <SecaoLabel label={`Entregues · ${entregues.reduce((s,i)=>s+i.quantidade,0)}`} cor="var(--ok)" />}
              {entregues.map(item => <ItemLinha key={`${item.produtoId}-entregue`} item={item} />)}
              {semPedido.length > 0 && (emPreparo.length > 0 || entregues.length > 0) && <SecaoLabel label="No carrinho" cor="var(--fg-subtle)" />}
              {semPedido.map(item => <ItemLinha key={`${item.produtoId}-null`} item={item} />)}
            </ul>
          );
        })()}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>Subtotal</span>
          <span style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{currency.format(subtotal)}</span>
        </div>
        {comanda?.status === "aguardando_pagamento" ? (
          <div style={{
            width: "100%", padding: "14px",
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
            borderRadius: 16, textAlign: "center",
            color: "var(--danger)", fontSize: 14, fontWeight: 700,
          }}>
            Aguardando pagamento no caixa
          </div>
        ) : itens.length === 0 ? (
          <button
            type="button"
            disabled={cancelando || !comanda}
            onClick={handleCancelar}
            style={{
              width: "100%", padding: "14px",
              background: "color-mix(in srgb, var(--fg) 5%, transparent)",
              color: cancelando ? "var(--fg-subtle)" : "var(--fg-muted)",
              border: "1px solid var(--border-strong)",
              borderRadius: 999, fontSize: 15, fontWeight: 500,
              cursor: cancelando ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: cancelando ? 0.7 : 1, transition: "opacity 150ms",
            }}
          >
            {cancelando
              ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Cancelando…</>
              : "Cancelar comanda"}
          </button>
        ) : (
          comanda && <FecharComandaBtn comandaId={comanda.id} />
        )}
      </div>
    </div>
  );
}
