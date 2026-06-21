-- Função atômica para fechar comanda como paga.
-- Substitui o padrão read-check-update da action, eliminando a race condition
-- onde dois requests simultâneos podiam ambos passar pela verificação de status
-- e registrar pagamento duplo.
--
-- Retorna {"ok": true, "total": <valor>} se encontrou a comanda em
-- status "aguardando_pagamento" e atualizou com sucesso.
-- Retorna {"ok": false} se a comanda não existe, pertence a outro bar,
-- ou já foi paga/cancelada — segunda chamada simultânea cai aqui.

CREATE OR REPLACE FUNCTION public.marcar_comanda_paga(
  p_comanda_id UUID,
  p_bar_id     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  UPDATE public.comandas
  SET status = 'paga'
  WHERE id     = p_comanda_id
    AND bar_id = p_bar_id
    AND status = 'aguardando_pagamento'
  RETURNING total INTO v_total;

  IF NOT FOUND THEN
    RETURN '{"ok": false}'::JSONB;
  END IF;

  RETURN jsonb_build_object('ok', true, 'total', v_total);
END;
$$;
