"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import type { PagamentoMetodo } from "@/types/database";

export async function registrarPagamento(
  comandaId: string,
  metodo: PagamentoMetodo,
  incluirServico: boolean,
  motivo?: string,
) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) return { error: "Erro ao iniciar turno." };

  const supabase = await createClient();

  // Atualiza status de forma atômica — elimina race condition de pagamento duplo.
  // Se dois requests chegarem ao mesmo tempo, apenas o primeiro encontra
  // status = "aguardando_pagamento"; o segundo recebe ok: false.
  const { data: rpc } = await supabase
    .rpc("marcar_comanda_paga", {
      p_comanda_id: comandaId,
      p_bar_id:     current.bar.id,
    })
    .single() as { data: { ok: boolean; total?: number } | null };

  if (!rpc?.ok) return { error: "Comanda não encontrada ou já foi paga." };

  const totalComanda = rpc.total ?? 0;

  // Taxa de serviço — lê do bar, nunca hardcode
  const taxaPct        = current.bar.configuracoes?.taxa_servico_pct ?? 10;
  const aplicarServico = incluirServico && metodo !== "cortesia";
  const servicoValor   = aplicarServico
    ? Math.round(totalComanda * (taxaPct / 100) * 100) / 100
    : null;
  const totalPago = totalComanda + (servicoValor ?? 0);

  // Insere pagamento
  await supabase.from("pagamentos").insert({
    comanda_id: comandaId,
    bar_id: current.bar.id,
    turno_id: turno.id,
    valor: totalComanda,
    taxa_servico_pct:   aplicarServico ? taxaPct : null,
    taxa_servico_valor: servicoValor,
    metodo,
    status: "confirmado",
    processado_por:           current.userId,
    processado_por_member_id: current.atribuicaoMemberId,
    processado_em: new Date().toISOString(),
    referencia: motivo ?? null,
  });

  // Atualiza totais do turno (inclui taxa de serviço no faturado)
  await supabase.rpc("incrementar_total_turno", {
    p_turno_id: turno.id,
    p_valor: totalPago,
  });

  // Atualiza agregados do cliente (se comanda tiver cliente vinculado)
  const { data: cmdCliente } = await supabase
    .from("comandas")
    .select("cliente_id")
    .eq("id", comandaId)
    .single<{ cliente_id: string | null }>();

  if (cmdCliente?.cliente_id) {
    const cid = cmdCliente.cliente_id;
    const { data: cli } = await supabase
      .from("clientes")
      .select("total_visitas, total_gasto")
      .eq("id", cid)
      .single<{ total_visitas: number; total_gasto: number }>();

    if (cli) {
      const novoTotal    = (cli.total_gasto ?? 0) + totalComanda;
      const novasVisitas = (cli.total_visitas ?? 0) + 1;

      // ── Detectar drink favorito automaticamente ──────────────────────────
      // Lógica: se o produto mais pedido aparece em ≥5 comandas pagas
      // E representa ≥50% das visitas → registra como drink_favorito.
      // Só atualiza se o threshold for atingido; mantém o valor manual caso não seja.
      let drinkFavorito: string | null = null;

      if (novasVisitas >= 5) {
        const { data: cmdIds } = await supabase
          .from("comandas")
          .select("id")
          .eq("cliente_id", cid)
          .eq("bar_id", current.bar.id)
          .eq("status", "paga");

        const ids = (cmdIds ?? []).map((c) => c.id);

        if (ids.length >= 5) {
          type ItemRow = { produto_id: string | null; comanda_id: string | null; produtos: { nome: string } | null };
          const { data: items } = await supabase
            .from("comanda_items")
            .select("produto_id, comanda_id, produtos(nome)")
            .in("comanda_id", ids)
            .neq("status", "cancelado") as { data: ItemRow[] | null };

          // Contar em quantas comandas distintas cada produto apareceu
          const porcComanda = new Map<string, Set<string>>();
          for (const item of items ?? []) {
            const nome = item.produtos?.nome;
            if (!nome || !item.comanda_id) continue;
            if (!porcComanda.has(nome)) porcComanda.set(nome, new Set());
            porcComanda.get(nome)!.add(item.comanda_id);
          }

          let topNome = "";
          let topCount = 0;
          for (const [nome, set] of porcComanda) {
            if (set.size > topCount) { topCount = set.size; topNome = nome; }
          }

          // Threshold: ≥5 comandas absolutas E ≥50% das visitas
          if (topNome && topCount >= 5 && topCount / ids.length >= 0.5) {
            drinkFavorito = topNome;
          }
        }
      }

      await supabase.from("clientes").update({
        total_visitas: novasVisitas,
        total_gasto:   novoTotal,
        ticket_medio:  Math.round((novoTotal / novasVisitas) * 100) / 100,
        ultima_visita: new Date().toISOString(),
        ...(drinkFavorito ? { drink_favorito: drinkFavorito } : {}),
      }).eq("id", cid);
    }
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clientes");
}

/**
 * Paga todas as comandas de uma mesa de uma vez.
 * Chama a lógica de registrarPagamento para cada comanda_id em série.
 * Erros parciais são tolerados (ex: comanda já paga por race condition).
 */
export async function registrarPagamentosMesa(
  comandaIds: string[],
  metodo: PagamentoMetodo,
  incluirServico: boolean,
  motivo?: string,
) {
  if (!comandaIds.length) return;

  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) return { error: "Erro ao iniciar turno." };

  const supabase = await createClient();
  const taxaPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;

  for (const comandaId of comandaIds) {
    const { data: rpc } = await supabase
      .rpc("marcar_comanda_paga", { p_comanda_id: comandaId, p_bar_id: current.bar.id })
      .single() as { data: { ok: boolean; total?: number } | null };

    if (!rpc?.ok) continue; // já paga ou não encontrada — tolera

    const totalComanda = rpc.total ?? 0;
    const aplicarServico = incluirServico && metodo !== "cortesia";
    const servicoValor   = aplicarServico ? Math.round(totalComanda * (taxaPct / 100) * 100) / 100 : null;
    const totalPago      = totalComanda + (servicoValor ?? 0);

    await supabase.from("pagamentos").insert({
      comanda_id: comandaId,
      bar_id: current.bar.id,
      turno_id: turno.id,
      valor: totalComanda,
      taxa_servico_pct:   aplicarServico ? taxaPct : null,
      taxa_servico_valor: servicoValor,
      metodo, status: "confirmado",
      processado_por:           current.userId,
      processado_por_member_id: current.atribuicaoMemberId,
      processado_em: new Date().toISOString(),
      referencia: motivo ?? null,
    });

    await supabase.rpc("incrementar_total_turno", { p_turno_id: turno.id, p_valor: totalPago });

    // Atualiza agregados de cliente (se houver vínculo)
    const { data: cmdCliente } = await supabase
      .from("comandas").select("cliente_id").eq("id", comandaId)
      .single<{ cliente_id: string | null }>();

    if (cmdCliente?.cliente_id) {
      const { data: cli } = await supabase
        .from("clientes").select("total_visitas, total_gasto").eq("id", cmdCliente.cliente_id)
        .single<{ total_visitas: number; total_gasto: number }>();
      if (cli) {
        await supabase.from("clientes").update({
          total_visitas: (cli.total_visitas ?? 0) + 1,
          total_gasto:   (cli.total_gasto ?? 0) + totalComanda,
          ticket_medio:  Math.round(((cli.total_gasto ?? 0) + totalComanda) / ((cli.total_visitas ?? 0) + 1) * 100) / 100,
          ultima_visita: new Date().toISOString(),
        }).eq("id", cmdCliente.cliente_id);
      }
    }
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clientes");
}
