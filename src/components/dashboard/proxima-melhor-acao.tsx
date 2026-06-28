"use client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

interface ProximaMelhorAcaoProps {
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
  quantidadeVendida: number;
  categoria: string;
}

interface RankingItem {
  produtoId: string;
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
}

interface ProximaMelhorAcaoFullProps extends ProximaMelhorAcaoProps {
  ranking?: RankingItem[];
}

export function ProximaMelhorAcao({
  produtoNome,
  margemPercentual,
  faturamento,
  quantidadeVendida,
  categoria,
  ranking = [],
}: ProximaMelhorAcaoFullProps) {
  const confianca = margemPercentual != null
    ? Math.min(Math.round(margemPercentual), 95)
    : null;

  const potencial = faturamento * 0.3;

  const razao = categoria === "star" || categoria === "cash_cow"
    ? `${produtoNome} já vende bem e tem margem de ${percent.format(margemPercentual ?? 0)}%. Aumentar frequência de oferta é o caminho de menor esforço para crescer receita agora.`
    : `${produtoNome} tem margem de ${percent.format(margemPercentual ?? 0)}% mas está sendo subofertado. Treinamento de equipe pode dobrar as vendas deste item.`;

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "white", fontFamily: "var(--font-mono)", margin: "0 0 16px" }}>
        Próxima Melhor Ação
      </p>

      {/* Ação recomendada */}
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 8px", lineHeight: 1.3 }}>
        Sugerir {produtoNome} como primeira oferta nas próximas 2h
      </p>

      {/* Impacto estimado */}
      {margemPercentual != null && (
        <p style={{ fontSize: 13, color: "white", fontFamily: "var(--font-mono)", fontWeight: 600, margin: "0 0 16px" }}>
          Potencial: +{currency.format(potencial)} em receita adicional estimada
        </p>
      )}

      {/* Por quê */}
      <p style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
        {razao}
      </p>

      {/* Confiança */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 20px" }}>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          Confiança:
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "white", fontFamily: "var(--font-mono)" }}>
          {confianca != null ? `${confianca}%` : "—"}
        </span>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          · Métrica-alvo: ticket médio do turno
        </span>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href="/dashboard/cardapio"
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            fontFamily: "var(--font-mono)",
            textDecoration: "none",
            padding: "6px 0",
          }}
        >
          Ver no cardápio →
        </a>
      </div>

      {/* Ranking secundário */}
      {ranking.length > 0 && (
        <>
          <div style={{ height: 1, background: "var(--border)", margin: "24px 0 16px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ranking.filter(p => p.margemPercentual !== null).map(p => (
              <div key={p.produtoId}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0, marginRight: 8 }}>
                    {p.produtoNome}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                    {percent.format(p.margemPercentual ?? 0)}%
                  </span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${p.margemPercentual ?? 0}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
