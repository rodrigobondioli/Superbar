-- ============================================================
-- P0-1: Registro de pagamento ATÔMICO.
--
-- Antes: registrarPagamento() fazia, em chamadas separadas e SEM transação:
--   1) rpc marcar_comanda_paga (atômica)  -> comanda vira 'paga'
--   2) insert em pagamentos               (sem checagem de erro)
--   3) rpc incrementar_total_turno
--   4) update agregados do cliente        (read-modify-write, com race)
-- Se a rede/servidor caísse entre (1) e (2), a comanda ficava 'paga' SEM
-- linha em pagamentos -> dinheiro sumia do caixa e o fechamento não batia.
--
-- Agora: uma única função SECURITY DEFINER faz tudo numa transação só.
-- Qualquer falha (insert, turno, cliente) REVERTE o passo 1 -> a comanda
-- volta a 'aguardando_pagamento' e nada fica pela metade.
-- De brinde: os agregados do cliente usam UPDATE relativo (corrige a race).
--
-- Contrato de retorno:
--   { ok: true, total, total_pago, cliente_id, visitas }  -> pagou agora
--   { ok: false }                                          -> não existe,
--       é de outro bar, ou já foi paga/cancelada (2ª chamada simultânea).
-- ============================================================

CREATE OR REPLACE FUNCTION public.registrar_pagamento(
  p_comanda_id      UUID,
  p_bar_id          UUID,
  p_turno_id        UUID,
  p_metodo          pagamento_metodo,
  p_incluir_servico BOOLEAN,
  p_taxa_pct        NUMERIC,
  p_user_id         UUID,
  p_member_id       UUID,
  p_referencia      TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total      NUMERIC;
  v_cliente_id UUID;
  v_aplicar    BOOLEAN;
  v_servico    NUMERIC;
  v_total_pago NUMERIC;
  v_visitas    INT;
BEGIN
  -- 1. Marca a comanda como paga de forma atômica (guarda anti-pagamento-duplo).
  --    Só a PRIMEIRA chamada encontra status = 'aguardando_pagamento'.
  UPDATE public.comandas
  SET    status = 'paga'
  WHERE  id     = p_comanda_id
    AND  bar_id = p_bar_id
    AND  status = 'aguardando_pagamento'
  RETURNING total, cliente_id INTO v_total, v_cliente_id;

  IF NOT FOUND THEN
    RETURN '{"ok": false}'::JSONB;
  END IF;

  v_total := COALESCE(v_total, 0);

  -- 2. Taxa de serviço — nunca em cortesia.
  v_aplicar    := p_incluir_servico AND p_metodo <> 'cortesia';
  v_servico    := CASE WHEN v_aplicar THEN round(v_total * (p_taxa_pct / 100.0), 2) ELSE NULL END;
  v_total_pago := v_total + COALESCE(v_servico, 0);

  -- 3. Registra o pagamento. Falha aqui reverte TODA a transação (inclui o passo 1).
  INSERT INTO public.pagamentos (
    comanda_id, bar_id, turno_id, valor,
    taxa_servico_pct, taxa_servico_valor,
    metodo, status,
    processado_por, processado_por_member_id, processado_em,
    referencia
  ) VALUES (
    p_comanda_id, p_bar_id, p_turno_id, v_total,
    CASE WHEN v_aplicar THEN p_taxa_pct ELSE NULL END, v_servico,
    p_metodo, 'confirmado',
    p_user_id, p_member_id, now(),
    p_referencia
  );

  -- 4. Incrementa total do turno (mesma transação).
  PERFORM public.incrementar_total_turno(p_turno_id, v_total_pago);

  -- 5. Agregados do cliente — UPDATE relativo (sem read-modify-write, sem race).
  IF v_cliente_id IS NOT NULL THEN
    UPDATE public.clientes
    SET total_visitas = COALESCE(total_visitas, 0) + 1,
        total_gasto   = COALESCE(total_gasto, 0) + v_total,
        ticket_medio  = round(
          (COALESCE(total_gasto, 0) + v_total) / (COALESCE(total_visitas, 0) + 1), 2
        ),
        ultima_visita = now()
    WHERE id = v_cliente_id
    RETURNING total_visitas INTO v_visitas;
  END IF;

  RETURN jsonb_build_object(
    'ok',         true,
    'total',      v_total,
    'total_pago', v_total_pago,
    'cliente_id', v_cliente_id,
    'visitas',    v_visitas
  );
END;
$$;

COMMENT ON FUNCTION public.registrar_pagamento IS
  'Pagamento transacional: marca comanda paga + insere pagamento + incrementa turno
   + atualiza agregados do cliente, tudo numa transação (P0-1). Substitui o padrão
   de chamadas separadas de registrarPagamento(). Retorna {ok:false} para a 2a
   chamada simultânea ou comanda já paga — mantém a guarda anti-duplo.';
