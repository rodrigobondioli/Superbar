-- Incrementa total_vendas e total_comandas atomicamente num único UPDATE.
-- Elimina a race condition de read-modify-write em registrarPagamento().

CREATE OR REPLACE FUNCTION incrementar_total_turno(
  p_turno_id UUID,
  p_valor    NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE turnos
  SET
    total_vendas   = COALESCE(total_vendas,   0) + p_valor,
    total_comandas = COALESCE(total_comandas, 0) + 1
  WHERE id = p_turno_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
