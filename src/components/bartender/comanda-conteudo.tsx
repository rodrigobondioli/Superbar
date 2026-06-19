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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Comanda atual</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'white', margin: 0 }}>
            {comanda?.identificador ?? (comanda ? "Sem identificação" : "Nenhuma comanda aberta")}
          </p>
        </div>
        {comanda && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: 'rgba(74,222,128,0.12)', color: 'rgba(74,222,128,0.9)' }}>Aberta</span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {itens.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            Toque em um produto para adicionar à comanda.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {itens.map((item) => (
              <li key={item.produtoId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.produtoNome}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '2px 0 0' }}>
                    {currency.format(item.precoUnitario)} cada
                  </p>
                </div>
                <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}>
                  <form action={removerItem.bind(null, item.ultimoItemId, comanda?.id ?? "")}>
                    <button
                      type="submit"
                      aria-label={`Remover um ${item.produtoNome}`}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.60)', flexShrink: 0 }}
                    >
                      <Minus style={{ width: 14, height: 14 }} strokeWidth={2} />
                    </button>
                  </form>
                  <span style={{ fontSize: 14, color: 'white', width: 20, textAlign: 'center', fontFamily: 'monospace' }}>
                    {item.quantidade}
                  </span>
                  <span style={{ fontSize: 14, color: 'white', fontFamily: 'monospace', width: 70, textAlign: 'right' }}>
                    {currency.format(item.precoTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Subtotal</span>
          <span style={{ fontSize: 22, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{currency.format(subtotal)}</span>
        </div>
        {itens.length === 0 ? (
          <form action={comanda ? cancelarComanda.bind(null, comanda.id) : undefined}>
            <button
              type="submit"
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
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
                width: '100%', padding: '14px',
                background: '#260078', color: 'white',
                border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
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
