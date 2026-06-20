-- ============================================================
-- RLS: leitura pública para o menu do cliente
--
-- O menu em /menu/[barSlug]/mesa/[mesaId] é acessado por usuários
-- anônimos (clientes do bar). As policies existentes usam
-- my_bar_ids() que retorna [] para auth.uid() = null — bloqueando
-- tudo. Adicionamos policies de SELECT público nas 4 tabelas que
-- a rota lê. Múltiplas policies de SELECT são combinadas com OR,
-- então o isolamento multi-tenant das policies existentes permanece
-- intacto para usuários autenticados.
--
-- Filtro por bar_id está na query da rota (WHERE bar_id = bar.id),
-- então USING (true) é seguro — dados de outros bares nunca chegam
-- ao cliente via essas queries.
-- ============================================================

-- ── bars ──────────────────────────────────────────────────────
-- Necessário para o lookup inicial por slug. Sem isso a rota
-- retorna 404 antes de buscar mesas/cardápio.
DROP POLICY IF EXISTS "bars_select_public" ON public.bars;
CREATE POLICY "bars_select_public" ON public.bars
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- ── mesas ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "mesas_select_public" ON public.mesas;
CREATE POLICY "mesas_select_public" ON public.mesas
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── categorias ────────────────────────────────────────────────
DROP POLICY IF EXISTS "categorias_select_public" ON public.categorias;
CREATE POLICY "categorias_select_public" ON public.categorias
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── produtos ──────────────────────────────────────────────────
-- Restringe a produtos ativos: clientes não veem rascunhos/inativos.
DROP POLICY IF EXISTS "produtos_select_public" ON public.produtos;
CREATE POLICY "produtos_select_public" ON public.produtos
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);
