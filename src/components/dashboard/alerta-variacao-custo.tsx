import { TrendingUp } from "lucide-react";
import type { VariacaoCusto } from "@/lib/dashboard/queries";
import { currency } from "@/lib/format";


/**
 * Alerta de custo subindo — compara as duas últimas compras de cada insumo.
 * Só renderiza quando há sinal (silencioso sem dado). É inteligência: aponta
 * onde a margem está sendo comida e sugere revisar o preço.
 */
export function AlertaVariacaoCusto({ itens }: { itens: VariacaoCusto[] }) {
  if (itens.length === 0) return null;

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <TrendingUp size={16} style={{ color: "var(--warn)", flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
          Custo subindo
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {itens.map((it, i) => (
          <div
            key={it.ingredienteId}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              paddingBottom: 10,
              borderBottom: i < itens.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: "var(--fg)", margin: "0 0 2px" }}>
                {it.ingredienteNome}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                {currency.format(it.custoAnterior)} → {currency.format(it.custoAtual)} / {it.unidade || "un"}
                {it.fornecedorNome && <> · {it.fornecedorNome}</>}
              </p>
            </div>
            <span
              style={{
                flexShrink: 0, fontSize: 13, fontWeight: 700, color: "var(--warn)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              +{Math.round(it.pctChange * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "10px 0 0", lineHeight: 1.5 }}>
        A margem dos drinks com esse insumo caiu. Revê o preço ou a ficha.
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "20px 24px",
};
