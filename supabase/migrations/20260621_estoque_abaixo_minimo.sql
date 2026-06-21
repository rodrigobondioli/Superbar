-- Coluna gerada: abaixo_minimo = quantidade_atual < quantidade_minima
-- "Estoque abaixo do mínimo" é regra de produto, não só uma consulta —
-- merece existir no banco como verdade única.
-- Dashboard, IA e qualquer consumidor futuro leem o mesmo booleano,
-- sem duplicar a lógica de comparação em app layer.

ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS abaixo_minimo BOOLEAN
    GENERATED ALWAYS AS (quantidade_atual < quantidade_minima) STORED;

-- Índice parcial: só indexa as linhas que realmente estão em alerta.
-- Reads de alertas são O(alertas), não O(estoque total do bar).
CREATE INDEX IF NOT EXISTS idx_estoque_alertas
  ON public.estoque (bar_id)
  WHERE abaixo_minimo = true;
