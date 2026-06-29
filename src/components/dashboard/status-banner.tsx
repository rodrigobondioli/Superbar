type StatusType = "ok" | "warning" | "critical" | "nodata";

interface StatusBannerProps {
  cmvPct: number | null;
  cmvDelta: number | null;
  ticketDelta: number | null;
  cmvParcial: boolean;
  topProdutoProblema?: string | null;
}

export function StatusBanner({
  cmvPct,
  cmvDelta,
  ticketDelta,
  cmvParcial,
  topProdutoProblema,
}: StatusBannerProps) {
  let type: StatusType;
  let message: string;

  if (cmvPct === null && !cmvParcial) {
    type = "nodata";
    message =
      "Sem dados de custo. Cadastre o custo dos produtos para ver se você está lucrando de verdade — sem isso, margem é chute.";
  } else if (cmvPct !== null && cmvPct >= 42) {
    type = "critical";
    if (cmvDelta !== null && cmvDelta > 2) {
      message = topProdutoProblema
        ? `CMV crítico e subindo. Você está vendendo bem, mas perdendo margem — ${topProdutoProblema} pode estar sendo mais pedido do que o esperado com custo alto.`
        : "CMV crítico e subindo. Você está vendendo, mas o custo está comendo o lucro. Cada real vendido está sobrando menos de R$0,58.";
    } else {
      message =
        "CMV crítico neste turno. Custo acima de 42% — ou os produtos de margem baixa estão dominando as vendas, ou os custos mudaram.";
    }
  } else if (cmvPct !== null && cmvPct >= 36) {
    type = "warning";
    if (ticketDelta !== null && ticketDelta < -5) {
      message = `Atenção dupla: CMV elevado e ticket caindo ${Math.abs(ticketDelta).toFixed(0)}% vs ontem. Dois problemas ao mesmo tempo pedindo ação.`;
    } else {
      message =
        "CMV acima do ideal. Custo entre 36–42% — zona de atenção. Não é emergência, mas vale monitorar o que está saindo mais.";
    }
  } else if (ticketDelta !== null && ticketDelta < -5) {
    type = "warning";
    message = `Receita crescendo, mas clientes gastando menos. Ticket caiu ${Math.abs(ticketDelta).toFixed(0)}% vs ontem — a equipe pode estar deixando de sugerir produtos de maior valor.`;
  } else if (cmvParcial) {
    type = "ok";
    message =
      "Turno no caminho certo. Custo estimado com base nos produtos que têm ficha técnica — cadastre o resto para ter a margem real.";
  } else {
    type = "ok";
    message = "Turno saudável. Custo e ticket dentro do esperado.";
  }

  const colors: Record<StatusType, { bg: string; border: string }> = {
    ok: {
      bg: "color-mix(in srgb, var(--ok) 6%, transparent)",
      border: "color-mix(in srgb, var(--ok) 25%, transparent)",
    },
    warning: {
      bg: "color-mix(in srgb, var(--warn) 6%, transparent)",
      border: "color-mix(in srgb, var(--warn) 25%, transparent)",
    },
    critical: {
      bg: "color-mix(in srgb, var(--danger) 7%, transparent)",
      border: "color-mix(in srgb, var(--danger) 30%, transparent)",
    },
    nodata: {
      bg: "color-mix(in srgb, var(--fg) 4%, transparent)",
      border: "var(--border)",
    },
  };

  const c = colors[type];

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--fg)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {message}
      </p>
    </div>
  );
}
