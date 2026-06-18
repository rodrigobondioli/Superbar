import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getMembrosEquipe } from "@/lib/equipe/queries";
import { convidarMembro } from "@/lib/equipe/actions";
import { LABEL, H1, SUBTITLE, CARD, BTN_PRIMARY, INPUT } from "@/lib/ui";
import { EquipeMembros } from "@/components/equipe/equipe-membros";

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
    <div style={{ padding: "32px 40px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={H1}>Equipe</h1>
        <p style={SUBTITLE}>
          {ativos.length} membro{ativos.length !== 1 ? "s" : ""} ativo{ativos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── 2-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ── Coluna esquerda ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Convidar */}
          {isDono && (
            <div style={{ ...CARD, padding: "20px 22px" }}>
              <p style={{ ...LABEL, marginBottom: 16 }}>Adicionar membro</p>
              <form action={convidarMembro} style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 10, alignItems: "flex-end" }}>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>E-mail</label>
                  <input name="email" type="email" required placeholder="nome@email.com" style={INPUT} />
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Função</label>
                  <select name="role" defaultValue="bartender" style={{ ...INPUT, colorScheme: "dark" }}>
                    <option value="gerente">Gerente</option>
                    <option value="bartender">Bartender</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </div>
                <button type="submit" style={{ ...BTN_PRIMARY, marginBottom: 1 }}>+ Adicionar</button>
              </form>
            </div>
          )}

          {/* Lista de membros (client component) */}
          <EquipeMembros
            ativos={ativos}
            inativos={inativos}
            isDono={isDono}
            currentUserId={current.userId}
          />
        </div>

        {/* ── Coluna direita: ranking ── */}
        <div style={{ position: "sticky", top: 0 }}>
          {ranking.length > 0 ? (
            <div style={{ ...CARD, padding: "20px 20px" }}>
              <p style={{ ...LABEL, marginBottom: 16 }}>🏆 Ranking · 30 dias</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ranking.map((m, i) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 8,
                    background: i === 0 ? "rgba(255,255,255,0.05)" : "transparent",
                    borderLeft: i === 0 ? "2px solid rgba(160,130,255,0.5)" : "2px solid transparent",
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, minWidth: 24, flexShrink: 0,
                      color: i === 0 ? "rgba(160,130,255,0.9)" : "rgba(255,255,255,0.25)",
                    }}>
                      {i + 1}º
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.nome}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", margin: "2px 0 0" }}>
                        {m.totalComandas} cmd · TM {fmt(m.ticketMedio)}
                      </p>
                    </div>
                    <p style={{
                      fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0, fontVariantNumeric: "tabular-nums",
                      color: "white",
                    }}>
                      {fmt(m.totalVendas)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.07)",
              borderRadius: 12, padding: 24,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>
                Ranking indisponível
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0, lineHeight: 1.5 }}>
                Os dados de performance aparecem aqui após o primeiro turno ser fechado.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
