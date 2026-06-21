-- ============================================================
-- RLS: leitura pública para a página do cliente /mesa/[mesaId]
--
-- O cliente acessa via QR code sem autenticação.
-- Precisa ler seus próprios itens da comanda em tempo real.
-- O comanda_id é um UUID (difícil de adivinhar) e é armazenado
-- em sessionStorage no celular do cliente.
--
-- produto_variantes: necessário para exibir variantes no cardápio.
-- ============================================================

-- ── comanda_items ──────────────────────────────────────────────
DROP POLICY IF EXISTS "comanda_items_select_public" ON public.comanda_items;
CREATE POLICY "comanda_items_select_public" ON public.comanda_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── produto_variantes ──────────────────────────────────────────
DROP POLICY IF EXISTS "produto_variantes_select_public" ON public.produto_variantes;
CREATE POLICY "produto_variantes_select_public" ON public.produto_variantes
  FOR SELECT
  TO anon, authenticated
  USING (true);
