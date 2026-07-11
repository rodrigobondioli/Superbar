import { PiggyBank } from "lucide-react";
import type { DinheiroParado } from "@/lib/estoque/queries";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const qtd = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Dinheiro parado — capital dormindo em insumo sem saída no período.
 * Só renderiza quando há sinal (silencioso sem dado). Tom informativo, não
 * alarmista: mostra o R$ parado e sugere ação (parar de comprar / puxar no cardápio).
 */
export function DinheiroParadoCard({ dados }: { dados: DinheiroParado }) {
  if (dados.itens.length === 0) return null;

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <PiggyBank size={16} style={{ color: "var(--warn)", flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Dinheiro parado</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 14px" }}>
        Insumo sem saída há {dados.dias} dias — capital dormindo na prateleira.
      </p>

      <p style={{ fontSize: "2.4rem", fontWeight: 700, color: "var(--fg)", margin: "0 0 16px", lineHeight: 1 }}>
        {currency.format(dados.total)}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {dados.itens.map((it, i) => (
          <div
            key={it.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              paddingBottom: 10,
              borderBottom: i < dados.itens.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: "var(--fg)", margin: "0 0 2px" }}>{it.nome}</p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                {qtd.format(it.estoqueAtual)} {it.unidade || "un"} × {currency.format(it.custoUnitario)}
              </p>
            </div>
            <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
              {currency.format(it.valorParado)}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "12px 0 0", lineHeight: 1.5 }}>
        Segura a próxima compra desses ou puxa eles no cardápio pra girar.
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
};
