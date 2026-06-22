-- Adiciona custo_unitario em estoque_movimentos.
-- Captura o custo de compra por unidade no momento do registro.
-- Nullable: custo é relevante em entradas (compra), irrelevante em perdas/ajustes.
-- Usado futuramente para calcular CMV via estoque de produto (antes das receitas de ingredientes).

ALTER TABLE public.estoque_movimentos
  ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(12,4) NULL;

COMMENT ON COLUMN public.estoque_movimentos.custo_unitario IS
  'Custo unitário no momento do movimento (R$). Preenchido em compras. Snapshot imutável.';
