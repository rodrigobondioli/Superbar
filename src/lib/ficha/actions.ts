"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { normalizarNome } from "@/lib/cardapio/import-types";
import { custoDaFicha, type CustoStatus } from "@/lib/custo";
import type { UnidadeInsumo } from "@/lib/ficha/sugestao-types";
import { getFicha, type FichaAtual } from "@/lib/ficha/queries";

/** Wrapper server-action para o editor carregar a ficha atual. */
export async function carregarFicha(
  produtoId: string,
  varianteId: string | null,
): Promise<FichaAtual> {
  const current = await getCurrentBar();
  if (!current) return { linhas: [], custoStatus: "sem" };
  return getFicha(current.bar.id, produtoId, varianteId);
}

export interface LinhaFichaInput {
  ingredienteId: string | null;
  nome: string;
  quantidade: number;
  unidade: UnidadeInsumo;
  custoUnitario: number | null;
}

export type SalvarFichaResult = { ok: true; custo: number | null; status: CustoStatus } | { error: string };

/**
 * Salva a ficha de um produto (varianteId null) ou variante.
 *
 * - Resolve cada linha num ingrediente real (acha por nome ou cria).
 * - Atualiza o custo do insumo no estoque (custo_atual) — muda num lugar,
 *   reflete em todo drink que usa (o moat, Princípio 5).
 * - Recomputa o custo do item e grava o cache (produto/variante.custo).
 * - Marca custo_status honesto: confirmada só com todos os custos preenchidos;
 *   senão sugerida (estimativa) e custo fica null pra não mentir a margem.
 */
export async function salvarFicha(
  produtoId: string,
  varianteId: string | null,
  linhas: LinhaFichaInput[],
): Promise<SalvarFichaResult> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };
  const barId = current.bar.id;
  const supabase = await createClient();

  // Insumos válidos (nome + quantidade > 0)
  const validas = linhas.filter((l) => l.nome.trim() && l.quantidade > 0);

  // Estoque atual do bar para achar insumos por nome (evita duplicar)
  const { data: ingData } = await supabase
    .from("ingredientes")
    .select("id, nome")
    .eq("bar_id", barId)
    .returns<{ id: string; nome: string }[]>();
  const porNome = new Map((ingData ?? []).map((i) => [normalizarNome(i.nome), i.id]));

  // Resolve cada linha num ingrediente_id + custo unitário efetivo
  const resolvidas: { ingredienteId: string; quantidade: number; custoUnitario: number | null }[] = [];

  for (const l of validas) {
    let ingredienteId = l.ingredienteId;

    if (ingredienteId) {
      // Atualiza custo/unidade do insumo existente, se informado
      if (l.custoUnitario != null) {
        await supabase
          .from("ingredientes")
          .update({ custo_atual: l.custoUnitario, atualizado_em: new Date().toISOString() })
          .eq("id", ingredienteId)
          .eq("bar_id", barId);
      }
    } else {
      const achado = porNome.get(normalizarNome(l.nome));
      if (achado) {
        ingredienteId = achado;
        if (l.custoUnitario != null) {
          await supabase
            .from("ingredientes")
            .update({ custo_atual: l.custoUnitario, atualizado_em: new Date().toISOString() })
            .eq("id", achado)
            .eq("bar_id", barId);
        }
      } else {
        // Cria o insumo no estoque
        const { data: novo } = await supabase
          .from("ingredientes")
          .insert({
            bar_id: barId,
            nome: l.nome.trim(),
            unidade: l.unidade,
            custo_atual: l.custoUnitario ?? 0,
            estoque_atual: 0,
            estoque_minimo: 0,
            ativo: true,
          })
          .select("id")
          .single<{ id: string }>();
        if (!novo) return { error: `Não consegui cadastrar o insumo "${l.nome}".` };
        ingredienteId = novo.id;
        porNome.set(normalizarNome(l.nome), novo.id);
      }
    }

    resolvidas.push({ ingredienteId, quantidade: l.quantidade, custoUnitario: l.custoUnitario });
  }

  // Sincroniza receitas: apaga as atuais dessa (produto, variante) e reinsere
  {
    let del = supabase.from("receitas").delete().eq("bar_id", barId).eq("produto_id", produtoId);
    del = varianteId ? del.eq("variante_id", varianteId) : del.is("variante_id", null);
    await del;
  }

  if (resolvidas.length > 0) {
    const rows = resolvidas.map((r) => ({
      bar_id: barId,
      produto_id: produtoId,
      variante_id: varianteId,
      ingrediente_id: r.ingredienteId,
      quantidade: r.quantidade,
    }));
    const { error } = await supabase.from("receitas").insert(rows);
    if (error) return { error: "Erro ao salvar a ficha." };
  }

  // Recomputa custo do item + status honesto
  const custoCompleto =
    resolvidas.length > 0 && resolvidas.every((r) => r.custoUnitario != null && r.custoUnitario >= 0);
  const custo = custoCompleto
    ? custoDaFicha(resolvidas.map((r) => ({ quantidade: r.quantidade, custoUnitario: r.custoUnitario as number })))
    : null;
  const status: CustoStatus =
    resolvidas.length === 0 ? "sem" : custoCompleto ? "confirmada" : "sugerida";

  const tabela = varianteId ? "produto_variantes" : "produtos";
  const alvoId = varianteId ?? produtoId;
  await supabase.from(tabela).update({ custo, custo_status: status }).eq("id", alvoId).eq("bar_id", barId);

  revalidatePath("/dashboard/cardapio");
  revalidatePath("/dashboard");
  return { ok: true, custo, status };
}
