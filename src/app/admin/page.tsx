import { getAdminBares } from "@/lib/admin/queries";
import { AdminAtencao } from "@/components/admin/admin-atencao";

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconTrendUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", maximumFractionDigits: 0,
});

// ─── Card base sem bordas ─────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "20px 22px",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const { bares, stats } = await getAdminBares();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          {stats.total_bares} bar{stats.total_bares !== 1 ? "es" : ""} na plataforma
        </p>
        <time style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </time>
      </div>

      {/* ── Bento de métricas ──────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr",
        gridTemplateRows: "auto auto",
        gap: 10,
      }}>

        {/* MRR — featured, 2 linhas */}
        <div style={{
          ...card,
          gridRow: "span 2",
          padding: "28px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>
                MRR
              </span>
              <span style={{ color: "var(--fg-subtle)" }}><IconTrendUp /></span>
            </div>
            <p style={{ fontSize: 38, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-mono)", margin: "0 0 4px", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {currency.format(stats.mrr)}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
              {stats.bares_saudaveis + stats.bares_atencao} assinatura{(stats.bares_saudaveis + stats.bares_atencao) !== 1 ? "s" : ""} ativa{(stats.bares_saudaveis + stats.bares_atencao) !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 8px" }}>ARR estimado</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-muted)", fontFamily: "var(--font-mono)", margin: 0, letterSpacing: "-0.03em" }}>
              {currency.format(stats.mrr * 12)}
            </p>
          </div>
        </div>

        {/* Saúde */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>Saúde</span>
            <span style={{ color: "var(--fg-subtle)" }}><IconShield /></span>
          </div>
          <p style={{ fontSize: 30, fontWeight: 800, color: stats.bares_risco > 0 ? "var(--danger)" : "var(--ok)", fontFamily: "var(--font-mono)", margin: "0 0 10px", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {stats.bares_saudaveis}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{ fontSize: 11, color: "var(--ok)", margin: 0 }}>● {stats.bares_saudaveis} saudável{stats.bares_saudaveis !== 1 ? "is" : ""}</p>
            {stats.bares_atencao > 0 && <p style={{ fontSize: 11, color: "var(--warn)", margin: 0 }}>● {stats.bares_atencao} atenção</p>}
            {stats.bares_risco > 0   && <p style={{ fontSize: 11, color: "var(--danger)", margin: 0 }}>● {stats.bares_risco} risco</p>}
          </div>
        </div>

        {/* Implantação */}
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>Implantação</span>
          </div>
          <p style={{ fontSize: 30, fontWeight: 800, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: "0 0 10px", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {stats.implantacao_completo}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{ fontSize: 11, color: "var(--ok)", margin: 0 }}>✓ {stats.implantacao_completo} completo{stats.implantacao_completo !== 1 ? "s" : ""}</p>
            {stats.implantacao_parcial > 0    && <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: 0 }}>◐ {stats.implantacao_parcial} parcial{stats.implantacao_parcial !== 1 ? "is" : ""}</p>}
            {stats.implantacao_abandonado > 0 && <p style={{ fontSize: 11, color: "var(--warn)", margin: 0 }}>○ {stats.implantacao_abandonado} não implantado{stats.implantacao_abandonado !== 1 ? "s" : ""}</p>}
          </div>
        </div>

        {/* Sem uso 7d — ocupa as 2 colunas direitas, linha 2 */}
        <div style={{
          ...card,
          gridColumn: "span 2",
          display: "flex",
          alignItems: "center",
          gap: 40,
        }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", display: "block", marginBottom: 10 }}>Sem uso esta semana</span>
            <p style={{ fontSize: 34, fontWeight: 800, color: stats.bares_sem_uso_7d > 0 ? "var(--warn)" : "var(--fg-muted)", fontFamily: "var(--font-mono)", margin: "0 0 2px", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {stats.bares_sem_uso_7d}
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
              {stats.bares_sem_uso_7d === 0 ? "todos usaram nos últimos 7 dias" : `bar${stats.bares_sem_uso_7d !== 1 ? "es" : ""} sem abrir turno`}
            </p>
          </div>
          {stats.bares_inadimplentes > 0 && (
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 40 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", display: "block", marginBottom: 10 }}>Inadimplentes</span>
              <p style={{ fontSize: 34, fontWeight: 800, color: "var(--danger)", fontFamily: "var(--font-mono)", margin: "0 0 2px", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {stats.bares_inadimplentes}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>cobrar</p>
            </div>
          )}
        </div>

        {/* CMV plataforma — linha 3, ocupa as 3 colunas */}
        {stats.cmv_plataforma_receita > 0 && (
          <div style={{
            ...card,
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "20px 28px",
          }}>
            {/* CMV% */}
            <div style={{ flex: "0 0 auto", minWidth: 140 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", display: "block", marginBottom: 8 }}>
                CMV médio plataforma
              </span>
              <p style={{
                fontSize: 38, fontWeight: 800, fontFamily: "var(--font-mono)", margin: "0 0 4px",
                letterSpacing: "-0.04em", lineHeight: 1,
                color: stats.cmv_plataforma_pct !== null
                  ? stats.cmv_plataforma_pct <= 30 ? "var(--ok)" : stats.cmv_plataforma_pct <= 38 ? "var(--warn)" : "var(--danger)"
                  : "var(--fg-muted)",
              }}>
                {stats.cmv_plataforma_pct !== null ? `${stats.cmv_plataforma_pct.toFixed(1)}%` : "—"}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>custo ÷ receita monitorada</p>
            </div>

            {/* Divisor */}
            <div style={{ width: 1, height: 56, background: "var(--border)", margin: "0 32px", flexShrink: 0 }} />

            {/* Receita coberta */}
            <div style={{ flex: "0 0 auto" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", display: "block", marginBottom: 8 }}>
                Receita monitorada
              </span>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: "0 0 2px", letterSpacing: "-0.03em" }}>
                {currency.format(stats.cmv_plataforma_receita)}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>de itens com custo cadastrado</p>
            </div>

            {/* Divisor */}
            <div style={{ width: 1, height: 56, background: "var(--border)", margin: "0 32px", flexShrink: 0 }} />

            {/* Custo total */}
            <div style={{ flex: "0 0 auto" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", display: "block", marginBottom: 8 }}>
                Custo rastreado
              </span>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg-muted)", margin: "0 0 2px", letterSpacing: "-0.03em" }}>
                {currency.format(stats.cmv_plataforma_custo)}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>custo real dos produtos vendidos</p>
            </div>

            {/* Nota de honestidade */}
            <p style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-subtle)", fontStyle: "italic", maxWidth: 220, textAlign: "right", lineHeight: 1.5 }}>
              Benchmark: 25–30% para coquetelaria premium. Calculado sobre itens com custo cadastrado — quanto maior a cobertura, mais preciso.
            </p>
          </div>
        )}

      </div>

      {/* ── KPIs de resultado ──────────────────────────────────────────── */}
      {stats.faturamento_plataforma_total > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Label seção */}
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: 0 }}>
            Resultados — plataforma
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>

            {/* Faturamento mês */}
            <div style={card}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
                Faturamento (mês)
              </p>
              <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {currency.format(stats.faturamento_plataforma_mes_atual)}
              </p>
              {stats.faturamento_plataforma_crescimento_pct !== null ? (
                <p style={{ fontSize: 11, margin: 0, color: stats.faturamento_plataforma_crescimento_pct >= 0 ? "var(--ok)" : "var(--danger)" }}>
                  {stats.faturamento_plataforma_crescimento_pct >= 0 ? "↑" : "↓"} {Math.abs(stats.faturamento_plataforma_crescimento_pct)}% vs mês anterior
                </p>
              ) : (
                <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>sem dado anterior</p>
              )}
            </div>

            {/* Faturamento total histórico */}
            <div style={card}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
                Faturamento total
              </p>
              <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {currency.format(stats.faturamento_plataforma_total)}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                acumulado histórico
              </p>
            </div>

            {/* Ticket médio */}
            <div style={card}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
                Ticket médio
              </p>
              {stats.ticket_medio_plataforma_30d !== null ? (
                <>
                  <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {currency.format(stats.ticket_medio_plataforma_30d)}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
                    últimos 30 dias
                    {stats.ticket_medio_plataforma_total && (
                      <> · {currency.format(stats.ticket_medio_plataforma_total)} total</>
                    )}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", margin: 0 }}>—</p>
              )}
            </div>

            {/* Margem média */}
            <div style={card}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)", margin: "0 0 10px" }}>
                Margem média
              </p>
              {stats.margem_plataforma_pct !== null ? (
                <>
                  <p style={{
                    fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1,
                    color: stats.margem_plataforma_pct >= 65 ? "var(--ok)" : stats.margem_plataforma_pct >= 55 ? "var(--warn)" : "var(--danger)",
                  }}>
                    {stats.margem_plataforma_pct.toFixed(1)}%
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>bares c/ cobertura ≥ 60%</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", margin: "0 0 4px" }}>—</p>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>cadastre custos para calcular</p>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Atenção ────────────────────────────────────────────────────── */}
      <AdminAtencao bares={bares} />

    </div>
  );
}
