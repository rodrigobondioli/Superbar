import { AlertTriangle } from "lucide-react";
import { BarraProgresso } from "@/components/dashboard/barra-progresso";

export interface PassoConfig {
  /** Rótulo do passo (ex.: "Cardápio — 12 produtos"). */
  label: string;
  /** Linha de apoio opcional (ex.: "sem custo, a margem é cega"). */
  apoio?: string;
  /** Passo concluído? */
  done: boolean;
  /** Destino do CTA; null = sem ação (ex.: "Conta criada"). */
  href: string | null;
  /** Texto do CTA (default: "Configurar"). */
  cta?: string;
  /** Passo crítico para a inteligência — destaca mesmo quando o resto avança. */
  critico?: boolean;
  /** Ícone do card (variante hero). ReactNode — herda a cor via currentColor. */
  icon?: React.ReactNode;
}

interface GuiaConfiguracaoProps {
  passos: PassoConfig[];
  /** "hero" = tela cheia (bar novo); "card" = bloco compacto no dashboard. */
  variante?: "hero" | "card";
  titulo?: string;
  subtitulo?: string;
}

/**
 * Guia de configuração do bar — checklist com % de progresso.
 * O guia leva o dono até o DADO LIMPO (cardápio → custo → mesas → equipe → turno),
 * não só até a operação. O passo de custo é cidadão de primeira classe (Princípio 10).
 */
export function GuiaConfiguracao({ passos, variante = "hero", titulo, subtitulo }: GuiaConfiguracaoProps) {
  const feitos = passos.filter((p) => p.done).length;
  const total = passos.length;
  const pct = total > 0 ? feitos / total : 0;
  const hero = variante === "hero";

  const cabecalho = (
    <div style={{ marginBottom: 16, textAlign: hero ? "center" : "left" }}>
      <h2 style={{ fontSize: hero ? 22 : 15, fontWeight: hero ? 700 : 600, color: "var(--fg)", margin: "0 0 6px" }}>
        {titulo ?? "Vamos configurar seu bar"}
      </h2>
      {subtitulo && (
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: "0 0 16px", lineHeight: 1.6 }}>
          {subtitulo}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: hero ? "center" : "space-between", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--fg-muted)", flexShrink: 0 }}>
          {feitos} de {total} concluídos
        </span>
        <div style={{ flex: hero ? undefined : 1, width: hero ? "100%" : undefined, maxWidth: hero ? undefined : 180, marginTop: hero ? 6 : 0 }}>
          <BarraProgresso valor={pct} altura={4} raio={2} corBarra="var(--accent)" />
        </div>
      </div>
    </div>
  );

  // Guia UM PASSO POR VEZ (clareza): só o PRÓXIMO passo pendente fica aceso
  // (destaque + CTA laranja + "comece por aqui"). Os demais pendentes ficam
  // apagados, sem CTA — some a paralisia de "5 botões acesos, por onde começo?".
  // Quem quiser pular usa o menu lateral livremente.
  const proximoIdx = passos.findIndex((p) => !p.done);

  const lista = passos.map((p, i) => {
    const ativo = i === proximoIdx;
    const depois = !p.done && !ativo;
    return (
      <div
        key={i}
        style={{
          display: "flex", alignItems: ativo ? "center" : "flex-start", gap: 12,
          padding: hero ? "16px 20px" : "12px 4px",
          borderBottom: i < passos.length - 1 ? "1px solid var(--border)" : "none",
          background: ativo && hero ? "color-mix(in srgb, var(--fg) 4%, transparent)" : undefined,
          opacity: depois ? 0.55 : 1,
        }}
      >
        <div
          style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            background: p.done ? "var(--ok-bg)" : "color-mix(in srgb, var(--fg) 5%, transparent)",
            border: `1.5px solid ${p.done ? "var(--ok)" : ativo ? "var(--accent)" : "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "var(--fg)",
          }}
        >
          {p.done ? "✓" : ""}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {ativo && (
            <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 3 }}>
              Comece por aqui
            </span>
          )}
          <span style={{ fontSize: 13, color: p.done || depois ? "var(--fg-muted)" : "var(--fg)" }}>{p.label}</span>
          {p.apoio && ativo && (
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "2px 0 0", lineHeight: 1.4 }}>
              {p.apoio}
            </p>
          )}
        </div>
        {p.href && ativo && (
          <a
            href={p.href}
            style={{
              fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none",
              whiteSpace: "nowrap", flexShrink: 0, marginTop: 1,
            }}
          >
            {p.cta ?? "Configurar"} →
          </a>
        )}
      </div>
    );
  });

  if (hero) {
    return (
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 0",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1040 }}>
          {/* Cabeçalho centralizado */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {titulo ?? "Vamos configurar seu bar"}
            </h2>
            {subtitulo && (
              <p style={{ fontSize: 15, color: "var(--fg-muted)", margin: "0 auto", maxWidth: 620, lineHeight: 1.5 }}>{subtitulo}</p>
            )}

            {/* Barra de progresso — largura total dos cards, degradê âmbar→laranja */}
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>
                  Seu progresso
                </span>
                <span style={{ fontSize: 13, color: "var(--fg-muted)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {feitos} de {total} concluídos
                </span>
              </div>
              <BarraProgresso valor={pct} altura={6} raio={3} corBarra="linear-gradient(90deg, var(--warn) 0%, var(--accent) 100%)" />
            </div>
          </div>

          {/* Grid 3 colunas de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
            {passos.map((p, i) => {
              const ativo = i === proximoIdx;
              const depois = !p.done && !ativo;
              // Card do custo (NF-e) preenchido de laranja — o passo que destrava a margem.
              const laranja = !!p.critico && !p.done;
              return (
                <div key={i} style={{
                  background: laranja ? "var(--accent)" : "var(--bg-card)",
                  border: laranja
                    ? "1px solid var(--accent)"
                    : `1px dashed ${ativo ? "var(--accent)" : "var(--border-strong)"}`,
                  boxShadow: laranja ? "0 12px 34px color-mix(in srgb, var(--accent) 28%, transparent)" : undefined,
                  borderRadius: 16, padding: 20, minHeight: 176,
                  display: "flex", flexDirection: "column",
                  opacity: depois ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: laranja
                        ? "rgba(255,255,255,0.18)"
                        : p.done ? "var(--ok-bg)" : ativo ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "var(--bg-hover)",
                      color: laranja ? "#fff" : p.done ? "var(--ok)" : ativo ? "var(--accent)" : "var(--fg-muted)",
                    }}>
                      {p.done ? <span style={{ fontSize: 17, fontWeight: 700 }}>✓</span> : p.icon}
                    </div>
                    {ativo && (
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: laranja ? "#fff" : "var(--accent)" }}>
                        Comece por aqui
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: laranja ? "#fff" : p.done ? "var(--fg-muted)" : "var(--fg)", lineHeight: 1.3 }}>{p.label}</span>
                  {p.apoio && !p.done && (
                    <p style={{ fontSize: 12.5, color: laranja ? "rgba(255,255,255,0.88)" : "var(--fg-subtle)", margin: "8px 0 0", lineHeight: 1.45 }}>{p.apoio}</p>
                  )}
                  <div style={{ marginTop: "auto", paddingTop: 16 }}>
                    {p.done ? (
                      <span style={{ fontSize: 12.5, color: "var(--ok)", fontWeight: 500 }}>Concluído</span>
                    ) : p.href ? (
                      <a
                        href={p.href}
                        className="inline-flex h-8 w-fit items-center justify-center gap-2 rounded-full border border-border-strong bg-bg-card px-4 text-[13px] font-medium text-fg no-underline transition-colors hover:border-fg-subtle hover:bg-bg-hover"
                      >
                        {p.cta ?? "Configurar"} →
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica — rodapé, com ícone de aviso */}
          <div style={{ marginTop: 28, display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
            <AlertTriangle size={16} strokeWidth={2} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--fg)", fontWeight: 600 }}>Dica de ouro:</strong> comece subindo suas notas (NF-e) de compra — se a última foi pequena, sobe mais de uma.
              Cada nota traz o custo real dos insumos já convertido, e é isso que faz cada drink nascer com a margem certa. Sem planilha, sem conta de cabeça.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Card compacto: um único container (cabeçalho + lista).
  return (
    <div>
      {cabecalho}
      <div>{lista}</div>
    </div>
  );
}
