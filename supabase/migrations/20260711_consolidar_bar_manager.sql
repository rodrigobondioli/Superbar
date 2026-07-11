-- ============================================================
-- Consolida o papel 'gerente' em 'bar_manager'
--
-- Eram dois papéis fazendo a mesma coisa (ambos rotulavam "Gerente"). O papel
-- canônico passa a ser 'bar_manager' (rótulo "Bar Manager"). O código trata
-- qualquer 'gerente' remanescente como bar_manager (normalizarRole), mas aqui
-- migramos os dados existentes de vez.
-- ============================================================

update public.bar_members
   set role = 'bar_manager'
 where role = 'gerente';
