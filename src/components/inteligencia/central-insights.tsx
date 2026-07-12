import type { InsightItem } from "@/lib/dashboard/insights";
import { formatBRL } from "@/lib/format";

// Cor/rótulo por natureza do insight. Ação = precisa mexer; Oportunidade =
// dinheiro na mesa; Info = contexto pra cadastrar/ajustar.
const TIPO: Record<InsightItem["tipo"], { label: string; cor: string }> = {
  action:      { label: "Ação",         cor: "var(--danger)" },
  opportunity: { label: "Oportunidade", cor: "var(--ok)" },
  info:        { label: "Info",         cor: "var(--warn)" },
};

// O que a Central vigia — mostrado no estado "tudo certo" pra o dono saber que
// o sistema está de olho mesmo quando não há alerta.
const MONITORANDO = [
  "CMV por produto",
  "Custo incompleto — produtos sem ficha",
  "Ticket médio vs turno anterior",
  "Produtos com boa margem e baixo giro",
  "Estoque abaixo do mínimo",
  "Cortesias acima do normal",
];

const card: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 8,
};
const overline: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
  textTransform: "uppercase", margin: 0,
};

export function CentralInsights({ insights }: { insights: InsightItem[] }) {
  if (insights.length === 0) {
    return (
      <div style={{ ...card, padding: "28px" }}>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {insights.map((ins, i) => {
        const t = TIPO[ins.tipo];
        return (
          <div key={i} style={card}>
            <span style={{ ...overline, color: t.cor }}>{t.label}</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0, lineHeight: 1.4 }}>{ins.texto}</p>
            {ins.contexto && (
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>{ins.contexto}</p>
            )}
            {typeof ins.impactoReais === "number" && ins.impactoReais !== 0 && (
              <p style={{ fontSize: 14, fontWeight: 600, margin: "2px 0 0", color: ins.impactoReais < 0 ? "var(--danger)" : "var(--ok)" }}>
                {ins.impactoReais < 0 ? "−" : "+"}{formatBRL(Math.abs(ins.impactoReais))} {ins.impactoReais < 0 ? "em risco" : "de ganho"}
              </p>
            )}
            {ins.sugestao && (
              <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>→ {ins.sugestao}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
