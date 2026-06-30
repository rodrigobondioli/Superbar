"use client";

import { useState } from "react";

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
  categoria,
  ranking = [],
}: ProximaMelhorAcaoProps) {
  const isSubofertado = categoria !== "star" && categoria !== "cash_cow";
  const [btnHover, setBtnHover] = useState(false);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
      }}
    >
      {/* Lado esquerdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badge overline — punched out */}
        <span style={{
          display: "inline-block",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#F59E0B",
          border: "1px solid #F59E0B",
          background: "#111113",
          padding: "2px 10px",
          borderRadius: 9999,
          marginBottom: 14,
        }}>
          Superbar AI · Recomendação Tática
        </span>

        {/* Headline */}
        <p style={{
          fontSize: "clamp(18px, 2vw, 26px)",
          fontWeight: 700,
          color: "#FFFFFF",
          margin: "0 0 10px",
          lineHeight: 1.2,
          letterSpacing: "-0.025em",
        }}>
          Oriente a equipe a oferecer {produtoNome} agora.
        </p>

        {/* Razão */}
        <p style={{
          fontSize: 13,
          color: "#A1A1AA",
          lineHeight: 1.6,
          margin: 0,
          maxWidth: 540,
        }}>
          {isSubofertado
            ? `Margem de ${percent.format(margemPercentual ?? 0)}% e apareceu pouco hoje. Sugestão ativa nas próximas 2h pode mais que dobrar as vendas com zero esforço.`
            : `Já vende bem e tem margem de ${percent.format(margemPercentual ?? 0)}%. Manter no topo das sugestões é o caminho de menor esforço para crescer a receita.`}
        </p>
      </div>

      {/* Lado direito */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20, flexShrink: 0 }}>
        <a
          href="/dashboard/cardapio"
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            background: btnHover ? "#FF6F00" : "#F59E0B",
            color: "#000000",
            fontSize: 12,
            fontWeight: 700,
            padding: "10px 24px",
            borderRadius: 9999,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            transition: "background 80ms",
          }}
        >
          Orientar Equipe →
        </a>

        {ranking.filter(p => p.margemPercentual !== null).length > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#A1A1AA",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              margin: "0 0 8px",
            }}>
              Outros de alta margem
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ranking.filter(p => p.margemPercentual !== null).slice(0, 3).map(p => (
                <div key={p.produtoId} style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#A1A1AA" }}>{p.produtoNome}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>
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
