import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getMembrosEquipe } from "@/lib/equipe/queries";
import { LABEL, CARD } from "@/lib/ui";
import { EquipeMembros } from "@/components/equipe/equipe-membros";
import { ConvidarForm } from "@/components/equipe/convidar-form";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function EquipePage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const membros = await getMembrosEquipe(current.bar.id);
  const ativos   = membros.filter(m => m.ativo);
  const inativos = membros.filter(m => !m.ativo);

  const ranking = [...ativos]
    .filter(m => m.totalComandas > 0)
    .sort((a, b) => b.totalVendas - a.totalVendas);

  const isDono = current.role === "dono";

  return (
    <div className="py-6 lg:px-10 lg:py-8">

      {/* ── Header — padrão Figma ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Equipe</h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          {ativos.length} {ativos.length === 1 ? "membro ativo" : "membros ativos"}
        </p>
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ── Coluna esquerda ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Convidar */}
          {isDono && <ConvidarForm />}

          {/* Lista de membros (client component) */}
          <EquipeMembros
            ativos={ativos}
            inativos={inativos}
            isDono={isDono}
            currentUserId={current.userId}
          />
        </div>

        {/* ── Coluna direita: ranking ── */}
        <div className="lg:sticky lg:top-0">
          {ranking.length > 0 ? (
            <div style={{ ...CARD, padding: "20px 20px" }}>
              <p style={{ ...LABEL, marginBottom: 16 }}>Ranking · 30 dias</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ranking.map((m, i) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 4,
                    background: i === 0 ? "color-mix(in srgb, var(--fg) 5%, transparent)" : "transparent",
                    borderLeft: i === 0 ? "2px solid var(--accent-bright)" : "2px solid transparent",
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, minWidth: 24, flexShrink: 0,
                      color: i === 0 ? "var(--accent-bright)" : "var(--fg-subtle)",
                    }}>
                      {i + 1}º
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.nome}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
                        {m.totalComandas} cmd · TM {fmt(m.ticketMedio)}
                      </p>
                    </div>
                    <p style={{
                      fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0, fontVariantNumeric: "tabular-nums",
                      color: "var(--fg)", fontFamily: "var(--font-mono)",
                    }}>
                      {fmt(m.totalVendas)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: "var(--bg-elevated)",

              borderRadius: 4, padding: 24,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-muted)", margin: "0 0 6px" }}>
                Ranking indisponível
              </p>
              <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
                Os dados de performance aparecem aqui após o primeiro turno ser fechado.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
