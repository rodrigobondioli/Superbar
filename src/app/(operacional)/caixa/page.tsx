import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getComandasPendentes, getCaixaInsights } from "@/lib/caixa/queries";
import { CaixaTela } from "@/components/caixa/caixa-tela";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        background: "var(--bg)", padding: "0 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 32 }}>🔒</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Turno não aberto</p>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>
          O dono precisa abrir um turno antes de usar o caixa.
        </p>
      </div>
    );
  }

  const [comandas, insights] = await Promise.all([
    getComandasPendentes(current.bar.id, turno.id),
    getCaixaInsights(current.bar.id, turno.id),
  ]);

  return (
    <CaixaTela
      comandas={comandas}
      insights={insights}
      barNome={current.bar.nome}
      barId={current.bar.id}
      turnoId={turno.id}
    />
  );
}
