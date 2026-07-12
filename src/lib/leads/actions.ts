"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

interface LeadPayload {
  nome_bar: string;
  cidade: string;
  tipo_bar: string;
  whatsapp: string;
  instagram?: string;
  /** Honeypot: campo escondido no form. Humano nunca preenche; bot preenche. */
  website?: string;
}

// Limites de tamanho — barram payload gigante (abuso/estouro de coluna).
const LIMITES = { nome_bar: 120, cidade: 80, tipo_bar: 60, instagram: 80 } as const;

/** Throttle best-effort por IP (memória do processo). Não é durável em
 *  serverless — para produção robusta, mover para Upstash/Redis. Ainda assim
 *  corta flood dentro de uma mesma instância. */
const JANELA_MS = 10 * 60 * 1000; // 10 min
const MAX_POR_JANELA = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const agora = Date.now();
  const recentes = (hits.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  hits.set(ip, recentes);
  return recentes.length > MAX_POR_JANELA;
}

export async function submitLead(
  payload: LeadPayload,
): Promise<{ ok: true } | { error: string }> {
  // 1. Honeypot: se preenchido, é bot. Finge sucesso (não alimenta o atacante).
  if (payload.website && payload.website.trim() !== "") return { ok: true };

  // 2. Validação de shape e tamanho.
  const nome_bar = (payload.nome_bar ?? "").trim();
  const cidade = (payload.cidade ?? "").trim();
  const tipo_bar = (payload.tipo_bar ?? "").trim();
  const whatsapp = (payload.whatsapp ?? "").trim();
  const instagram = payload.instagram?.trim() || null;

  if (!nome_bar || !whatsapp || !cidade || !tipo_bar) {
    return { error: "Preencha os campos obrigatórios." };
  }
  if (
    nome_bar.length > LIMITES.nome_bar ||
    cidade.length > LIMITES.cidade ||
    tipo_bar.length > LIMITES.tipo_bar ||
    (instagram && instagram.length > LIMITES.instagram)
  ) {
    return { error: "Algum campo ultrapassou o tamanho permitido." };
  }
  const digitos = whatsapp.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) {
    return { error: "WhatsApp inválido." };
  }

  // 3. Throttle por IP.
  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
  if (rateLimited(ip)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("leads").insert({
    nome_bar,
    cidade,
    tipo_bar,
    whatsapp,
    instagram,
    origem: "Site",     // passivo — chegou sozinho pelo formulário da landing
    ordem: Date.now(),  // entra no topo da coluna
  });

  if (error) return { error: "Erro ao enviar pedido. Tente novamente." };

  // Notificação por email — best-effort: se falhar, o lead já está salvo.
  await notifyNewLead({ nome_bar, cidade, tipo_bar, whatsapp, instagram: instagram ?? undefined });

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
