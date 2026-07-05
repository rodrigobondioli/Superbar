"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDosesDisponiveis } from "@/lib/mesa/queries";

export async function abrirComandaCliente(
  mesaId: string,
  barId: string,
  nomeCliente: string,
  telefoneCliente?: string,
): Promise<{ comandaId: string } | { error: string }> {
  const supabase = createAdminClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!turno) {
    return { error: "Bar fechado no momento. Sem turno ativo." };
  }

  const telefone = telefoneCliente?.replace(/\D/g, "") || null;
  const nome = nomeCliente.trim();

  // CRM: se deu telefone, cria/acha o cliente e vincula à comanda.
  // As estatísticas (visitas, gasto, ticket) são acumuladas no pagamento (caixa),
  // que já atualiza clientes quando a comanda tem cliente_id.
  let clienteId: string | null = null;
  if (telefone && telefone.length >= 10) {
    const { data: existente } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("bar_id", barId)
      .eq("telefone", telefone)
      .maybeSingle<{ id: string; nome: string }>();

    if (existente) {
      clienteId = existente.id;
      if (nome && nome !== existente.nome) {
        await supabase.from("clientes").update({ nome }).eq("id", existente.id);
      }
    } else {
      const { data: novo } = await supabase
        .from("clientes")
        .insert({ bar_id: barId, nome, telefone })
        .select("id")
        .single<{ id: string }>();
      clienteId = novo?.id ?? null;
    }
  }

  const { data: comanda, error } = await supabase
    .from("comandas")
    .insert({
      bar_id: barId,
      turno_id: turno.id,
      mesa_id: mesaId,
      nome_cliente: nome,
      telefone_cliente: telefone,
      cliente_id: clienteId,
      status: "aberta",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !comanda) {
    console.error("abrirComandaCliente: falha no insert de comanda", error);
    return { error: "Não foi possível abrir a comanda. Tente novamente." };
  }

  return { comandaId: comanda.id };
}

export async function buscarComandaPorTelefone(
  telefone: string,
  mesaId: string,
  barId: string,
): Promise<{ comandaId: string; nomeCliente: string } | { error: string }> {
  const supabase = createAdminClient();

  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 10) return { error: "Telefone inválido." };

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!turno) return { error: "Bar fechado no momento." };

  const { data: comanda } = await supabase
    .from("comandas")
    .select("id, nome_cliente")
    .eq("bar_id", barId)
    .eq("turno_id", turno.id)
    .eq("mesa_id", mesaId)
    .eq("telefone_cliente", digits)
    .eq("status", "aberta")
    .order("aberta_em", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; nome_cliente: string | null }>();

  if (!comanda) return { error: "Nenhuma comanda encontrada para este número nesta mesa." };

  return { comandaId: comanda.id, nomeCliente: comanda.nome_cliente ?? "Cliente" };
}

export async function chamarAtendimento(
  mesaId: string,
  barId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", barId)
    .eq("status", "aberto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!turno) return { error: "Bar fechado." };

  await supabase.from("chamadas").insert({
    bar_id: barId,
    mesa_id: mesaId,
    turno_id: turno.id,
    status: "pendente",
  });

  return { ok: true };
}

// ─── Auto-pedido: cliente pede pelo celular ───────────────────────────────────

export type ItemPedido = { produtoId: string; varianteId: string | null; quantidade: number };

/** Cliente envia um pedido pela tela da mesa. Preços são resolvidos no servidor
 *  (nunca confiar no valor vindo do cliente) e o toggle auto_pedido é validado aqui.
 *  Cria um `pedido` (status recebido) que cai na fila do Bartender, e os
 *  `comanda_items` na comanda do cliente. Sem member/user (adicionado_por null). */
export async function criarPedidoCliente(
  comandaId: string,
  barId: string,
  itens: ItemPedido[],
): Promise<{ ok: true; pedidoId: string } | { error: string }> {
  const linhas = itens.filter((i) => i.produtoId && i.quantidade > 0);
  if (linhas.length === 0) return { error: "Nenhum item selecionado." };

  const supabase = createAdminClient();

  // Guard do toggle (server-side, não só na UI)
  const { data: bar } = await supabase
    .from("bars")
    .select("configuracoes")
    .eq("id", barId)
    .eq("ativo", true)
    .maybeSingle<{ configuracoes: { auto_pedido?: boolean } }>();
  if (!bar) return { error: "Bar indisponível." };
  if (!bar.configuracoes?.auto_pedido) return { error: "Pedido pelo celular está desativado neste bar." };

  // Comanda precisa estar aberta e pertencer ao bar; dela vem o turno.
  const { data: comanda } = await supabase
    .from("comandas")
    .select("id, turno_id, status")
    .eq("id", comandaId)
    .eq("bar_id", barId)
    .maybeSingle<{ id: string; turno_id: string; status: string }>();
  if (!comanda || comanda.status !== "aberta") return { error: "Comanda não está aberta." };

  // Preços reais do banco
  const produtoIds = [...new Set(linhas.map((l) => l.produtoId))];
  const varianteIds = [...new Set(linhas.map((l) => l.varianteId).filter((v): v is string => !!v))];

  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, preco, ativo")
    .eq("bar_id", barId)
    .in("id", produtoIds)
    .returns<{ id: string; nome: string; preco: number; ativo: boolean }[]>();
  const prodMap = new Map((produtos ?? []).map((p) => [p.id, p]));

  // Trava de estoque: recusa item esgotado/sem dose suficiente (evita pedido fantasma).
  const doses = await getDosesDisponiveis(barId);
  const qtdPorProduto = new Map<string, number>();
  for (const l of linhas) qtdPorProduto.set(l.produtoId, (qtdPorProduto.get(l.produtoId) ?? 0) + Math.max(1, Math.floor(l.quantidade)));
  for (const [pid, qtd] of qtdPorProduto) {
    const disp = doses.get(pid);
    if (disp !== undefined && disp < qtd) {
      const nome = prodMap.get(pid)?.nome ?? "Esse item";
      return { error: disp <= 0 ? `${nome} está esgotado no momento.` : `Só temos ${disp} de "${nome}" agora.` };
    }
  }

  const varMap = new Map<string, { id: string; nome: string; preco: number; produto_id: string }>();
  if (varianteIds.length > 0) {
    const { data: variantes } = await supabase
      .from("produto_variantes")
      .select("id, nome, preco, produto_id, ativo")
      .in("id", varianteIds)
      .returns<{ id: string; nome: string; preco: number; produto_id: string; ativo: boolean }[]>();
    for (const v of variantes ?? []) if (v.ativo) varMap.set(v.id, v);
  }

  // Monta uma linha por unidade (compatível com o fluxo do garçom)
  type Row = {
    comanda_id: string; bar_id: string; produto_id: string;
    variante_id: string | null; variante_nome: string | null;
    quantidade: number; preco_unitario: number; preco_total: number;
    adicionado_por: string | null; adicionado_por_member_id: string | null;
  };
  const rows: Row[] = [];
  for (const l of linhas) {
    const prod = prodMap.get(l.produtoId);
    if (!prod || !prod.ativo) continue; // item inexistente/esgotado (desativado) é ignorado
    const variante = l.varianteId ? varMap.get(l.varianteId) : null;
    if (l.varianteId && (!variante || variante.produto_id !== l.produtoId)) continue;
    const preco = variante ? variante.preco : prod.preco;
    const qtd = Math.min(Math.max(1, Math.floor(l.quantidade)), 20);
    for (let i = 0; i < qtd; i++) {
      rows.push({
        comanda_id: comandaId,
        bar_id: barId,
        produto_id: l.produtoId,
        variante_id: variante?.id ?? null,
        variante_nome: variante?.nome ?? null,
        quantidade: 1,
        preco_unitario: preco,
        preco_total: preco,
        adicionado_por: null,
        adicionado_por_member_id: null,
      });
    }
  }

  if (rows.length === 0) return { error: "Itens indisponíveis." };

  // 1. Pedido → cai na fila do bar
  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedidos")
    .insert({ bar_id: barId, turno_id: comanda.turno_id, comanda_id: comandaId, status: "recebido" })
    .select("id")
    .single<{ id: string }>();
  if (pedidoErr || !pedido) {
    console.error("criarPedidoCliente: erro ao criar pedido", pedidoErr);
    return { error: "Não foi possível enviar o pedido. Tente novamente." };
  }

  // 2. Itens vinculados ao pedido
  const { error: itemsErr } = await supabase
    .from("comanda_items")
    .insert(rows.map((r) => ({ ...r, pedido_id: pedido.id })));
  if (itemsErr) {
    console.error("criarPedidoCliente: erro ao inserir itens", itemsErr);
    return { error: "Não foi possível enviar o pedido. Tente novamente." };
  }

  return { ok: true, pedidoId: pedido.id };
}
