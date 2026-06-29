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
      "Sem dados de custo. Cadastre o custo dos produtos para ver se você está lucrando — sem isso, margem é chute.";
  } else if (cmvPct !== null && cmvPct >= 42) {
    type = "critical";
    if (cmvDelta !== null && cmvDelta > 2) {
      message = topProdutoProblema
        ? `CMV crítico e subindo. Você está vendendo bem, mas perdendo margem — ${topProdutoProblema} pode estar sendo mais pedido com custo alto.`
        : "CMV crítico e subindo. Você está vendendo, mas o custo está comendo o lucro.";
    } else {
      message =
        "CMV crítico neste turno. Custo acima de 42% — produtos de margem baixa estão dominando as vendas.";
    }
  } else if (cmvPct !== null && cmvPct >= 36) {
    type = "warning";
    if (ticketDelta !== null && ticketDelta < -5) {
      message = `Atenção dupla: CMV elevado e ticket caindo ${Math.abs(ticketDelta).toFixed(0)}% vs ontem.`;
    } else {
      message = "CMV acima do ideal. Zona de atenção — vale monitorar o que está saindo mais.";
    }
  } else if (ticketDelta !== null && ticketDelta < -5) {
    type = "warning";
    message = `Ticket caiu ${Math.abs(ticketDelta).toFixed(0)}% vs ontem — a equipe pode estar deixando de sugerir produtos de maior valor.`;
  } else if (cmvParcial) {
    type = "ok";
    message =
      "Custo estimado com base nos produtos com ficha técnica. Cadastre o resto para ter a margem real.";
  } else {
    type = "ok";
    message = "Turno saudável. Custo e ticket dentro do esperado.";
  }

  const textColor: Record<StatusType, string> = {
    ok: "var(--fg-subtle)",
    warning: "var(--warn)",
    critical: "var(--danger)",
    nodata: "var(--fg-subtle)",
  };

  return (
    <p
      style={{
        fontSize: 13,
        fontWeight: type === "critical" ? 600 : 400,
        color: textColor[type],
        margin: 0,
        lineHeight: 1.6,
        padding: "0 4px",
      }}
    >
      {message}
    </p>
  );
}
