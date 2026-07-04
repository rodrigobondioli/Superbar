-- ============================================================
-- Fase 0 — Reconciliar o modelo de custo
--
-- 1. Ficha por variante: receitas.variante_id (nullable).
--    variante_id NULL  = ingredientes comuns do produto (base).
--    variante_id = X    = ingredientes específicos daquela variante (slots).
--    Custo de um item = comuns (NULL) + os da sua variante.
--
-- 2. Flag de honestidade da margem: custo_status em produtos e variantes.
--    'sem'        = sem custo (margem cega)
--    'sugerida'   = custo veio de sugestão da IA, não confirmado (estimativa)
--    'confirmada' = dono confirmou (ficha ou custo direto que ele digitou)
--
-- 3. fn_entregar_pedido: baixa de estoque ciente de variante.
--
-- Não perde dado: produtos/variantes com custo já preenchido viram 'confirmada'.
-- ============================================================


-- ── 1. Ficha por variante ─────────────────────────────────────────────────────

alter table public.receitas
  add column if not exists variante_id uuid references public.produto_variantes(id) on delete cascade;

-- A UNIQUE antiga (produto_id, ingrediente_id) não distingue variante.
-- Troca por índice único que trata NULL como valor (COALESCE) — bulletproof em
-- qualquer versão do Postgres: um ingrediente aparece uma vez por (produto, variante).
alter table public.receitas
  drop constraint if exists receitas_produto_id_ingrediente_id_key;

create unique index if not exists receitas_produto_variante_ingrediente_uidx
  on public.receitas (
    produto_id,
    coalesce(variante_id, '00000000-0000-0000-0000-000000000000'::uuid),
    ingrediente_id
  );

create index if not exists idx_receitas_variante
  on public.receitas (variante_id);

comment on column public.receitas.variante_id is
  'NULL = ingrediente comum do produto (base, vale para todas as variantes).
   Preenchido = ingrediente específico da variante (ex: o destilado, a fruta).
   Custo do item = soma dos comuns (NULL) + os da variante pedida.';


-- ── 2. Flag de honestidade da margem ──────────────────────────────────────────

alter table public.produtos
  add column if not exists custo_status text not null default 'sem'
    check (custo_status in ('sem', 'sugerida', 'confirmada'));

alter table public.produto_variantes
  add column if not exists custo_status text not null default 'sem'
    check (custo_status in ('sem', 'sugerida', 'confirmada'));

-- Backfill: quem já tem custo digitado pelo dono conta como confirmado.
update public.produtos
  set custo_status = 'confirmada'
  where custo is not null and custo_status = 'sem';

update public.produto_variantes
  set custo_status = 'confirmada'
  where custo is not null and custo_status = 'sem';

comment on column public.produtos.custo_status is
  'Confiança do custo/margem: sem (cega) | sugerida (IA, estimativa) | confirmada (dono).
   O dashboard só trata como margem real o que está confirmada.';


-- ── 3. fn_entregar_pedido ciente de variante ──────────────────────────────────
--    Única mudança vs. versão anterior: a receita percorrida considera a variante
--    do item (comuns NULL + específicos da variante).

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

  -- 3. Percorre itens ativos do pedido (agora com a variante pedida)
  for v_item in
    select id, produto_id, variante_id, quantidade, bar_id
    from   public.comanda_items
    where  pedido_id = p_pedido_id
      and  status    = 'ativo'
  loop

    -- 3a. Receita efetiva do item: comuns (variante_id NULL)
    --     + específicos da variante pedida. Sem receita = sem baixa, sem erro.
    for v_receita in
      select ingrediente_id,
             quantidade as qtd_por_unidade
      from   public.receitas
      where  produto_id = v_item.produto_id
        and  bar_id     = v_item.bar_id
        and  (variante_id is null or variante_id = v_item.variante_id)
    loop
      v_deducao := v_receita.qtd_por_unidade * v_item.quantidade;

      -- 3b. Snapshot do custo atual antes de decrementar
      select custo_atual
      into   v_ing
      from   public.ingredientes
      where  id = v_receita.ingrediente_id;

      -- 3c. Movimento de saída (quantidade negativa = consumo)
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
