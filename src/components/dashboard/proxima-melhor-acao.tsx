"use client";

import { currencyInteiro } from "@/lib/format";

const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const currency = currencyInteiro;

interface ProximaMelhorAcaoProps {
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
  quantidadeVendida: number;
  categoria: string;
  ranking?: RankingItem[];
  impactoEstimado?: number | null;
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
  categoria,
  impactoEstimado,
}: ProximaMelhorAcaoProps) {
  const isSubofertado = categoria !== "star" && categoria !== "cash_cow";

  return (
    <div style={{
      background: "var(--bg-ai)",
      border: "1px solid var(--border-ai)",
      borderRadius: "var(--radius-2xl)",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      height: "100%",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Subtle glow accent */}
      <div style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: "var(--accent)",
        opacity: 0.04,
        pointerEvents: "none",
      }} />

      {/* Section label */}
      <span style={{
        display: "block",
        fontSize: 9,
        fontWeight: 600,
        color: "var(--fg-subtle)",
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        marginBottom: 10,
        opacity: 0.7,
      }}>
        Próxima Melhor Ação
      </span>

      {/* Overline badge */}
      <span style={{
        display: "inline-flex",
        alignSelf: "flex-start",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--accent)",
        border: "1px solid var(--accent)",
        background: "transparent",
        padding: "3px 10px",
        borderRadius: 9999,
        marginBottom: 14,
        opacity: 0.85,
      }}>
        Superbar AI · Bebida mais lucrativa
      </span>

      {/* Product name */}
      <p style={{
        fontSize: "clamp(20px, 1.8vw, 28px)",
        fontWeight: 700,
        color: "var(--fg)",
        margin: "0 0 12px",
        lineHeight: 1.15,
        letterSpacing: "-0.03em",
        flex: "none",
      }}>
        {produtoNome}
      </p>

      {/* Margem + faturamento */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {margemPercentual !== null && (
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ok)",
            border: "1px solid var(--border)",
            borderRadius: 9999,
            padding: "2px 10px",
            fontVariantNumeric: "tabular-nums",
          }}>
            {percent.format(margemPercentual)}% margem
          </span>
        )}
        {faturamento > 0 && (
          <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" }}>
            {currency.format(faturamento)} hoje
          </span>
        )}
      </div>

      {/* Reasoning */}
      <p style={{
        fontSize: 12,
        color: "var(--fg-subtle)",
        lineHeight: 1.65,
        margin: "0 0 16px",
        flex: 1,
      }}>
        {isSubofertado
          ? `Apareceu pouco hoje — sugerir ativamente nas próximas 2h pode mais que dobrar as vendas com zero esforço.`
          : `Já lidera em vendas. Manter no topo das sugestões é o caminho de menor esforço para crescer a receita.`}
      </p>

      {/* Impact sub-card (se disponível) */}
      {impactoEstimado !== null && impactoEstimado !== undefined && impactoEstimado > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}>
          <div style={{
            background: "color-mix(in srgb, var(--ok) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--ok) 20%, var(--border))",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
          }}>
            <span style={{ display: "block", fontSize: 9, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
              Impacto
            </span>
            <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--ok)", fontVariantNumeric: "tabular-nums" }}>
              +{currency.format(impactoEstimado)}
            </span>
          </div>
          <div style={{
            background: "color-mix(in srgb, var(--warn) 6%, transparent)",
            border: "1px solid color-mix(in srgb, var(--warn) 15%, var(--border))",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
          }}>
            <span style={{ display: "block", fontSize: 9, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
              Risco
            </span>
            <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>
              baixo
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      <a
        href="/dashboard/inteligencia"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "9px 16px",
          background: "var(--accent)",
          color: "var(--accent-fg)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.02em",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          marginTop: "auto",
          flexShrink: 0,
          transition: "filter 150ms",
        }}
      >
        Ver análise completa →
      </a>
    </div>
  );
}
