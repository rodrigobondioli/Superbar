"use client";

import { useState, useTransition } from "react";
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

// ─── Mesa grid (navegação por mesas) ─────────────────────────────────────────

function MesaChips({
  lista,
  filtro,
  onFiltro,
}: {
  lista: ComandaPendente[];
  filtro: string | null;
  onFiltro: (mesa: string | null) => void;
}) {
  const todas = [null, ...lista.map(c => c.mesa)];

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "#0a0a10",
      position: "sticky", top: 56, zIndex: 9,
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(todas.length, 5)}, 1fr)`,
    }}>
      {/* Botão "Todas" */}
      <button
        onClick={() => onFiltro(null)}
        style={{
          padding: "13px 8px",
          border: "none",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: filtro === null ? "#3b0764" : "transparent",
          color: filtro === null ? "white" : "rgba(255,255,255,0.40)",
          fontSize: 12, fontWeight: 700,
          cursor: "pointer",
          transition: "background 150ms, color 150ms",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2,
        }}
      >
        <span>Todas</span>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: filtro === null ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)",
        }}>
          {lista.length}
        </span>
      </button>

      {/* Um botão por mesa */}
      {lista.map((c, i) => {
        const ativo = filtro === c.mesa;
        const isLast = i === lista.length - 1;
        return (
          <button
            key={c.id}
            onClick={() => onFiltro(ativo ? null : c.mesa)}
            style={{
              padding: "13px 8px",
              border: "none",
              borderRight: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
              background: ativo ? "#3b0764" : "transparent",
              color: ativo ? "white" : "rgba(255,255,255,0.40)",
              fontSize: 12, fontWeight: 700,
              cursor: "pointer",
              transition: "background 150ms, color 150ms",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 2,
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", padding: "0 4px" }}>
              {c.mesa}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500, fontFamily: "monospace",
              color: ativo ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.28)",
            }}>
              {currency.format(c.total)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Modal de cortesia ────────────────────────────────────────────────────────

const MOTIVOS_RAPIDOS = ["VIP / cliente especial", "Erro do preparo", "Aniversariante", "Parceiro / influencer", "Brinde da casa"];

function CortesiaModal({
  comanda,
  onConfirm,
  onClose,
}: {
  comanda: ComandaPendente;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const valid = motivo.trim().length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
        }}
      />
      {/* Painel */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#14141f",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "20px 20px 0 0",
        padding: "24px 24px 40px",
        zIndex: 51,
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 99,
          background: "rgba(255,255,255,0.15)",
          margin: "0 auto 20px",
        }} />

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
          Cortesia — {comanda.mesa}
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: "0 0 20px" }}>
          Qual o motivo?
        </h2>

        {/* Atalhos rápidos */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MOTIVOS_RAPIDOS.map(m => (
            <button
              key={m}
              onClick={() => setMotivo(m)}
              style={{
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid",
                borderColor: motivo === m ? "rgba(255,165,0,0.50)" : "rgba(255,255,255,0.10)",
                background: motivo === m ? "rgba(255,165,0,0.12)" : "rgba(255,255,255,0.04)",
                color: motivo === m ? "rgba(255,165,0,0.90)" : "rgba(255,255,255,0.50)",
                fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 150ms",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Campo livre */}
        <input
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Ou escreva o motivo..."
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10, padding: "13px 16px",
            fontSize: 14, color: "white",
            outline: "none", marginBottom: 16,
            colorScheme: "dark",
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "14px",
              background: "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 10,
              color: "rgba(255,255,255,0.50)",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => valid && onConfirm(motivo.trim())}
            disabled={!valid}
            style={{
              flex: 2, padding: "14px",
              background: valid ? "rgba(255,165,0,0.20)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${valid ? "rgba(255,165,0,0.35)" : "transparent"}`,
              borderRadius: 10,
              color: valid ? "rgba(255,165,0,0.95)" : "rgba(255,255,255,0.20)",
              fontSize: 14, fontWeight: 700,
              cursor: valid ? "pointer" : "default",
              transition: "all 150ms",
            }}
          >
            🎁 Confirmar cortesia
          </button>
        </div>
      </div>
    </>
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
  const [showCortesia, setShowCortesia] = useState(false);

  const pagar = (metodo: PagamentoMetodo, motivo?: string) => {
    setError(null);
    startTransition(async () => {
      const result = await registrarPagamento(comanda.id, metodo, motivo);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMetodoPago(metodo === "cortesia" ? `Cortesia${motivo ? ` — ${motivo}` : ""}` : METODO_LABEL[metodo]);
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
              onClick={() => m.key === "cortesia" ? setShowCortesia(true) : pagar(m.key)}
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

      {/* Modal de cortesia */}
      {showCortesia && (
        <CortesiaModal
          comanda={comanda}
          onConfirm={(motivo) => { setShowCortesia(false); pagar("cortesia", motivo); }}
          onClose={() => setShowCortesia(false)}
        />
      )}
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
        {listaAtual.length === 0 && (
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: "rgba(74,222,128,0.9)",
          }}>
            Caixa limpo ✓
          </span>
        )}
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
