-- Produção: estado 'pronto' — o bartender terminou o pedido e ele aguarda
-- retirada pelo garçom. O garçom entrega a partir de 'pronto' (ou 'preparando',
-- para bares que não usam o passo intermediário).

-- 1) status aceita 'pronto'
alter table public.pedidos drop constraint if exists pedidos_status_check;
alter table public.pedidos add constraint pedidos_status_check
  check (status in ('recebido', 'preparando', 'pronto', 'entregue'));

-- 2) marca quando ficou pronto (tempo de preparo / "há X pronto")
alter table public.pedidos add column if not exists pronto_em timestamptz;

-- 3) fn_entregar_pedido: aceita entregar a partir de 'preparando' OU 'pronto'.
--    (Única mudança em relação à versão anterior: a validação de status.)
create or replace function public.fn_entregar_pedido(
  p_pedido_id uuid,
  p_user_id   uuid,
  p_member_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_pedido  record;
  v_item    record;
  v_receita record;
  v_ing     record;
  v_deducao numeric(12,3);
  v_alertas jsonb := '[]'::jsonb;
begin
  -- 1. Valida pedido: 'preparando' OU 'pronto', e pertence ao bar do usuário
  select p.*
  into   v_pedido
  from   public.pedidos p
  where  p.id     = p_pedido_id
    and  p.status in ('preparando', 'pronto')
    and  public.is_bar_member(p.bar_id);

  if not found then
    return jsonb_build_object(
      'ok',    false,
      'error', 'Pedido não encontrado, status inválido ou acesso negado.'
    );
  end if;

  -- 2. Marca como entregue + registra quem entregou
  update public.pedidos
  set    status                 = 'entregue',
         entregue_em            = now(),
         entregue_por_member_id = p_member_id
  where  id = p_pedido_id;

  -- 3. Percorre itens ativos do pedido
  for v_item in
    select id, produto_id, quantidade, bar_id
    from   public.comanda_items
    where  pedido_id = p_pedido_id
      and  status    = 'ativo'
  loop

    -- 3a. Percorre receita do produto (sem receita = sem baixa, sem erro)
    for v_receita in
      select ingrediente_id,
             quantidade as qtd_por_unidade
      from   public.receitas
      where  produto_id = v_item.produto_id
        and  bar_id     = v_item.bar_id
    loop
      v_deducao := v_receita.qtd_por_unidade * v_item.quantidade;

      -- 3b. Snapshot do custo atual antes de decrementar
      select custo_atual
      into   v_ing
      from   public.ingredientes
      where  id = v_receita.ingrediente_id;

      -- 3c. Cria movimento de saída (quantidade negativa = consumo)
      insert into public.ingrediente_movimentos (
        bar_id, ingrediente_id,
        pedido_id, comanda_item_id,
        tipo, quantidade, custo_unitario,
        criado_por, criado_por_member_id
      ) values (
        v_item.bar_id,
        v_receita.ingrediente_id,
        p_pedido_id,
        v_item.id,
        'venda',
        -v_deducao,
        v_ing.custo_atual,
        p_user_id,
        p_member_id
      );

      -- 3d. Decrementa estoque_atual
      update public.ingredientes
      set    estoque_atual = estoque_atual - v_deducao,
             atualizado_em = now()
      where  id = v_receita.ingrediente_id;

      -- 3e. Alerta de estoque baixo
      select id, nome, estoque_atual, estoque_minimo
      into   v_ing
      from   public.ingredientes
      where  id = v_receita.ingrediente_id;

      if v_ing.estoque_minimo > 0
        and v_ing.estoque_atual < v_ing.estoque_minimo
      then
        v_alertas := v_alertas || jsonb_build_array(
          jsonb_build_object(
            'ingrediente_id', v_ing.id,
            'nome',           v_ing.nome,
            'estoque_atual',  v_ing.estoque_atual,
            'estoque_minimo', v_ing.estoque_minimo
          )
        );
      end if;

    end loop; -- receita
  end loop;   -- item

  return jsonb_build_object('ok', true, 'alertas', v_alertas);
end;
$$;
