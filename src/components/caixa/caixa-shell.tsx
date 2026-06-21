"use client";

import { useState, useTransition } from "react";
import { Receipt, LayoutGrid, Clock, Package } from "lucide-react";
import { CaixaTela } from "./caixa-tela";
import { AppHeader } from "@/components/ui/app-header";
import { abrirTurno, fecharTurno } from "@/lib/dashboard/turno-actions";
import type { ComandaPendente, CaixaInsights } from "@/lib/caixa/queries";
import type { MesaComStatus } from "@/lib/bartender/queries";
import type { AlertaEstoque } from "@/lib/dashboard/queries";
import type { Turno } from "@/types/database";

type Tab = "comandas" | "mesas" | "turno" | "estoque";

const TABS: { id: Tab; label: string; Icon: React.FC<{ style?: React.CSSProperties }> }[] = [
  { id: "comandas", label: "Comandas", Icon: ({ style }) => <Receipt style={style} strokeWidth={1.75} /> },
  { id: "mesas",    label: "Mesas",    Icon: ({ style }) => <LayoutGrid style={style} strokeWidth={1.75} /> },
  { id: "turno",    label: "Turno",    Icon: ({ style }) => <Clock style={style} strokeWidth={1.75} /> },
  { id: "estoque",  label: "Estoque",  Icon: ({ style }) => <Package style={style} strokeWidth={1.75} /> },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Tab: Mesas ───────────────────────────────────────────────────────────────

function TabMesas({ mesas }: { mesas: MesaComStatus[] }) {
  const livre           = mesas.filter(m => !m.comanda).length;
  const aberta          = mesas.filter(m => m.comanda?.status === "aberta").length;
  const aguardando      = mesas.filter(m => m.comanda?.status === "aguardando_pagamento").length;

  return (
    <div style={{ padding: "20px 20px 32px", overflowY: "auto", height: "100%" }}>
      {/* Resumo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Livres",     count: livre,       color: "var(--fg-subtle)" },
          { label: "Abertas",    count: aberta,      color: "var(--ok)" },
          { label: "Quer pagar", count: aguardando,  color: "var(--danger)" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", padding: "12px 8px",
            background: "color-mix(in srgb, var(--fg) 4%, transparent)",
            borderRadius: 8, border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0, fontFamily: "var(--font-mono)" }}>{s.count}</p>
            <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid de mesas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 8 }}>
        {mesas.map(({ mesa, comanda }) => {
          const status = !comanda ? "livre" : comanda.status;
          const bg =
            status === "aguardando_pagamento" ? "color-mix(in srgb, var(--danger) 15%, transparent)" :
            status === "aberta"               ? "color-mix(in srgb, var(--ok) 12%, transparent)" :
                                               "color-mix(in srgb, var(--fg) 5%, transparent)";
          const cor =
            status === "aguardando_pagamento" ? "var(--danger)" :
            status === "aberta"               ? "var(--ok)" :
                                               "var(--fg-subtle)";
          return (
            <div key={mesa.id} style={{
              background: bg, borderRadius: 8,
              border: `1px solid ${status === "livre" ? "var(--border)" : cor}`,
              padding: "10px 6px", textAlign: "center",
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: cor, margin: 0, fontFamily: "var(--font-mono)" }}>
                {mesa.nome ?? mesa.numero}
              </p>
              {comanda && (
                <p style={{ fontSize: 10, color: cor, margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
                  {currency.format(comanda.total)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Turno ──────────────────────────────────────────────────────────────

function TabTurno({ turno, barNome }: { turno: Turno | null; barNome: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const abrir = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await abrirTurno();
      if (r?.error) setMsg({ tipo: "erro", texto: r.error });
      else setMsg({ tipo: "ok", texto: "Turno aberto com sucesso." });
    });
  };

  const fechar = () => {
    if (!turno) return;
    setMsg(null);
    startTransition(async () => {
      const r = await fecharTurno(turno.id);
      if (r?.error) setMsg({ tipo: "erro", texto: r.error });
      else setMsg({ tipo: "ok", texto: "Turno encerrado." });
    });
  };

  const duracao = turno ? (() => {
    const mins = Math.floor((Date.now() - new Date(turno.created_at).getTime()) / 60000);
    return mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ""}`;
  })() : null;

  return (
    <div style={{ padding: "20px 20px 32px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status */}
      <div style={{
        padding: "20px", borderRadius: 10,
        background: turno ? "color-mix(in srgb, var(--ok) 10%, transparent)" : "color-mix(in srgb, var(--fg) 5%, transparent)",
        border: `1px solid ${turno ? "color-mix(in srgb, var(--ok) 25%, transparent)" : "var(--border)"}`,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>
          {barNome}
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: turno ? "var(--ok)" : "var(--fg-subtle)", margin: 0, fontFamily: "var(--font-mono)" }}>
          {turno ? `● Turno aberto` : "○ Nenhum turno"}
        </p>
        {turno && duracao && (
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "6px 0 0" }}>em andamento há {duracao}</p>
        )}
      </div>

      {/* Stats do turno */}
      {turno && (
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Faturado",  value: currency.format(turno.total_vendas) },
            { label: "Comandas",  value: String(turno.total_comandas) },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, padding: "14px 16px",
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              borderRadius: 8, border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem */}
      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: msg.tipo === "ok" ? "var(--ok-bg)" : "var(--danger-bg)",
          color: msg.tipo === "ok" ? "var(--ok)" : "var(--danger)",
          fontSize: 14, fontWeight: 600,
        }}>
          {msg.texto}
        </div>
      )}

      {/* Ação */}
      {turno ? (
        <button
          onClick={fechar}
          disabled={isPending}
          style={{
            padding: "18px", borderRadius: 8, border: "none",
            background: "color-mix(in srgb, var(--danger) 12%, transparent)",
            color: "var(--danger)", fontSize: 16, fontWeight: 700,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1, transition: "opacity 150ms",
          }}
        >
          {isPending ? "Encerrando..." : "Encerrar turno"}
        </button>
      ) : (
        <button
          onClick={abrir}
          disabled={isPending}
          style={{
            padding: "18px", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "var(--accent-fg)",
            fontSize: 16, fontWeight: 700,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1, transition: "opacity 150ms",
          }}
        >
          {isPending ? "Abrindo..." : "Abrir turno"}
        </button>
      )}
    </div>
  );
}

// ─── Tab: Estoque ────────────────────────────────────────────────────────────

function TabEstoque({ alertas }: { alertas: AlertaEstoque[] }) {
  if (alertas.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
        <p style={{ fontSize: 32, margin: 0 }}>✓</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Estoque ok</p>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Nenhum insumo abaixo do mínimo.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 32px", overflowY: "auto", height: "100%" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>
        {alertas.length} insumo{alertas.length > 1 ? "s" : ""} abaixo do mínimo
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alertas.map(a => (
          <div key={a.produtoNome} style={{
            padding: "14px 16px", borderRadius: 8,
            background: "var(--danger-bg)",
            border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{a.produtoNome}</p>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--danger)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {a.quantidadeAtual}
              </p>
              <p style={{ fontSize: 10, color: "var(--fg-subtle)", margin: "2px 0 0" }}>mín. {a.quantidadeMinima}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export function CaixaShell({
  comandas, insights, mesas, turno, alertas, barNome, barId, turnoId,
}: {
  comandas: ComandaPendente[];
  insights: CaixaInsights;
  mesas: MesaComStatus[];
  turno: Turno | null;
  alertas: AlertaEstoque[];
  barNome: string;
  barId: string;
  turnoId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("comandas");

  const badges: Partial<Record<Tab, number>> = {
    comandas: comandas.length || undefined,
    estoque:  alertas.length  || undefined,
  };

  return (
    <div style={{ display: "flex", height: "100dvh", background: "var(--bg)", color: "var(--fg)" }}>

      {/* ── Sidebar de navegação (lg+) ── */}
      <nav
        className="hidden lg:flex"
        style={{
          width: 88, flexShrink: 0,
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          paddingTop: 16, paddingBottom: 16,
          gap: 4,
        }}
      >
        {/* Logo / nome */}
        <p style={{
          fontSize: 10, fontWeight: 700, color: "var(--fg-subtle)",
          textTransform: "uppercase", letterSpacing: "0.14em",
          textAlign: "center", margin: "0 0 16px", padding: "0 8px",
        }}>
          {barNome.split(" ")[0]}
        </p>

        {TABS.map(({ id, label, Icon }) => {
          const ativo = tab === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 6, padding: "14px 8px",
                margin: "0 8px", borderRadius: 10, border: "none",
                background: ativo ? "var(--accent)" : "transparent",
                color: ativo ? "var(--accent-fg)" : "var(--fg-subtle)",
                cursor: "pointer", position: "relative",
                transition: "background 150ms, color 150ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon style={{ width: 24, height: 24 }} />
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </span>
              {badge ? (
                <span style={{
                  position: "absolute", top: 8, right: 8,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: ativo ? "rgba(255,255,255,0.25)" : "var(--danger)",
                  color: "#fff", fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px",
                }}>
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* ── Conteúdo ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header mobile */}
        <div className="lg:hidden flex-shrink-0">
          <AppHeader barNome={barNome} roleLabel="Caixa" />
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {tab === "comandas" && turnoId ? (
            <CaixaTela
              comandas={comandas}
              insights={insights}
              barNome={barNome}
              barId={barId}
              turnoId={turnoId}
              embedded
            />
          ) : tab === "comandas" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ fontSize: 14, color: "var(--fg-subtle)" }}>Abra um turno para ver as comandas.</p>
            </div>
          ) : tab === "mesas" && turnoId ? (
            <TabMesas mesas={mesas} />
          ) : tab === "mesas" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ fontSize: 14, color: "var(--fg-subtle)" }}>Abra um turno para ver as mesas.</p>
            </div>
          ) : tab === "turno" ? (
            <TabTurno turno={turno} barNome={barNome} />
          ) : (
            <TabEstoque alertas={alertas} />
          )}
        </div>

        {/* ── Bottom nav (mobile) ── */}
        <nav
          className="lg:hidden"
          style={{
            display: "flex", flexShrink: 0,
            borderTop: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const ativo = tab === id;
            const badge = badges[id];
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 5, padding: "12px 4px 14px",
                  border: "none", background: "transparent",
                  color: ativo ? "var(--accent-bright)" : "var(--fg-subtle)",
                  cursor: "pointer", position: "relative",
                  WebkitTapHighlightColor: "transparent",
                  transition: "color 150ms",
                }}
              >
                <Icon style={{ width: 22, height: 22 }} />
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </span>
                {badge ? (
                  <span style={{
                    position: "absolute", top: 8, right: "calc(50% - 20px)",
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: "var(--danger)", color: "#fff",
                    fontSize: 9, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                  }}>
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
