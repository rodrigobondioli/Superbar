import { getCurrentBar } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import { getComandasPendentes } from "@/lib/caixa/queries";
import { CaixaComandas } from "@/components/caixa/caixa-comandas";
import { TurnoControles } from "@/components/dashboard/turno-controles";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const taxaServicoPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;
  const turno = await getOuCriarTurno(current.bar.id, current.userId);

  // Se o turno não pôde ser criado (falha de infra), mostra erro mínimo — não bloqueia.
  // Em produção normal isso não deve acontecer: getOuCriarTurno auto-cria via admin client.
  if (!turno) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--danger)", margin: "0 0 16px" }}>
            Erro ao inicializar turno. Tente recarregar a página.
          </p>
          <TurnoControles turnoAtual={null} />
        </div>
      </div>
    );
  }

  const comandas = await getComandasPendentes(current.bar.id, turno.id);

  return (
    /* Container scrollável — OperadorShell/main tem overflow:hidden */
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Barra de status — turno + contagem */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24, gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
              background: "color-mix(in srgb, var(--ok) 12%, transparent)",
              color: "var(--ok)",
              border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
            }}>
              ● Turno aberto
            </span>
            {comandas.length > 0 && (
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: "var(--warn)",
                fontFamily: "var(--font-sans)",
              }}>
                {comandas.length} pendente{comandas.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <TurnoControles turnoAtual={turno} />
        </div>

        {/* Lista de comandas */}
        {comandas.length === 0 ? (
          <div style={{
            background: "color-mix(in srgb, var(--fg) 3%, transparent)",
            borderRadius: 10, border: "1px solid var(--border)",
            padding: "56px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
              Caixa limpo
            </p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "6px 0 0" }}>
              Nenhuma comanda aguardando pagamento.
            </p>
          </div>
        ) : (
          <CaixaComandas comandas={comandas} taxaServicoPct={taxaServicoPct} />
        )}
      </div>
    </div>
  );
}
