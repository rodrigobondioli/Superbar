-- Recalcula comandas.total sempre que comanda_items for inserido, atualizado ou deletado.
-- O campo status usa 'ativo' | 'cancelado' — itens cancelados são excluídos do total.

CREATE OR REPLACE FUNCTION recalcular_total_comanda()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comandas
  SET total = (
    SELECT COALESCE(SUM(preco_unitario * quantidade), 0)
    FROM comanda_items
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
      AND status != 'cancelado'
  )
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalcular_total ON comanda_items;
CREATE TRIGGER trigger_recalcular_total
AFTER INSERT OR UPDATE OR DELETE ON comanda_items
FOR EACH ROW EXECUTE FUNCTION recalcular_total_comanda();
