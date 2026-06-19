"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { registrarPagamento } from "@/lib/caixa/actions";
import type { ComandaPendente, CaixaInsights } from "@/lib/caixa/queries";
import type { PagamentoMetodo } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const METODOS: { key: PagamentoMetodo; label: string; icon: string }[] = [
  { key: "dinheiro", label: "Dinheiro", icon: "💵" },
  { key: "debito", label: "Débito", icon: "💳" },
  { key: "credito", label: "Crédito", icon: "💳" },
  { key: "pix", label: "Pix", icon: "⚡" },
  { key: "cortesia", label: "Cortesia", icon: "🎁" },
];

const METODO_LABEL: Record<PagamentoMetodo, string> = {
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  pix: "Pix",
  cortesia: "Cortesia",
};

// ─── Insights bar ────────────────────────────────────────────────────────────

function InsightsBar({ insights }: { insights: CaixaInsights }) {
  const kpis = [
    { label: "Faturado no turno", value: currency.format(insights.totalTurno), color: "#c8ff00" },
    { label: "Comandas pagas", value: String(insights.comandasPagas), color: "rgba(74,222,128,0.9)" },
    { label: "Ticket médio", value: currency.format(insights.ticketMedio), color: "white" },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 24px",
      display: "flex",
      gap: 0,
      overflowX: "auto",
    }}>
      {kpis.map((k, i) => (
        <div key={k.label} style={{
          flex: 1, minWidth: 110, padding: "0 20px",
          borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>
            {k.label}
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: k.color, margin: 0, fontFamily: "monospace" }}>
            {k.value}
          </p>
        </div>
      ))}

      {insights.porMetodo.length > 0 && (
        <div style={{ flex: 2, minWidth: 160, padding: "0 20px", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 5px" }}>
            Por método
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 12px" }}>
            {insights.porMetodo.map(m => (
              <span key={m.metodo} style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                <span style={{ color: "rgba(255,255,255,0.32)" }}>{METODO_LABEL[m.metodo]}</span>{" "}
                {currency.format(m.total)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mesa chips (submenu de navegação) ───────────────────────────────────────

function MesaChips({
  lista,
  filtro,
  onFiltro,
}: {
  lista: ComandaPendente[];
  filtro: string | null;
  onFiltro: (mesa: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll chip ativo para dentro da view
  useEffect(() => {
    const active = scrollRef.current?.querySelector("[data-active='true']") as HTMLElement | null;
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [filtro]);

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "#0a0a10",
      position: "sticky", top: 56, zIndex: 9,
    }}>
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: 6, padding: "10px 24px",
          overflowX: "auto",
          scrollbarWidth: "none",
          // webkit scrollbar hidden via className
        }}
        className="hide-scrollbar"
      >
        {/* Chip "Todas" */}
        <button
          data-active={filtro === null}
          onClick={() => onFiltro(null)}
          style={{
            flexShrink: 0,
            padding: "6px 14px", borderRadius: 99,
            fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none",
            transition: "all 150ms",
            background: filtro === null ? "#3b0764" : "rgba(255,255,255,0.06)",
            color: filtro === null ? "white" : "rgba(255,255,255,0.45)",
          }}
        >
          Todas
          <span style={{
            marginLeft: 6, fontSize: 11, fontWeight: 700,
            background: filtro === null ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)",
            borderRadius: 99, padding: "1px 7px",
            color: filtro === null ? "white" : "rgba(255,255,255,0.50)",
          }}>
            {lista.length}
          </span>
        </button>

        {/* Um chip por mesa */}
        {lista.map(c => (
          <button
            key={c.id}
            data-active={filtro === c.mesa}
            onClick={() => onFiltro(filtro === c.mesa ? null : c.mesa)}
            style={{
              flexShrink: 0,
              padding: "6px 14px", borderRadius: 99,
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none",
              transition: "all 150ms",
              background: filtro === c.mesa ? "#3b0764" : "rgba(255,255,255,0.06)",
              color: filtro === c.mesa ? "white" : "rgba(255,255,255,0.45)",
            }}
          >
            {c.mesa}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 700,
              color: filtro === c.mesa ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.30)",
              fontFamily: "monospace",
            }}>
              {currency.format(c.total)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Card de comanda ─────────────────────────────────────────────────────────

function ComandaCard({
  comanda,
  onPago,
}: {
  comanda: ComandaPendente;
  onPago: (metodo: PagamentoMetodo) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [pago, setPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pagar = (metodo: PagamentoMetodo) => {
    setError(null);
    startTransition(async () => {
      const result = await registrarPagamento(comanda.id, metodo);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMetodoPago(METODO_LABEL[metodo]);
        setPago(true);
        onPago(metodo);
      }
    });
  };

  const minutos = Math.floor((Date.now() - new Date(comanda.aberta_em).getTime()) / 60000);
  const tempo = minutos < 60
    ? `${minutos}min`
    : `${Math.floor(minutos / 60)}h${minutos % 60 > 0 ? ` ${minutos % 60}min` : ""}`;

  if (pago) {
    return (
      <div style={{
        background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
        borderRadius: 12, padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(74,222,128,0.9)", margin: 0 }}>
            ✓ {comanda.mesa}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>
            Pago via {metodoPago}
          </p>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.40)", margin: 0, fontFamily: "monospace" }}>
          {currency.format(comanda.total)}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>{comanda.mesa}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>Aberta há {tempo}</p>
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "white", margin: 0, fontFamily: "monospace" }}>
          {currency.format(comanda.total)}
        </p>
      </div>

      {/* Itens */}
      {comanda.itens.length > 0 && (
        <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {comanda.itens.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
                <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 8 }}>{item.quantidade}×</span>
                {item.nome}
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: "monospace" }}>
                {currency.format(item.preco_total)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagamento */}
      <div style={{ padding: "14px 20px" }}>
        {error && (
          <p style={{ fontSize: 12, color: "rgba(239,68,68,0.9)", margin: "0 0 10px" }}>{error}</p>
        )}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
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
                background: m.key === "cortesia" ? "rgba(255,165,0,0.08)" : "rgba(76,29,149,0.22)",
                border: m.key === "cortesia" ? "1px solid rgba(255,165,0,0.18)" : "1px solid rgba(109,40,217,0.28)",
                color: m.key === "cortesia" ? "rgba(255,165,0,0.85)" : "rgba(196,167,255,0.85)",
                fontSize: 13, fontWeight: 600,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.55 : 1,
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

// ─── Shell principal ──────────────────────────────────────────────────────────

export function CaixaTela({
  comandas,
  insights,
  barNome,
}: {
  comandas: ComandaPendente[];
  insights: CaixaInsights;
  barNome: string;
}) {
  const [listaAtual, setListaAtual] = useState(comandas);
  const [insightsAtual, setInsightsAtual] = useState(insights);
  const [filtro, setFiltro] = useState<string | null>(null);

  const listaFiltrada = filtro
    ? listaAtual.filter(c => c.mesa === filtro)
    : listaAtual;

  const onPago = (comanda: ComandaPendente, metodo: PagamentoMetodo) => {
    // Atualiza insights otimisticamente
    setInsightsAtual(prev => {
      const novoTotal = prev.totalTurno + comanda.total;
      const novaQtd = prev.comandasPagas + 1;
      const metodosAtuais = [...prev.porMetodo];
      const idx = metodosAtuais.findIndex(m => m.metodo === metodo);
      if (idx >= 0) {
        metodosAtuais[idx] = {
          ...metodosAtuais[idx],
          total: metodosAtuais[idx].total + comanda.total,
          quantidade: metodosAtuais[idx].quantidade + 1,
        };
      } else {
        metodosAtuais.push({ metodo, total: comanda.total, quantidade: 1 });
      }
      return { totalTurno: novoTotal, comandasPagas: novaQtd, ticketMedio: novoTotal / novaQtd, porMetodo: metodosAtuais };
    });

    // Remove da lista após 1.5s (dá tempo de ver o "✓ Pago")
    setTimeout(() => {
      setListaAtual(prev => {
        const nova = prev.filter(c => c.id !== comanda.id);
        // Se era a única da mesa filtrada, limpa filtro
        if (filtro === comanda.mesa && nova.filter(c => c.mesa === comanda.mesa).length === 0) {
          setFiltro(null);
        }
        return nova;
      });
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0a0a10",
        position: "sticky", top: 0, zIndex: 10,
        height: 56,
        boxSizing: "border-box",
      }}>
        <div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            {barNome}
          </p>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "white", margin: "2px 0 0" }}>Caixa</h1>
        </div>
        <div style={{
          background: listaAtual.length > 0 ? "rgba(239,68,68,0.10)" : "rgba(74,222,128,0.10)",
          border: `1px solid ${listaAtual.length > 0 ? "rgba(239,68,68,0.20)" : "rgba(74,222,128,0.20)"}`,
          borderRadius: 99, padding: "5px 14px",
          fontSize: 13, fontWeight: 600,
          color: listaAtual.length > 0 ? "rgba(239,68,68,0.9)" : "rgba(74,222,128,0.9)",
        }}>
          {listaAtual.length > 0
            ? `${listaAtual.length} pendente${listaAtual.length > 1 ? "s" : ""}`
            : "Caixa limpo ✓"}
        </div>
      </div>

      {/* Insights */}
      <InsightsBar insights={insightsAtual} />

      {/* Chips de mesa — só aparece se tiver mais de 1 comanda */}
      {listaAtual.length > 1 && (
        <MesaChips lista={listaAtual} filtro={filtro} onFiltro={setFiltro} />
      )}

      {/* Comandas */}
      <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {listaAtual.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "80px 0", gap: 8,
          }}>
            <p style={{ fontSize: 36, margin: 0 }}>✓</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "white", margin: 0 }}>Nada pendente</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Todas as comandas foram pagas.
            </p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Nenhuma comanda para {filtro}.
            </p>
          </div>
        ) : (
          listaFiltrada.map(c => (
            <ComandaCard
              key={c.id}
              comanda={c}
              onPago={(metodo) => onPago(c, metodo)}
            />
          ))
        )}
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
