import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import {
  casarIngrediente,
  type InsumoSugerido,
  type SugerirFichaResponse,
  type UnidadeInsumo,
  type IngredienteRef,
} from "@/lib/ficha/sugestao-types";

const UNIDADES: UnidadeInsumo[] = ["un", "ml", "l", "g", "kg"];

interface Body {
  nome?: string;
  base?: string; // destilado, ex: "vodka" (para variantes de base)
  sabor?: string; // fruta/sabor, ex: "morango"
  descricao?: string; // descrição do cardápio — sinal-chave para drinks autorais
}

/**
 * IA sugere a ESTRUTURA da ficha (insumos + quantidade padrão) a partir do
 * nome do drink. Nunca inventa marca nem preço — isso é do dono (Princípio 10).
 * O servidor casa cada papel com o estoque (ingredientes) já cadastrado.
 *
 * Read-only: NÃO persiste nada. Persistir é no confirmar (ficha editor / wizard).
 */
export async function POST(req: NextRequest) {
  const current = await getCurrentBar();
  if (!current) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const nome = (body.nome ?? "").trim();
  if (!nome) return NextResponse.json({ error: "Nome do drink é obrigatório" }, { status: 400 });

  const contexto = [
    body.base ? `Base/destilado: ${body.base.trim()}` : null,
    body.sabor ? `Sabor/fruta: ${body.sabor.trim()}` : null,
    body.descricao?.trim() ? `Descrição do cardápio: ${body.descricao.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // 1. IA sugere a estrutura da receita
  let sugeridos: { papel: string; quantidade: number; unidade: string }[] = [];
  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Você é um bartender profissional brasileiro. Monte a ficha técnica (receita) padrão do drink abaixo.

Drink: ${nome}
${contexto}

Liste os insumos com quantidade padrão e unidade. Regras:
- Unidade DEVE ser uma de: un, ml, l, g, kg.
- Use o nome GENÉRICO do insumo ("vodka", "limão", "açúcar", "gelo") — NUNCA marca comercial.
- Quantidades por 1 dose/porção servida.
- Se o drink tiver base específica informada, use-a como o destilado.
- Se houver "Descrição do cardápio", ela é a fonte de verdade: extraia os insumos dela. Isso vale principalmente para drinks AUTORAIS (nome inventado), onde a descrição diz os ingredientes reais. Não é receita clássica conhecida? Baseie-se na descrição, não chute pelo nome.
- Não invente insumo que não pertence ao drink.

Retorne APENAS JSON, sem explicação:
{"insumos":[{"papel":"vodka","quantidade":50,"unidade":"ml"},{"papel":"limão","quantidade":1,"unidade":"un"}]}`,
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const jsonStr = text.startsWith("{") ? text : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonStr) as {
      insumos?: { papel?: string; quantidade?: number; unidade?: string }[];
    };
    sugeridos = (parsed.insumos ?? [])
      .filter((i) => i.papel && typeof i.quantidade === "number")
      .map((i) => ({
        papel: String(i.papel).trim(),
        quantidade: Number(i.quantidade),
        unidade: String(i.unidade ?? "un"),
      }));
  } catch (e) {
    const err = e as { status?: number; message?: string };
    // Loga o motivo real (aparece nos logs da Vercel) — antes era engolido.
    console.error("sugerir-ficha: falha na IA", err?.status, err?.message);
    const semChave  = err?.status === 401 || err?.status === 403;
    const semCredito = err?.status === 429;
    const msg = semChave
      ? "A IA está sem chave válida. Confira a ANTHROPIC_API_KEY nas variáveis do projeto."
      : semCredito
      ? "A IA está sem crédito ou no limite de uso. Confira o saldo da conta da API."
      : "Não consegui sugerir a ficha agora. Tente de novo ou cadastre manual.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (sugeridos.length === 0) {
    return NextResponse.json({ insumos: [] } satisfies SugerirFichaResponse);
  }

  // 2. Casa cada papel com o estoque (ingredientes) do bar
  const supabase = await createClient();
  const { data: ingData } = await supabase
    .from("ingredientes")
    .select("id, nome, custo_atual")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .returns<(IngredienteRef & { custo_atual: number })[]>();
  const ingredientes = ingData ?? [];
  const custoPorId = new Map(ingredientes.map((i) => [i.id, Number(i.custo_atual)]));

  const insumos: InsumoSugerido[] = sugeridos.map((s) => {
    const unidade: UnidadeInsumo = (UNIDADES as string[]).includes(s.unidade)
      ? (s.unidade as UnidadeInsumo)
      : "un";
    const match = casarIngrediente(s.papel, ingredientes);
    const custo = match ? custoPorId.get(match.id) ?? null : null;
    return {
      papel: s.papel,
      quantidade: s.quantidade,
      unidade,
      ingredienteId: match?.id ?? null,
      ingredienteNome: match?.nome ?? null,
      custoUnitario: custo != null && custo > 0 ? custo : null,
    };
  });

  return NextResponse.json({ insumos } satisfies SugerirFichaResponse);
}
