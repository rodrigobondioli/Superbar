"use client";

import { useState, useTransition } from "react";
import { registrarPagamento } from "@/lib/caixa/actions";
import type { ComandaPendente } from "@/lib/caixa/queries";
import type { PagamentoMetodo } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const METODOS: { key: PagamentoMetodo; label: string; icon: string }[] = [
  { key: "dinheiro", label: "Dinheiro", icon: "💵" },
  { key: "debito",   label: "Débito",   icon: "💳" },
  { key: "credito",  label: "Crédito",  icon: "💳" },
  { key: "pix",      label: "Pix",      icon: "⚡" },
  { key: "cortesia", label: "Cortesia", icon: "🎁" },
];

function ComandaCard({ comanda }: { comanda: ComandaPendente }) {
  const [isPending, startTransition] = useTransition();
  const [pago, setPago] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incluirServico, setIncluirServico] = useState(true);

  const servicoPct   = 10;
  const servicoValor = Math.round(comanda.total * (servicoPct / 100) * 100) / 100;
  const totalFinal   = incluirServico ? comanda.total + servicoValor : comanda.total;

  const pagar = (metodo: PagamentoMetodo) => {
    setError(null);
    // Cortesia nunca aplica serviço
    const servico = metodo === "cortesia" ? false : incluirServico;
    startTransition(async () => {
      const result = await registrarPagamento(comanda.id, metodo, servico);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setPago(true);
      }
    });
  };

  const minutos = Math.floor((Date.now() - new Date(comanda.aberta_em).getTime()) / 60000);
  const tempo = minutos < 60 ? `${minutos}min` : `${Math.floor(minutos / 60)}h${minutos % 60 > 0 ? ` ${minutos % 60}min` : ""}`;

  if (pago) {
    return (
      <div style={{
        background: "var(--ok-bg)", border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
        borderRadius: 8, padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        opacity: 0.7,
      }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ok)", margin: 0 }}>✓ {comanda.mesa}</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "4px 0 0" }}>Pagamento registrado</p>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>
          {currency.format(totalFinal)}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "color-mix(in srgb, var(--fg) 4%, transparent)", border: "1px solid var(--border)",
      borderRadius: 8, overflow: "hidden",
    }}>
      {/* Header: mesa + tempo */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", margin: 0 }}>{comanda.mesa}</p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "3px 0 0" }}>Aberta há {tempo}</p>
        </div>
      </div>

      {/* Itens */}
      {comanda.itens.length > 0 && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          {comanda.itens.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                <span style={{ color: "var(--fg-subtle)", marginRight: 8 }}>{item.quantidade}×</span>
                {item.nome}
              </p>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {currency.format(item.preco_total)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown de valores */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        {/* Subtotal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>Subtotal</span>
          <span style={{ fontSize: 13, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
            {currency.format(comanda.total)}
          </span>
        </div>

        {/* Taxa de serviço com toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setIncluirServico(v => !v)}
              aria-pressed={incluirServico}
              style={{
                width: 36, height: 20, borderRadius: 10, border: "none",
                background: incluirServico
                  ? "color-mix(in srgb, var(--accent) 80%, transparent)"
                  : "rgba(255,255,255,0.12)",
                position: "relative", cursor: "pointer", transition: "background 200ms",
                padding: 0, flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: incluirServico ? 18 : 3,
                width: 14, height: 14, borderRadius: "50%",
                background: "#fff", transition: "left 200ms",
              }} />
            </button>
            <span style={{ fontSize: 13, color: incluirServico ? "var(--fg)" : "var(--fg-subtle)" }}>
              Serviço {servicoPct}%
            </span>
          </div>
          <span style={{
            fontSize: 13, fontFamily: "var(--font-mono)",
            color: incluirServico ? "var(--fg-subtle)" : "rgba(255,255,255,0.2)",
            transition: "color 200ms",
          }}>
            {currency.format(servicoValor)}
          </span>
        </div>

        {/* Divisor + Total */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Total</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: "var(--fg)", fontFamily: "var(--font-mono)", letterSpacing: "-0.4px" }}>
            {currency.format(totalFinal)}
          </span>
        </div>
      </div>

      {/* Métodos de pagamento */}
      <div style={{ padding: "16px 20px" }}>
        {error && (
          <p style={{ fontSize: 12, color: "var(--danger)", margin: "0 0 10px" }}>
            {error}
          </p>
        )}
        <p style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
          Forma de pagamento
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {METODOS.map(m => (
            <button
              key={m.key}
              onClick={() => pagar(m.key)}
              disabled={isPending}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8,
                background: m.key === "cortesia"
                  ? "color-mix(in srgb, var(--warn) 12%, transparent)"
                  : "color-mix(in srgb, var(--accent) 25%, transparent)",
                border: m.key === "cortesia"
                  ? "1px solid color-mix(in srgb, var(--warn) 25%, transparent)"
                  : "1px solid color-mix(in srgb, var(--accent-bright) 30%, transparent)",
                color: m.key === "cortesia" ? "var(--warn)" : "var(--accent-bright)",
                fontSize: 13, fontWeight: 600,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
                transition: "all 150ms",
              }}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CaixaComandas({ comandas }: { comandas: ComandaPendente[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {comandas.map(c => (
        <ComandaCard key={c.id} comanda={c} />
      ))}
    </div>
  );
}
