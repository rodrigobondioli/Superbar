-- ============================================================
-- P1-2: Criação de pedido ATÔMICA (pedido + itens numa transação).
--
-- Antes: criarPedido (staff) e criarPedidoCliente (QR) inseriam o pedido e
-- depois os comanda_items em chamadas separadas, sem transação. Se o insert de
-- itens falhasse (rede/RLS), o pedido já estava criado -> PEDIDO ÓRFÃO na fila
-- do bartender, e o reenvio do cliente gerava DUPLICATA.
--
-- Agora: uma função faz pedido + itens numa transação. Falha nos itens reverte
-- o pedido. Os itens usam p_bar_id/p_comanda_id da função (não confia no
-- payload) — evita injeção de item em outra comanda. Preço continua vindo do
-- servidor (o app calcula e passa preco_unitario/preco_total prontos).
--
-- Retorno: { ok: true, pedido_id } | { ok: false, error }.
-- ============================================================

CREATE OR REPLACE FUNCTION public.criar_pedido_com_itens(
  p_bar_id               UUID,
  p_comanda_id           UUID,
  p_turno_id             UUID,
  p_itens                JSONB,
  p_criado_por_member_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_qtd       INT;
BEGIN
  IF p_itens IS NULL
     OR jsonb_typeof(p_itens) <> 'array'
     OR jsonb_array_length(p_itens) = 0 THEN
    RETURN '{"ok": false, "error": "sem itens"}'::JSONB;
  END IF;

  -- 1. Cria o pedido (cai na fila).
  INSERT INTO public.pedidos (bar_id, turno_id, comanda_id, status, criado_por_member_id)
  VALUES (p_bar_id, p_turno_id, p_comanda_id, 'recebido', p_criado_por_member_id)
  RETURNING id INTO v_pedido_id;

  -- 2. Itens vinculados. Falha aqui reverte TODA a transação (inclui o pedido).
  --    bar_id/comanda_id vêm da função — o payload não pode redirecionar o item.
  INSERT INTO public.comanda_items (
    comanda_id, bar_id, pedido_id, produto_id, variante_id, variante_nome,
    quantidade, preco_unitario, preco_total, observacao,
    adicionado_por, adicionado_por_member_id
  )
  SELECT
    p_comanda_id, p_bar_id, v_pedido_id,
    x.produto_id, x.variante_id, x.variante_nome,
    COALESCE(x.quantidade, 1), x.preco_unitario, x.preco_total, x.observacao,
    x.adicionado_por, x.adicionado_por_member_id
  FROM jsonb_to_recordset(p_itens) AS x(
    produto_id               UUID,
    variante_id              UUID,
    variante_nome            TEXT,
    quantidade               INT,
    preco_unitario           NUMERIC,
    preco_total              NUMERIC,
    observacao               TEXT,
    adicionado_por           UUID,
    adicionado_por_member_id UUID
  );

  GET DIAGNOSTICS v_qtd = ROW_COUNT;
  IF v_qtd = 0 THEN
    RAISE EXCEPTION 'criar_pedido_com_itens: nenhum item inserido';
  END IF;

  RETURN jsonb_build_object('ok', true, 'pedido_id', v_pedido_id);
END;
$$;

COMMENT ON FUNCTION public.criar_pedido_com_itens IS
  'Cria pedido + comanda_items numa transação (P1-2). Falha nos itens reverte o
   pedido — sem pedido órfão. Usada por criarPedido (staff) e criarPedidoCliente (QR).';
