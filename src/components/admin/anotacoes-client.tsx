"use client";

import { useState, useTransition } from "react";
import { StickyNote, Ticket, Lightbulb, Check, Archive, Trash2, RotateCcw } from "lucide-react";
import type { AnotacaoComBar } from "@/lib/anotacoes/queries";
import type { AnotacaoStatus } from "@/types/database";
import { criarNota, atualizarStatusAnotacao, deletarAnotacao } from "@/lib/anotacoes/actions";

type Sub = "tickets" | "notas" | "sugestoes";

const STATUS_CFG: Record<AnotacaoStatus, { label: string; cor: string }> = {
  aberto:    { label: "Aberto",    cor: "var(--warn)" },
  resolvido: { label: "Resolvido", cor: "var(--ok)" },
  arquivado: { label: "Arquivado", cor: "var(--fg-subtle)" },
};

const card: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 8,
};
const inp: React.CSSProperties = {
  width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "12px", fontSize: 14, color: "var(--fg)", outline: "none",
  colorScheme: "dark", boxSizing: "border-box",
};

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: AnotacaoStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: c.cor, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.cor }} />
      {c.label}
    </span>
  );
}

function AcoesStatus({ id, status }: { id: string; status: AnotacaoStatus }) {
  const [pending, start] = useTransition();
  const set = (s: AnotacaoStatus) => start(() => { atualizarStatusAnotacao(id, s); });
  const btn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5, background: "transparent",
    border: "1px solid var(--border-strong)", borderRadius: 999, padding: "5px 12px",
    fontSize: 12, color: "var(--fg-muted)", cursor: pending ? "default" : "pointer",
  };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {status !== "resolvido" && (
        <button style={btn} disabled={pending} onClick={() => set("resolvido")}>
          <Check style={{ width: 13, height: 13 }} /> Resolver
        </button>
      )}
      {status !== "arquivado" && (
        <button style={btn} disabled={pending} onClick={() => set("arquivado")}>
          <Archive style={{ width: 13, height: 13 }} /> Arquivar
        </button>
      )}
      {status !== "aberto" && (
        <button style={btn} disabled={pending} onClick={() => set("aberto")}>
          <RotateCcw style={{ width: 13, height: 13 }} /> Reabrir
        </button>
      )}
    </div>
  );
}

function ItemCard({ a, comExcluir = false }: { a: AnotacaoComBar; comExcluir?: boolean }) {
  const [pending, start] = useTransition();
  const origem = [a.autor_nome, a.bar_nome].filter(Boolean).join(" · ");
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {a.titulo && <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{a.titulo}</p>}
          {a.categoria && <span style={{ fontSize: 12, color: "var(--accent)" }}>{a.categoria}</span>}
        </div>
        <StatusBadge status={a.status} />
      </div>
      <p style={{ fontSize: 14, color: "var(--fg)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.corpo}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
          {origem ? `${origem} · ` : ""}{fmtData(a.created_at)}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <AcoesStatus id={a.id} status={a.status} />
          {comExcluir && (
            <button
              disabled={pending}
              onClick={() => { if (confirm("Excluir esta nota?")) start(() => { deletarAnotacao(a.id); }); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)", borderRadius: 999, padding: "5px 12px", fontSize: 12, color: "var(--danger)", cursor: "pointer" }}
            >
              <Trash2 style={{ width: 13, height: 13 }} /> Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ListaVazia({ texto }: { texto: string }) {
  return <p style={{ fontSize: 14, color: "var(--fg-muted)", padding: "24px 0" }}>{texto}</p>;
}

function NovaNota() {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function salvar() {
    setErro(null);
    start(async () => {
      const r = await criarNota({ titulo, corpo });
      if ("error" in r) setErro(r.error);
      else { setTitulo(""); setCorpo(""); }
    });
  }

  return (
    <div style={{ ...card, gap: 12 }}>
      <input style={inp} placeholder="Título (opcional)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <textarea style={{ ...inp, resize: "vertical", fontFamily: "inherit" } as React.CSSProperties} rows={3} placeholder="Sua ideia, melhoria, lembrete..." value={corpo} onChange={(e) => setCorpo(e.target.value)} />
      {erro && <span style={{ fontSize: 13, color: "var(--danger)" }}>{erro}</span>}
      <button
        onClick={salvar}
        disabled={pending || !corpo.trim()}
        style={{ alignSelf: "flex-start", background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "9px 20px", fontSize: 14, fontWeight: 500, cursor: pending || !corpo.trim() ? "default" : "pointer", opacity: !corpo.trim() ? 0.5 : 1 }}
      >
        {pending ? "Salvando..." : "Adicionar nota"}
      </button>
    </div>
  );
}

export function AnotacoesClient({
  tickets, notas, sugestoes,
}: {
  tickets: AnotacaoComBar[];
  notas: AnotacaoComBar[];
  sugestoes: AnotacaoComBar[];
}) {
  const [sub, setSub] = useState<Sub>("tickets");

  const abertos = (l: AnotacaoComBar[]) => l.filter((a) => a.status === "aberto").length;
  const abas: { id: Sub; label: string; Icon: typeof Ticket; badge: number }[] = [
    { id: "tickets",   label: "Tickets",   Icon: Ticket,     badge: abertos(tickets) },
    { id: "notas",     label: "Notas",     Icon: StickyNote, badge: 0 },
    { id: "sugestoes", label: "Sugestões", Icon: Lightbulb,  badge: abertos(sugestoes) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-abas */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-strong)" }}>
        {abas.map((t) => {
          const ativa = sub === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              style={{
                appearance: "none", background: "transparent", border: "none",
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 12px", cursor: "pointer", fontSize: 14,
                fontWeight: ativa ? 600 : 400,
                color: ativa ? "var(--fg)" : "var(--fg-muted)",
                borderBottom: `2px solid ${ativa ? "var(--accent)" : "transparent"}`,
                marginBottom: -1,
              }}
            >
              <t.Icon style={{ width: 15, height: 15, color: ativa ? "var(--accent)" : "var(--fg-subtle)" }} strokeWidth={1.75} />
              {t.label}
              {t.badge > 0 && (
                <span style={{ background: "var(--accent)", color: "var(--accent-fg)", fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {sub === "tickets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tickets.length === 0 ? <ListaVazia texto="Nenhum chamado ainda. Quando um bar abre um chamado no suporte, ele aparece aqui." />
            : tickets.map((a) => <ItemCard key={a.id} a={a} />)}
        </div>
      )}

      {sub === "notas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NovaNota />
          {notas.length === 0 ? <ListaVazia texto="Nenhuma nota ainda. Anote ideias de feature, melhorias e lembretes aqui." />
            : notas.map((a) => <ItemCard key={a.id} a={a} comExcluir />)}
        </div>
      )}

      {sub === "sugestoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sugestoes.length === 0 ? <ListaVazia texto="Nenhuma sugestão ainda. Quando um bar envia uma sugestão, ela cai aqui." />
            : sugestoes.map((a) => <ItemCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
