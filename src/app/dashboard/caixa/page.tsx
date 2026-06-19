import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getComandasPendentes } from "@/lib/caixa/queries";
import { CaixaComandas } from "@/components/caixa/caixa-comandas";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "white", margin: 0 }}>Caixa</h1>
        <div style={{
          marginTop: 32, background: "rgba(255,255,255,0.04)", borderRadius: 12,
          padding: "48px 32px", textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0 }}>
            Nenhum turno aberto. Abra um turno em <strong style={{ color: "white" }}>Turnos</strong> para começar.
          </p>
        </div>
      </div>
    );
  }

  const comandas = await getComandasPendentes(current.bar.id, turno.id);

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Turno aberto
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "white", margin: "6px 0 0" }}>Caixa</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "6px 0 0" }}>
            Comandas aguardando pagamento
          </p>
        </div>
        <div style={{
          background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.20)",
          borderRadius: 10, padding: "10px 16px", textAlign: "right",
        }}>
          <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pendentes</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "white", margin: "4px 0 0" }}>{comandas.length}</p>
        </div>
      </div>

      {comandas.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 12,
          padding: "64px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>Caixa limpo!</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", margin: "8px 0 0" }}>
            Nenhuma comanda aguardando pagamento.
          </p>
        </div>
      ) : (
        <CaixaComandas comandas={comandas} />
      )}
    </div>
  );
}
