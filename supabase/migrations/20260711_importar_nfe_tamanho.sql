-- ============================================================
-- Praticidade: puxar o tamanho da embalagem da NF-e
--
-- A descrição do produto na nota (xProd) traz o volume ("...750ML"). O parser
-- extrai e manda tamanho_embalagem + unidade_compra por item. Aqui gravamos no
-- insumo — SÓ preenche se estiver vazio (coalesce), pra não sobrescrever um
-- valor que o dono já corrigiu na contagem. NÃO mexe em unidade nem em
-- quantidade (o estoque continua sendo dado baixa como antes — Princípio 12).
-- ============================================================

create or replace function public.importar_nfe(
  p_bar_id          uuid,
  p_cnpj            text,
  p_fornecedor_nome text,
  p_chave_nfe       text,
  p_itens           jsonb,
  p_user_id         uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fornecedor_id uuid;
  v_item          jsonb;
  v_ing_id        uuid;
  v_unidade       text;
  v_custo         numeric;
  v_qtd           numeric;
  v_tamanho       numeric;
  v_unid_compra   text;
  v_chave         text;
  v_count         int := 0;
begin
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    return '{"ok": false, "error": "sem itens"}'::jsonb;
  end if;

  -- Dedup: não importa a mesma nota duas vezes.
  if p_chave_nfe is not null and exists (
    select 1 from public.nfe_importadas where bar_id = p_bar_id and chave_nfe = p_chave_nfe
  ) then
    return '{"ok": false, "error": "Esta nota já foi importada."}'::jsonb;
  end if;

  -- Fornecedor (upsert por CNPJ).
  if p_cnpj is not null and length(trim(p_cnpj)) > 0 then
    insert into public.fornecedores (bar_id, cnpj, nome)
    values (p_bar_id, p_cnpj, coalesce(nullif(trim(p_fornecedor_nome), ''), 'Fornecedor'))
    on conflict (bar_id, cnpj) do update set nome = excluded.nome
    returning id into v_fornecedor_id;
  end if;

  -- Itens.
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_custo       := coalesce((v_item->>'custo_unitario')::numeric, 0);
    v_qtd         := coalesce((v_item->>'quantidade')::numeric, 0);
    v_unidade     := coalesce(nullif(v_item->>'unidade', ''), 'un');
    if v_unidade not in ('un','ml','l','g','kg') then v_unidade := 'un'; end if;
    v_tamanho     := nullif(v_item->>'tamanho_embalagem', '')::numeric;
    v_unid_compra := nullif(v_item->>'unidade_compra', '');

    v_ing_id := nullif(v_item->>'ingrediente_id', '')::uuid;

    -- Novo insumo, se não veio casado.
    if v_ing_id is null then
      insert into public.ingredientes (bar_id, nome, unidade, custo_atual, estoque_atual)
      values (p_bar_id, coalesce(nullif(trim(v_item->>'nome'), ''), 'Insumo'), v_unidade, v_custo, 0)
      returning id into v_ing_id;
    end if;

    -- Atualiza custo + entrada de estoque + preenche tamanho (só se vazio).
    update public.ingredientes
    set custo_atual       = v_custo,
        estoque_atual     = estoque_atual + v_qtd,
        tamanho_embalagem = coalesce(tamanho_embalagem, v_tamanho),
        unidade_compra    = coalesce(unidade_compra, v_unid_compra),
        atualizado_em     = now()
    where id = v_ing_id and bar_id = p_bar_id;

    -- Movimento de entrada (audit trail).
    insert into public.ingrediente_movimentos
      (bar_id, ingrediente_id, tipo, quantidade, custo_unitario, fornecedor_id, chave_nfe, criado_por, motivo)
    values
      (p_bar_id, v_ing_id, 'entrada', v_qtd, v_custo, v_fornecedor_id, p_chave_nfe, p_user_id, 'Importação NF-e');

    -- Memoriza o casamento (GTIN, ou fornecedor:cProd).
    v_chave := coalesce(
      nullif(v_item->>'gtin', ''),
      case when v_fornecedor_id is not null and nullif(v_item->>'cprod','') is not null
           then v_fornecedor_id::text || ':' || (v_item->>'cprod') end
    );
    if v_chave is not null then
      insert into public.nfe_item_map (bar_id, chave, ingrediente_id, fornecedor_id)
      values (p_bar_id, v_chave, v_ing_id, v_fornecedor_id)
      on conflict (bar_id, chave) do update set ingrediente_id = excluded.ingrediente_id;
    end if;

    v_count := v_count + 1;
  end loop;

  -- Marca a nota como importada.
  if p_chave_nfe is not null then
    insert into public.nfe_importadas (bar_id, chave_nfe) values (p_bar_id, p_chave_nfe)
    on conflict do nothing;
  end if;

  return jsonb_build_object('ok', true, 'fornecedor_id', v_fornecedor_id, 'itens', v_count);
end;
$$;
