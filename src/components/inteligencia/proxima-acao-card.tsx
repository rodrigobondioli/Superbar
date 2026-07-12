import type { ProximaAcao } from "@/lib/dashboard/menu-engineering";
import { formatBRL } from "@/lib/format";

// Card "Próxima melhor ação" da Central de Inteligência.
// 100% dado real (Princípio 9): a ação, o potencial em R$ e o ranking saem de
// escolherProximaAcao — nada de número ou confiança fabricados.

const overline: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
  textTransform: "uppercase", margin: 0,
};

export function ProximaAcaoCard({ acao }: { acao: ProximaAcao }) {
  const headline = acao.subvendido
    ? `Empurre ${acao.nome} enquanto o turno está aberto`
    : `${acao.nome} é seu drink de maior margem — sugira ativamente`;

  const corpo = acao.subvendido
    ? `${acao.nome} rende ${acao.margem}% de margem e vendeu só ${acao.qtd} ${acao.qtd === 1 ? "vez" : "vezes"} no turno — abaixo da média. Empurrar ativamente é margem fácil na mesa.`
    : `${acao.nome} é o drink de maior margem do turno (${acao.margem}%). Sugerir na chegada puxa o ticket pra cima.`;

  const maxMargem = Math.max(...acao.ranking.map((d) => d.margem), 1);

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 28,
    }}>
      <p style={{ ...overline, color: "var(--fg-muted)" }}>Próxima melhor ação</p>

      <h2 style={{
        fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2,
        color: "var(--fg)", margin: "12px 0 0",
      }}>
        {headline}
      </h2>

      {acao.potencialReais != null && (
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "14px 0 0" }}>
          Potencial:{" "}
          <span style={{ color: "var(--accent)" }}>+{formatBRL(acao.potencialReais)}</span>
          {" "}de margem adicional estimada
        </p>
      )}

      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg-muted)", margin: "16px 0 0", maxWidth: 560 }}>
        {corpo}
      </p>

      {acao.ranking.length > 0 && (
        <>
          <div style={{ height: 1, background: "var(--border)", margin: "24px 0 20px" }} />
          <p style={{ ...overline, color: "var(--fg-subtle)", marginBottom: 16 }}>Drinks por margem no turno</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {acao.ranking.map((d) => (
              <div key={d.nome}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "var(--fg)" }}>{d.nome}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{d.margem}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--bg-hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.margem / maxMargem) * 100}%`, background: "var(--accent)", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "20px 0 0" }}>Métrica-alvo: margem do turno</p>
    </div>
  );
}
