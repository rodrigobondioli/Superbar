import type { InsightItem } from "@/lib/dashboard/insights";
import { formatBRL } from "@/lib/format";

// Cor/rótulo por natureza. Ação = precisa mexer · Oportunidade = dinheiro na
// mesa · Ajuste = cadastrar/corrigir pra a inteligência ficar precisa.
const TIPO: Record<InsightItem["tipo"], { label: string; cor: string }> = {
  action:      { label: "Ação",         cor: "var(--danger)" },
  opportunity: { label: "Oportunidade", cor: "var(--ok)" },
  info:        { label: "Ajuste",       cor: "var(--warn)" },
};

// O que a Central vigia — mostrado no estado "tudo certo" pra o dono saber que
// o sistema está de olho mesmo sem alerta.
const MONITORANDO = [
  "CMV subindo turno a turno",
  "Ticket médio caindo",
  "Drink de alta margem com baixo giro",
  "Produto vendido com margem negativa",
  "Custo/ficha incompletos (CMV impreciso)",
];

const overline: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
  textTransform: "uppercase", margin: 0,
};

function InsightRow({ ins }: { ins: InsightItem }) {
  const t = TIPO[ins.tipo];
  const impacto = typeof ins.impactoReais === "number" && ins.impactoReais !== 0 ? ins.impactoReais : null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "18px 22px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24,
    }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ ...overline, color: t.cor, display: "block", marginBottom: 8 }}>{t.label}</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0, lineHeight: 1.35 }}>{ins.texto}</p>
        {ins.contexto && (
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "4px 0 0" }}>{ins.contexto}</p>
        )}
        {ins.sugestao && (
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "10px 0 0", lineHeight: 1.5 }}>→ {ins.sugestao}</p>
        )}
      </div>

      {impacto !== null && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{
            fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em",
            color: impacto < 0 ? "var(--danger)" : "var(--ok)",
            fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
          }}>
            {impacto < 0 ? "−" : "+"}{formatBRL(Math.abs(impacto))}
          </span>
          <span style={{ display: "block", fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>
            {impacto < 0 ? "em risco" : "de ganho"}
          </span>
        </div>
      )}
    </div>
  );
}

export function CentralInsights({ insights }: { insights: InsightItem[] }) {
  if (insights.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Tudo certo por enquanto</p>
        </div>
        <p style={{ ...overline, color: "var(--fg-subtle)", marginBottom: 12 }}>Monitorando</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MONITORANDO.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ok)", flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Resumo no topo (Few: summary): quantos pontos e quanto está em risco.
  const somaRisco = insights
    .filter((i) => (i.impactoReais ?? 0) < 0)
    .reduce((s, i) => s + Math.abs(i.impactoReais ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 4px" }}>
        <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{insights.length}</strong> ponto{insights.length !== 1 ? "s" : ""} de atenção
        {somaRisco > 0 && <> · <span style={{ color: "var(--danger)", fontWeight: 600 }}>{formatBRL(somaRisco)}</span> em risco</>}
      </p>
      {insights.map((ins, i) => <InsightRow key={i} ins={ins} />)}
    </div>
  );
}
