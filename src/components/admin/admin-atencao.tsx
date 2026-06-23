import type { BarResumo } from "@/lib/admin/queries";

// ─── Ação sugerida por bar ────────────────────────────────────────────────────

function suggestedAction(bar: BarResumo): { label: string; urgency: "imediata" | "verificar" } {
  if (!bar.ativo)
    return { label: "Bar suspenso — revisar status", urgency: "imediata" };

  if (bar.assinatura_status === "inadimplente")
    return { label: "Cobrar", urgency: "imediata" };

  if (bar.assinatura_status === "cancelada")
    return { label: "Tentar reativar assinatura", urgency: "imediata" };

  if (bar.assinatura_status === "trial" && bar.trial_fim) {
    const d = Math.ceil((new Date(bar.trial_fim).getTime() - Date.now()) / 86400000);
    if (d <= 0)  return { label: "Trial expirado — converter ou estender", urgency: "imediata" };
    if (d <= 3)  return { label: `Trial acaba em ${d}d — ligar agora`, urgency: "imediata" };
  }

  if (bar.implantacaoScore === "abandonado")
    return { label: "Onboarding urgente — nunca abriu turno", urgency: "imediata" };

  if (bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7)
    return { label: `Ligar — ${bar.dias_sem_uso} dias sem usar`, urgency: "imediata" };

  // Yellow
  if (bar.dias_sem_uso !== null && bar.dias_sem_uso >= 3)
    return { label: `Verificar — ${bar.dias_sem_uso} dias sem abrir turno`, urgency: "verificar" };

  if (bar.assinatura_status === "trial" && bar.trial_fim) {
    const d = Math.ceil((new Date(bar.trial_fim).getTime() - Date.now()) / 86400000);
    if (d <= 7) return { label: `Acompanhar conversão (${d}d restantes)`, urgency: "verificar" };
  }

  if (bar.cobertura_custo_pct < 60 && bar.total_turnos > 0)
    return { label: "Ajudar a preencher fichas técnicas (CMV travado)", urgency: "verificar" };

  return { label: "Verificar", urgency: "verificar" };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AdminAtencao({ bares }: { bares: BarResumo[] }) {
  const comAlertas = bares.filter((b) => b.alertas.length > 0);

  if (comAlertas.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 0", gap: 12,
      }}>
        <span style={{ fontSize: 40 }}>✅</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
          Todos os clientes saudáveis
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          Nenhuma ação necessária agora.
        </p>
      </div>
    );
  }

  const imediata  = comAlertas.filter((b) => suggestedAction(b).urgency === "imediata");
  const verificar = comAlertas.filter((b) => suggestedAction(b).urgency === "verificar");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Resumo */}
      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
        {comAlertas.length} cliente{comAlertas.length !== 1 ? "s" : ""} precisam de atenção
        {imediata.length > 0 && ` — ${imediata.length} ação imediata${imediata.length !== 1 ? "s" : ""}`}.
      </p>

      {/* Ação imediata */}
      {imediata.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ef4444" }}>
              🔴 Ação imediata
            </span>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", background: "rgba(239,68,68,0.1)", padding: "1px 8px", borderRadius: 99, border: "1px solid rgba(239,68,68,0.2)" }}>
              {imediata.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {imediata.map((bar) => (
              <ActionItem key={bar.id} bar={bar} urgency="imediata" />
            ))}
          </div>
        </div>
      )}

      {/* Verificar */}
      {verificar.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b" }}>
              🟡 Verificar
            </span>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", background: "rgba(245,158,11,0.1)", padding: "1px 8px", borderRadius: 99, border: "1px solid rgba(245,158,11,0.2)" }}>
              {verificar.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {verificar.map((bar) => (
              <ActionItem key={bar.id} bar={bar} urgency="verificar" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Item individual ──────────────────────────────────────────────────────────

function ActionItem({ bar, urgency }: { bar: BarResumo; urgency: "imediata" | "verificar" }) {
  const action = suggestedAction(bar);

  return (
    <a
      href={`/admin/${bar.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        textDecoration: "none",
        borderRadius: 6,
        overflow: "hidden",
        background: "var(--bg-elevated)",
        transition: "opacity 100ms",
      }}
    >

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, margin: "14px 14px 14px 14px",
        borderRadius: 6,
        background: `hsl(${hashCode(bar.id) % 360}, 40%, 18%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
        color: `hsl(${hashCode(bar.id) % 360}, 60%, 70%)`,
        flexShrink: 0,
      }}>
        {bar.nome.slice(0, 2).toUpperCase()}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, padding: "14px 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em" }}>
            {bar.nome}
          </span>
          {(bar.cidade || bar.estado) && (
            <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
              {[bar.cidade, bar.estado].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
          {action.label}
        </span>
      </div>

      {/* Alert chips compactos */}
      <div style={{ display: "flex", gap: 4, padding: "0 16px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 200 }}>
        {bar.alertas.slice(0, 2).map((a, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 600,
            padding: "2px 7px", borderRadius: 99,
            background: a.level === "red" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
            color: a.level === "red" ? "#ef4444" : "#f59e0b",
            border: `1px solid ${a.level === "red" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            whiteSpace: "nowrap",
          }}>
            {a.label}
          </span>
        ))}
        {bar.alertas.length > 2 && (
          <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>+{bar.alertas.length - 2}</span>
        )}
      </div>

      {/* Score numérico + arrow */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 0 8px", flexShrink: 0 }}>
        <span style={{
          fontSize: 18, fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color: bar.healthScoreNumerico >= 70 ? "#22c55e"
               : bar.healthScoreNumerico >= 40 ? "#f59e0b"
               : "#ef4444",
          letterSpacing: "-0.03em",
          minWidth: 32, textAlign: "right",
        }}>
          {bar.healthScoreNumerico}
        </span>
        <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>→</span>
      </div>
    </a>
  );
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}
