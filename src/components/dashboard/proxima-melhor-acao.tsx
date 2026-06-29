"use client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

interface ProximaMelhorAcaoProps {
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
  quantidadeVendida: number;
  categoria: string;
  ranking?: RankingItem[];
}

interface RankingItem {
  produtoId: string;
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
}

export function ProximaMelhorAcao({
  produtoNome,
  margemPercentual,
  faturamento,
  quantidadeVendida,
  categoria,
  ranking = [],
}: ProximaMelhorAcaoProps) {
  const potencial = faturamento * 0.3;

  const isSubofertado = categoria !== "star" && categoria !== "cash_cow";
  const razao = isSubofertado
    ? `Margem de ${percent.format(margemPercentual ?? 0)}% e apareceu pouco hoje. Se a equipe sugerir ativamente nas próximas 2 horas, a venda pode mais que dobrar com pouco esforço.`
    : `Já está vendendo bem e tem margem de ${percent.format(margemPercentual ?? 0)}%. Manter no topo das sugestões é o caminho de menor esforço para crescer receita agora.`;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "32px 36px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>

        {/* Lado esquerdo — ação + razão */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-subtle)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 12px",
            }}
          >
            Próxima ação
          </p>

          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--fg)",
              margin: "0 0 10px",
              lineHeight: 1.3,
            }}
          >
            Oriente a equipe a oferecer {produtoNome} agora.
          </p>

          <p
            style={{
              fontSize: 14,
              color: "var(--fg-subtle)",
              lineHeight: 1.65,
              margin: "0 0 20px",
              maxWidth: 520,
            }}
          >
            {razao}
          </p>

          {margemPercentual !== null && potencial > 0 && (
            <p
              style={{
                fontSize: 13,
                color: "var(--ok)",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                margin: "0 0 22px",
              }}
            >
              Estimativa: +{currency.format(potencial)} em receita adicional
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <a
              href="/dashboard/cardapio"
              style={{
                background: "var(--accent)",
                color: "#000",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 8,
                textDecoration: "none",
                display: "inline-block",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              Ver no cardápio
            </a>
            <a
              href="/dashboard/cardapio"
              style={{
                fontSize: 12,
                color: "var(--fg-subtle)",
                textDecoration: "none",
              }}
            >
              Ver todos de margem alta →
            </a>
          </div>
        </div>

        {/* Lado direito — ranking compacto */}
        {ranking.filter((p) => p.margemPercentual !== null).length > 0 && (
          <div
            style={{
              flexShrink: 0,
              width: 200,
              paddingLeft: 28,
              borderLeft: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
                margin: "0 0 14px",
              }}
            >
              Outros de alta margem
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ranking
                .filter((p) => p.margemPercentual !== null)
                .slice(0, 4)
                .map((p) => (
                  <div
                    key={p.produtoId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--fg-subtle)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        minWidth: 0,
                        marginRight: 12,
                      }}
                    >
                      {p.produtoNome}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--fg-subtle)",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {percent.format(p.margemPercentual ?? 0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
