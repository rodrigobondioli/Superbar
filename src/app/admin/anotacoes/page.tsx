import { listarAnotacoes } from "@/lib/anotacoes/queries";
import { AnotacoesClient } from "@/components/admin/anotacoes-client";

export default async function AdminAnotacoesPage() {
  const [tickets, notas, sugestoes] = await Promise.all([
    listarAnotacoes("ticket"),
    listarAnotacoes("nota"),
    listarAnotacoes("sugestao"),
  ]);

  const abertos = tickets.filter((t) => t.status === "aberto").length
    + sugestoes.filter((s) => s.status === "aberto").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header — padrão */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Anotações</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            suas notas, chamados e sugestões dos bares num lugar só
            {abertos > 0 && ` · ${abertos} em aberto`}
          </p>
        </div>
        <time style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </time>
      </div>

      <AnotacoesClient tickets={tickets} notas={notas} sugestoes={sugestoes} />
    </div>
  );
}
