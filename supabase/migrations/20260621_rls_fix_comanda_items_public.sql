-- Fix: comanda_items_select_public usava USING (true) sem filtro de bar,
-- expondo itens de todos os bares para qualquer usuário anônimo.
-- Restringe ao escopo de bares ativos (suficiente para o flow do QR do cliente).

DROP POLICY IF EXISTS "comanda_items_select_public" ON public.comanda_items;

CREATE POLICY "comanda_items_select_public" ON public.comanda_items
  FOR SELECT
  TO anon, authenticated
  USING (
    bar_id IN (
      SELECT id FROM public.bars WHERE ativo = true
    )
  );

-- Mesma correção para produto_variantes (também estava com USING (true))
DROP POLICY IF EXISTS "produto_variantes_select_public" ON public.produto_variantes;

CREATE POLICY "produto_variantes_select_public" ON public.produto_variantes
  FOR SELECT
  TO anon, authenticated
  USING (
    produto_id IN (
      SELECT id FROM public.produtos
      WHERE bar_id IN (SELECT id FROM public.bars WHERE ativo = true)
    )
  );
