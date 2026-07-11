import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getEstoque, getMovimentosRecentes, getDinheiroParado } from "@/lib/estoque/queries";
import { EstoqueClient } from "@/components/estoque/estoque-client";
import { DinheiroParadoCard } from "@/components/estoque/dinheiro-parado-card";
import { EstoqueHeaderActions } from "@/components/estoque/estoque-header-actions";

export default async function EstoquePage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const [itens, movimentos, dinheiroParado] = await Promise.all([
    getEstoque(current.bar.id),
    getMovimentosRecentes(current.bar.id),
    getDinheiroParado(current.bar.id),
  ]);

  const zerados = itens.filter(i => i.quantidadeAtual <= 0).length;
  const abaixo = itens.filter(i => i.abaixoDoMinimo && i.quantidadeAtual > 0).length;
  const saudaveis = itens.filter(i => !i.abaixoDoMinimo && i.quantidadeAtual > 0).length;

  const semaforo = [
    { cor: "var(--danger)", label: "Críticos (zerados)", valor: zerados, desc: "precisam repor já" },
    { cor: "var(--warn)", label: "Abaixo do mínimo", valor: abaixo, desc: "repor esta semana" },
    { cor: "var(--ok)", label: "Estoque saudável", valor: saudaveis, desc: "tudo em dia" },
  ];

  return (
    <div className="py-6 lg:py-8 flex flex-col gap-4 lg:gap-6">

      {/* Header — padrão Figma */}
      <div className="max-lg:pb-4" style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Estoque</h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Controle de estoque e reposição inteligente</p>
        <EstoqueHeaderActions />
      </div>

      {/* Semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
        {semaforo.map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.cor, flexShrink: 0 }} />
              <span style={{ fontSize: 15, color: "var(--fg-muted)" }}>{s.label}</span>
            </div>
            <span style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.valor}</span>
            <span style={{ fontSize: 13, color: s.cor }}>{s.desc}</span>
          </div>
        ))}
      </div>

      {/* Dinheiro parado — só quando há sinal */}
      {dinheiroParado.itens.length > 0 && (
        <div className="max-w-xl">
          <DinheiroParadoCard dados={dinheiroParado} />
        </div>
      )}

      {/* Lista */}
      <EstoqueClient itens={itens} movimentos={movimentos} />
    </div>
  );
}
