import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import { getComandasPendentes } from "@/lib/caixa/queries";
import { CaixaComandas } from "@/components/caixa/caixa-comandas";
import { TurnoControles } from "@/components/dashboard/turno-controles";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const taxaServicoPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;
  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    return (
      <div className="py-6 lg:px-10 lg:py-8">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>Caixa</h1>
        <EmptyState
          icon="🔒"
          title="Turno não iniciado"
          description="Abra o turno para liberar a caixa e o bartender. Feche ao fim do atendimento para salvar os dados da noite."
          action={<TurnoControles turnoAtual={null} />}
        />
      </div>
    );
  }

  const comandas = await getComandasPendentes(current.bar.id, turno.id);

  return (
    <div className="py-6 lg:px-10 lg:py-8">
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Turno aberto
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", margin: "6px 0 0", fontFamily: "var(--font-mono)" }}>Caixa</h1>
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "6px 0 0" }}>
            Comandas aguardando pagamento
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Fechar turno */}
          <TurnoControles turnoAtual={turno} />
          {/* Contador de pendentes */}
          <div style={{
            background: "var(--ok-bg)", border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
            borderRadius: 8, padding: "10px 16px", textAlign: "right",
          }}>
            <p style={{ fontSize: 11, color: "var(--ok)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pendentes</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>{comandas.length}</p>
          </div>
        </div>
      </div>

      {comandas.length === 0 ? (
        <div style={{
          background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)",
          padding: "64px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, color: "var(--ok)" }}>✓</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Caixa limpo!</p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "8px 0 0" }}>
            Nenhuma comanda aguardando pagamento.
          </p>
        </div>
      ) : (
        <CaixaComandas comandas={comandas} taxaServicoPct={taxaServicoPct} />
      )}
    </div>
  );
}
