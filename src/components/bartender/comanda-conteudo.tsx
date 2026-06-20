import { Minus } from "lucide-react";
import { fecharComanda, cancelarComanda, removerItem } from "@/lib/bartender/actions";
import type { ItemAgrupado } from "@/lib/bartender/queries";
import type { Comanda } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ComandaConteudoProps {
  comanda: Comanda | null;
  itens: ItemAgrupado[];
  subtotal: number;
}

export function ComandaConteudo({ comanda, itens, subtotal }: ComandaConteudoProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        {itens.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
            Toque em um produto para adicionar à comanda.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {itens.map((item) => (
              <li key={item.produtoId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.produtoNome}</p>
                  <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
                    {currency.format(item.precoUnitario)} cada
                  </p>
                </div>
                <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 8 }}>
                  <form action={removerItem.bind(null, item.ultimoItemId, comanda?.id ?? "")}>
                    <button
                      type="submit"
                      aria-label={`Remover um ${item.produtoNome}`}
                      style={{ width: 32, height: 32, borderRadius: "50%", background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)", flexShrink: 0 }}
                    >
                      <Minus style={{ width: 14, height: 14 }} strokeWidth={2} />
                    </button>
                  </form>
                  <span style={{ fontSize: 14, color: "var(--fg)", width: 20, textAlign: "center", fontFamily: "var(--font-mono)" }}>
                    {item.quantidade}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--fg)", fontFamily: "var(--font-mono)", width: 70, textAlign: "right" }}>
                    {currency.format(item.precoTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>Subtotal</span>
          <span style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>{currency.format(subtotal)}</span>
        </div>
        {comanda?.status === "aguardando_pagamento" ? (
          <div style={{
            width: "100%", padding: "14px",
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
            borderRadius: 8, textAlign: "center",
            color: "var(--danger)", fontSize: 14, fontWeight: 700,
          }}>
            Aguardando pagamento no caixa
          </div>
        ) : itens.length === 0 ? (
          <form action={comanda ? cancelarComanda.bind(null, comanda.id) : undefined}>
            <button
              type="submit"
              style={{
                width: "100%", padding: "14px",
                background: "color-mix(in srgb, var(--fg) 5%, transparent)",
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
                borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar comanda
            </button>
          </form>
        ) : (
          <form action={comanda ? fecharComanda.bind(null, comanda.id) : undefined}>
            <button
              type="submit"
              style={{
                width: "100%", padding: "14px",
                background: "var(--accent)", color: "var(--accent-fg)",
                border: "none", borderRadius: 8,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Fechar e enviar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
