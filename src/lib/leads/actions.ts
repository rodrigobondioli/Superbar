"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

interface LeadPayload {
  nome_bar: string;
  cidade: string;
  tipo_bar: string;
  whatsapp: string;
  instagram?: string;
}

export async function submitLead(
  payload: LeadPayload,
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("leads").insert({
    nome_bar: payload.nome_bar.trim(),
    cidade: payload.cidade,
    tipo_bar: payload.tipo_bar,
    whatsapp: payload.whatsapp.trim(),
    instagram: payload.instagram?.trim() || null,
  });

  if (error) return { error: "Erro ao enviar pedido. Tente novamente." };

  // Notificação por email — best-effort: se falhar, o lead já está salvo.
  await notifyNewLead(payload);

  return { ok: true };
}

async function notifyNewLead(lead: LeadPayload): Promise<void> {
  try {
    const to = process.env.LEAD_NOTIFY_EMAIL ?? "rodrigobondioli@gmail.com";
    const zap = lead.whatsapp?.replace(/\D/g, "");
    const linha = (label: string, valor?: string | null) =>
      valor ? `<tr><td style="padding:4px 16px 4px 0;color:#898989;font-size:14px">${label}</td><td style="padding:4px 0;color:#111;font-size:14px;font-weight:600">${valor}</td></tr>` : "";

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto">
        <div style="background:#FF3500;color:#111;padding:20px 24px;border-radius:12px 12px 0 0">
          <p style="margin:0;font-size:13px;font-weight:600">SUPERBAR · Novo lead</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">${lead.nome_bar}</h1>
        </div>
        <div style="border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:20px 24px">
          <table style="border-collapse:collapse;width:100%">
            ${linha("Cidade", lead.cidade)}
            ${linha("Tipo", lead.tipo_bar)}
            ${linha("WhatsApp", lead.whatsapp)}
            ${linha("Instagram", lead.instagram)}
          </table>
          <div style="margin-top:20px;display:flex;gap:10px">
            ${zap ? `<a href="https://wa.me/55${zap}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600">Chamar no WhatsApp</a>` : ""}
            <a href="https://app.superbar.com.br/admin/leads" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600">Abrir no CRM</a>
          </div>
        </div>
      </div>`;

    const result = await sendEmail({
      to,
      subject: `Novo lead: ${lead.nome_bar} — ${lead.cidade}`,
      html,
    });

    if (!result.ok) console.error("[notifyNewLead] falha ao enviar email:", result.error);
  } catch (e) {
    console.error("[notifyNewLead] erro inesperado:", e);
  }
}
