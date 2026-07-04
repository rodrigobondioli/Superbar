"use server";

// Enriquecimento de lead a partir do @ do Instagram, via Firecrawl /extract.
// /extract é assíncrono: startLeadEnrich() dispara o job e devolve um id;
// getLeadEnrich(id) é consultado pelo cliente até status "completed".
// Env necessária: FIRECRAWL_API_KEY (fc-...).

const TIPOS = ["Coquetelaria", "Wine Bar", "Speakeasy", "Gastrobar", "Outro"];

export interface EnrichedLead {
  nome_bar: string;
  cidade: string;
  tipo_bar: string;
  whatsapp: string;
  email: string;
  site: string;
  nome_responsavel: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    nome_bar: { type: "string", description: "Nome do bar/estabelecimento" },
    cidade: { type: "string", description: "Cidade onde fica o bar" },
    tipo_bar: { type: "string", description: "Tipo do bar: Coquetelaria, Wine Bar, Speakeasy, Gastrobar ou Outro" },
    whatsapp: { type: "string", description: "WhatsApp ou telefone de contato" },
    email: { type: "string", description: "Email de contato" },
    site: { type: "string", description: "Site oficial do bar" },
    nome_responsavel: { type: "string", description: "Nome do responsável/dono, se aparecer" },
  },
};

function cleanHandle(raw: string): string {
  return raw.replace(/^@/, "").trim().split(/[/?\s]/)[0];
}

export async function startLeadEnrich(handle: string): Promise<{ id: string } | { error: string }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { error: "Enriquecimento não configurado (falta FIRECRAWL_API_KEY)." };

  const clean = cleanHandle(handle);
  if (!clean) return { error: "Informe o @ do Instagram." };

  const prompt = `A URL é o perfil de Instagram de um bar brasileiro (@${clean}). Extraia os dados do negócio: nome do bar, cidade, tipo (Coquetelaria, Wine Bar, Speakeasy, Gastrobar ou Outro), WhatsApp/telefone, email, site oficial e nome do responsável. Use também o site oficial e resultados de busca na web (Google) para completar o que não estiver no perfil. Deixe vazio o que não encontrar — não invente dados.`;

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/extract", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [`https://www.instagram.com/${clean}/`],
        prompt,
        schema: SCHEMA,
        enableWebSearch: true,
      }),
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      return { error: json?.error ?? `Firecrawl retornou ${res.status}` };
    }
    if (!json?.id) return { error: "Firecrawl não retornou um job válido." };
    return { id: json.id as string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao chamar o Firecrawl." };
  }
}

export type EnrichStatus =
  | { status: "processing" }
  | { status: "completed"; data: Partial<EnrichedLead> }
  | { status: "failed"; error: string };

export async function getLeadEnrich(id: string): Promise<EnrichStatus> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { status: "failed", error: "FIRECRAWL_API_KEY ausente." };

  try {
    const res = await fetch(`https://api.firecrawl.dev/v2/extract/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json();

    if (json?.status === "completed") {
      const d = (json.data ?? {}) as Record<string, unknown>;
      const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
      let tipo = s(d.tipo_bar);
      if (tipo && !TIPOS.includes(tipo)) tipo = "Outro";
      return {
        status: "completed",
        data: {
          nome_bar: s(d.nome_bar),
          cidade: s(d.cidade),
          tipo_bar: tipo,
          whatsapp: s(d.whatsapp),
          email: s(d.email),
          site: s(d.site),
          nome_responsavel: s(d.nome_responsavel),
        },
      };
    }
    if (json?.status === "failed" || json?.status === "cancelled") {
      return { status: "failed", error: "Não consegui extrair dados desse perfil." };
    }
    return { status: "processing" };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : "Erro ao consultar o Firecrawl." };
  }
}
