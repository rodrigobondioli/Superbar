"use client";

import { useState, useTransition } from "react";
import { registrarPagamento } from "@/lib/caixa/actions";
import type { ComandaPendente, CaixaInsights } from "@/lib/caixa/queries";
import type { PagamentoMetodo } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const METODOS: { key: PagamentoMetodo; label: string; icon: string }[] = [
  { key: "pix",      label: "Pix",      icon: "⚡" },
  { key: "debito",   label: "Débito",   icon: "💳" },
  { key: "credito",  label: "Crédito",  icon: "💳" },
  { key: "dinheiro", label: "Dinheiro", icon: "💵" },
  { key: "cortesia", label: "Cortesia", icon: "🎁" },
];

const METODO_LABEL: Record<PagamentoMetodo, string> = {
  pix: "Pix", debito: "Débito", credito: "Crédito",
  dinheiro: "Dinheiro", cortesia: "Cortesia",
};

// ─── Insights bar ────────────────────────────────────────────────────────────

function InsightsBar({ insights }: { insights: CaixaInsights }) {
  return (
    <div style={{ padding: "20px 24px 20px" }}>

      {/* 3 stats */}
      <div style={{ display: "flex", gap: 0 }}>
        {[
          { label: "Faturado", value: currency.format(insights.totalTurno),  primary: true },
          { label: "Pagas",    value: String(insights.comandasPagas),         primary: false },
          { label: "Ticket",   value: currency.format(insights.ticketMedio),  primary: false },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: i === 0 ? 2 : 1,
            paddingLeft: i > 0 ? 20 : 0,
            marginLeft: i > 0 ? 20 : 0,
            borderLeft: i > 0 ? "1px solid var(--border)" : "none",
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 5px" }}>
              {s.label}
            </p>
            <p style={{
              fontSize: i === 0 ? 26 : 20, fontWeight: 800,
              color: i === 0 ? "var(--fg)" : "var(--fg-muted)",
              margin: 0, letterSpacing: i === 0 ? "-0.6px" : "-0.3px",
              fontVariantNumeric: "tabular-nums", lineHeight: 1,
              fontFamily: "var(--font-mono)",
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Métodos */}
      {insights.porMetodo.length > 0 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          {insights.porMetodo.map(m => (
            <span key={m.metodo} style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              <span style={{ color: "var(--fg-subtle)" }}>{METODO_LABEL[m.metodo]}</span>
              {" "}<span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>{currency.format(m.total)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mesa chips ───────────────────────────────────────────────────────────────

function MesaChips({
  lista, filtro, onFiltro,
}: {
  lista: ComandaPendente[];
  filtro: string | null;
  onFiltro: (mesa: string | null) => void;
}) {
  return (
    <div
      className="hide-scrollbar"
      style={{
        position: "sticky", top: 56, zIndex: 9,
        padding: "0 20px 14px",
        display: "flex", gap: 6,
        overflowX: "auto",
        background: "var(--bg)",
      }}
    >
      <button
        onClick={() => onFiltro(null)}
        style={{
          flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "9px 14px", borderRadius: 8, border: "none",
          background: filtro === null
            ? "color-mix(in srgb, var(--accent) 35%, transparent)"
            : "color-mix(in srgb, var(--fg) 5%, transparent)",
          cursor: "pointer", transition: "background 150ms", minWidth: 56,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: filtro === null ? "var(--fg)" : "var(--fg-muted)" }}>
          Todas
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: filtro === null ? "var(--accent-bright)" : "var(--fg-subtle)" }}>
          {lista.length}
        </span>
      </button>

      {lista.map(c => {
        const ativo = filtro === c.mesa;
        return (
          <button
            key={c.id}
            onClick={() => onFiltro(ativo ? null : c.mesa)}
            style={{
              flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
              padding: "9px 14px", borderRadius: 8, border: "none",
              background: ativo
                ? "color-mix(in srgb, var(--accent) 35%, transparent)"
                : "color-mix(in srgb, var(--fg) 5%, transparent)",
              cursor: "pointer", transition: "background 150ms", minWidth: 72, textAlign: "left",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: ativo ? "var(--fg)" : "var(--fg-muted)", whiteSpace: "nowrap" }}>
              {c.mesa}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: ativo ? "var(--accent-bright)" : "var(--fg-subtle)", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
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
  comanda, onConfirm, onClose,
}: {
  comanda: ComandaPendente;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const valid = motivo.trim().length > 0;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 50 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
        borderRadius: "8px 8px 0 0", padding: "24px 24px 40px", zIndex: 51,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 5px" }}>
          Cortesia — {comanda.mesa}
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px", fontFamily: "var(--font-mono)" }}>Qual o motivo?</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MOTIVOS_RAPIDOS.map(m => (
            <button
              key={m}
              onClick={() => setMotivo(m)}
              style={{
                padding: "7px 14px", borderRadius: 4, border: "none",
                background: motivo === m
                  ? "color-mix(in srgb, var(--accent-bright) 20%, transparent)"
                  : "color-mix(in srgb, var(--fg) 6%, transparent)",
                color: motivo === m ? "var(--accent-bright)" : "var(--fg-muted)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 150ms",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <input
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Ou escreva o motivo..."
          style={{
            width: "100%", boxSizing: "border-box",
            background: "var(--bg-inset)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "13px 16px",
            fontSize: 14, color: "var(--fg)", outline: "none", marginBottom: 16,
            colorScheme: "dark",
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", background: "color-mix(in srgb, var(--fg) 6%, transparent)", border: "none", borderRadius: 8, color: "var(--fg-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={() => valid && onConfirm(motivo.trim())}
            disabled={!valid}
            style={{
              flex: 2, padding: "14px", border: "none", borderRadius: 8,
              background: valid
                ? "color-mix(in srgb, var(--accent-bright) 25%, transparent)"
                : "color-mix(in srgb, var(--fg) 4%, transparent)",
              color: valid ? "var(--accent-bright)" : "var(--fg-subtle)",
              fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "default", transition: "all 150ms",
            }}
          >
            Confirmar cortesia
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Card de comanda ──────────────────────────────────────────────────────────

function ComandaCard({ comanda, onPago }: { comanda: ComandaPendente; onPago: (metodo: PagamentoMetodo) => void }) {
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
  const tempo = minutos < 60 ? `${minutos}min` : `${Math.floor(minutos / 60)}h${minutos % 60 > 0 ? ` ${minutos % 60}min` : ""}`;

  if (pago) {
    return (
      /* ok token — semantic allowed in Caixa */
      <div style={{
        background: "var(--ok-bg)",
        border: "1px solid color-mix(in srgb, var(--ok) 20%, transparent)",
        borderRadius: 8, padding: "18px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ok)", margin: 0 }}>✓ {comanda.mesa}</p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "3px 0 0" }}>Pago via {metodoPago}</p>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-muted)", margin: 0, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
          {currency.format(comanda.total)}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "color-mix(in srgb, var(--fg) 4%, transparent)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
      {/* Header do card */}
      <div style={{ padding: "16px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 17, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.3px" }}>{comanda.mesa}</p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "3px 0 0" }}>aberta há {tempo}</p>
        </div>
        <p style={{ fontSize: 24, fontWeight: 900, color: "var(--fg)", margin: 0, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
          {currency.format(comanda.total)}
        </p>
      </div>

      {/* Itens */}
      {comanda.itens.length > 0 && (
        <div style={{ padding: "0 20px 14px" }}>
          {comanda.itens.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                <span style={{ color: "var(--fg-subtle)", marginRight: 7 }}>{item.quantidade}×</span>
                {item.nome}
              </p>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}>
                {currency.format(item.preco_total)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagamento */}
      <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border)" }}>
        {/* danger token — semantic allowed in Caixa */}
        {error && <p style={{ fontSize: 12, color: "var(--danger)", margin: "0 0 10px" }}>{error}</p>}

        {/* Primários: Pix e Dinheiro */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {(["pix", "dinheiro"] as PagamentoMetodo[]).map(key => {
            const m = METODOS.find(x => x.key === key)!;
            return (
              <button
                key={key}
                onClick={() => pagar(key)}
                disabled={isPending}
                style={{
                  flex: 1, height: 64,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "color-mix(in srgb, var(--fg) 9%, transparent)", borderRadius: 8, border: "none",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.5 : 1,
                  transition: "background 150ms",
                }}
              >
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secundários: Débito, Crédito, Cortesia */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["debito", "credito", "cortesia"] as PagamentoMetodo[]).map(key => {
            const m = METODOS.find(x => x.key === key)!;
            const isCortesia = key === "cortesia";
            return (
              <button
                key={key}
                onClick={() => isCortesia ? setShowCortesia(true) : pagar(key)}
                disabled={isPending}
                style={{
                  flex: 1, height: 52,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  /* warn token for cortesia — semantic allowed in Caixa */
                  background: isCortesia
                    ? "color-mix(in srgb, var(--warn) 12%, transparent)"
                    : "color-mix(in srgb, var(--fg) 5%, transparent)",
                  borderRadius: 8, border: "none",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.5 : 1,
                  transition: "background 150ms",
                }}
              >
                <span style={{ fontSize: 15 }}>{m.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: isCortesia ? "var(--warn)" : "var(--fg-muted)" }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {showCortesia && (
        <CortesiaModal
          comanda={comanda}
          onConfirm={motivo => { setShowCortesia(false); pagar("cortesia", motivo); }}
          onClose={() => setShowCortesia(false)}
        />
      )}
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export function CaixaTela({ comandas, insights, barNome }: {
  comandas: ComandaPendente[];
  insights: CaixaInsights;
  barNome: string;
}) {
  const [listaAtual, setListaAtual] = useState(comandas);
  const [insightsAtual, setInsightsAtual] = useState(insights);
  const [filtro, setFiltro] = useState<string | null>(null);

  const listaFiltrada = filtro ? listaAtual.filter(c => c.mesa === filtro) : listaAtual;

  const onPago = (comanda: ComandaPendente, metodo: PagamentoMetodo) => {
    setInsightsAtual(prev => {
      const novoTotal = prev.totalTurno + comanda.total;
      const novaQtd = prev.comandasPagas + 1;
      const metodosAtuais = [...prev.porMetodo];
      const idx = metodosAtuais.findIndex(m => m.metodo === metodo);
      if (idx >= 0) {
        metodosAtuais[idx] = { ...metodosAtuais[idx], total: metodosAtuais[idx].total + comanda.total, quantidade: metodosAtuais[idx].quantidade + 1 };
      } else {
        metodosAtuais.push({ metodo, total: comanda.total, quantidade: 1 });
      }
      return { totalTurno: novoTotal, comandasPagas: novaQtd, ticketMedio: novoTotal / novaQtd, porMetodo: metodosAtuais };
    });

    setTimeout(() => {
      setListaAtual(prev => {
        const nova = prev.filter(c => c.id !== comanda.id);
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
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--bg)",
        height: 56, boxSizing: "border-box",
      }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{barNome}</p>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>Caixa</h1>
        </div>
        {/* ok token — semantic allowed in Caixa */}
        {listaAtual.length === 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ok)" }}>Caixa limpo ✓</span>
        )}
      </div>

      <InsightsBar insights={insightsAtual} />

      {listaAtual.length > 1 && (
        <MesaChips lista={listaAtual} filtro={filtro} onFiltro={setFiltro} />
      )}

      <div style={{ height: 1, background: "var(--border)" }} />
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {listaAtual.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 8 }}>
            <p style={{ fontSize: 36, margin: 0, color: "var(--ok)" }}>✓</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Nada pendente</p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Todas as comandas foram pagas.</p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Nenhuma comanda para {filtro}.</p>
          </div>
        ) : (
          listaFiltrada.map(c => (
            <ComandaCard key={c.id} comanda={c} onPago={metodo => onPago(c, metodo)} />
          ))
        )}
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
