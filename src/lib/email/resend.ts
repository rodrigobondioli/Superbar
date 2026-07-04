import "server-only";

// Envio de email transacional via Resend (https://resend.com).
// Sem SDK — usa a API HTTP direto, então não precisa instalar dependência.
//
// Envs necessárias:
//   RESEND_API_KEY   → chave da conta Resend (obrigatória p/ enviar de verdade)
//   LEAD_NOTIFY_FROM → remetente. Ex: "SUPERBAR <leads@superbar.com.br>"
//                      (o domínio precisa estar verificado no Resend)
//                      Default: "SUPERBAR <onboarding@resend.dev>" (só entrega
//                      pro email dono da conta Resend — serve pra teste)

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY não configurada" };

  const from = process.env.LEAD_NOTIFY_FROM ?? "SUPERBAR <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro desconhecido" };
  }
}
