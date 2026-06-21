import Link from "next/link";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getComandasPendentes } from "@/lib/caixa/queries";
import { CaixaComandas } from "@/components/caixa/caixa-comandas";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const taxaServicoPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;
  const turno = await getTurnoAtual(current.bar.id);

  if (!turno) {
    return (
      <div className="py-6 lg:px-10 lg:py-8">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>Caixa</h1>
        <div style={{
          marginTop: 32, background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)",
          padding: "56px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <p style={{ fontSize: 28, margin: "0 0 14px" }}>🔒</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px" }}>
            Nenhum turno aberto
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 20px", lineHeight: 1.6, maxWidth: 280 }}>
            A caixa fica disponível durante o turno. Pagamentos e comandas aparecem aqui em tempo real.
          </p>
          <Link
            href="/dashboard/turnos"
            style={{
              display: "inline-block", padding: "10px 20px",
              background: "var(--accent)", color: "var(--accent-fg)",
              borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            Abrir turno →
          </Link>
        </div>
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
        {/* ok token — semantic color in this page (caixa context) */}
        <div style={{
          background: "var(--ok-bg)", border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
          borderRadius: 8, padding: "10px 16px", textAlign: "right",
        }}>
          <p style={{ fontSize: 11, color: "var(--ok)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pendentes</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>{comandas.length}</p>
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
