-- ============================================================
-- RLS — Row Level Security
-- Multi-tenant: cada bar é isolado pelo bar_id.
-- Isolamento garantido pelo DB — independente do app.
--
-- Idempotente: DROP IF EXISTS antes de cada CREATE.
-- Safe pra rodar em banco que já tem políticas e em banco limpo.
-- ============================================================

-- ── Função auxiliar ──────────────────────────────────────────
-- SECURITY DEFINER: roda como o owner (postgres) e bypass RLS
-- na própria tabela bar_members, evitando recursão infinita.

CREATE OR REPLACE FUNCTION public.my_bar_ids()
  RETURNS uuid[]
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT bar_id
    FROM   public.bar_members
    WHERE  user_id = auth.uid()
      AND  ativo   = true
  );
$$;

-- Função helper para checar role do usuário no bar
CREATE OR REPLACE FUNCTION public.my_role_in_bar(p_bar_id uuid)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role::text
  FROM   public.bar_members
  WHERE  bar_id  = p_bar_id
    AND  user_id = auth.uid()
    AND  ativo   = true
  LIMIT 1;
$$;


-- ============================================================
-- TABELAS COM bar_id direto
-- Padrão: qualquer membro ativo do bar pode ver e operar.
-- DELETE restrito a dono/gerente nas tabelas sensíveis.
-- ============================================================

-- ── bars ─────────────────────────────────────────────────────
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bars_select"  ON public.bars;
DROP POLICY IF EXISTS "bars_update"  ON public.bars;
DROP POLICY IF EXISTS "bars_insert"  ON public.bars;

CREATE POLICY "bars_select" ON public.bars
  FOR SELECT USING (id = ANY(public.my_bar_ids()));

-- Só dono pode editar dados do bar
CREATE POLICY "bars_update" ON public.bars
  FOR UPDATE USING (
    public.my_role_in_bar(id) = 'dono'
  );

-- Insert só via função server-side (onboarding), não pelo app diretamente
-- Não criamos política de INSERT aqui: service_role cuida disso.


-- ── bar_members ───────────────────────────────────────────────
ALTER TABLE public.bar_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bar_members_select" ON public.bar_members;
DROP POLICY IF EXISTS "bar_members_insert" ON public.bar_members;
DROP POLICY IF EXISTS "bar_members_update" ON public.bar_members;
DROP POLICY IF EXISTS "bar_members_delete" ON public.bar_members;

CREATE POLICY "bar_members_select" ON public.bar_members
  FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));

-- Só dono/gerente convida e gerencia membros
CREATE POLICY "bar_members_insert" ON public.bar_members
  FOR INSERT WITH CHECK (
    public.my_role_in_bar(bar_id) IN ('dono', 'gerente')
  );

CREATE POLICY "bar_members_update" ON public.bar_members
  FOR UPDATE USING (
    public.my_role_in_bar(bar_id) IN ('dono', 'gerente')
  );

CREATE POLICY "bar_members_delete" ON public.bar_members
  FOR DELETE USING (
    public.my_role_in_bar(bar_id) = 'dono'
  );


-- ── profiles ──────────────────────────────────────────────────
-- Cada usuário vê o próprio perfil + perfis de colegas do mesmo bar
-- (necessário para a tela "Quem é você?" do bartender).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM public.bar_members
      WHERE  bar_id = ANY(public.my_bar_ids()) AND ativo = true
    )
  );

-- Cada usuário só edita o próprio perfil
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Insert criado pelo trigger on auth.users — não pelo app
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());


-- ── Macro para tabelas simples com bar_id ────────────────────
-- Gera as 4 políticas padrão: SELECT/INSERT/UPDATE/DELETE por bar_id.
-- Usamos isso para: turnos, comandas, comanda_items, pagamentos,
-- produtos, categorias, mesas, estoque, estoque_movimentos,
-- fornecedores, compras, assinaturas, pedidos_cliente.

-- turnos
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "turnos_select" ON public.turnos;
DROP POLICY IF EXISTS "turnos_insert" ON public.turnos;
DROP POLICY IF EXISTS "turnos_update" ON public.turnos;
DROP POLICY IF EXISTS "turnos_delete" ON public.turnos;
CREATE POLICY "turnos_select" ON public.turnos FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "turnos_insert" ON public.turnos FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "turnos_update" ON public.turnos FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "turnos_delete" ON public.turnos FOR DELETE USING (public.my_role_in_bar(bar_id) = 'dono');

-- comandas
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comandas_select" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update" ON public.comandas;
DROP POLICY IF EXISTS "comandas_delete" ON public.comandas;
CREATE POLICY "comandas_select" ON public.comandas FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "comandas_insert" ON public.comandas FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "comandas_update" ON public.comandas FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "comandas_delete" ON public.comandas FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));

-- comanda_items
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comanda_items_select" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_insert" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_update" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_delete" ON public.comanda_items;
CREATE POLICY "comanda_items_select" ON public.comanda_items FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "comanda_items_insert" ON public.comanda_items FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "comanda_items_update" ON public.comanda_items FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "comanda_items_delete" ON public.comanda_items FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));

-- pagamentos
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pagamentos_select" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_insert" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_update" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_delete" ON public.pagamentos;
CREATE POLICY "pagamentos_select" ON public.pagamentos FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "pagamentos_insert" ON public.pagamentos FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
-- Estorno: qualquer membro pode registrar, mas idealmente caixa/dono
CREATE POLICY "pagamentos_update" ON public.pagamentos FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "pagamentos_delete" ON public.pagamentos FOR DELETE USING (public.my_role_in_bar(bar_id) = 'dono');

-- produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "produtos_select" ON public.produtos;
DROP POLICY IF EXISTS "produtos_insert" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update" ON public.produtos;
DROP POLICY IF EXISTS "produtos_delete" ON public.produtos;
CREATE POLICY "produtos_select" ON public.produtos FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "produtos_insert" ON public.produtos FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "produtos_update" ON public.produtos FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "produtos_delete" ON public.produtos FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente', 'bar_manager'));

-- categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categorias_select" ON public.categorias;
DROP POLICY IF EXISTS "categorias_insert" ON public.categorias;
DROP POLICY IF EXISTS "categorias_update" ON public.categorias;
DROP POLICY IF EXISTS "categorias_delete" ON public.categorias;
CREATE POLICY "categorias_select" ON public.categorias FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "categorias_insert" ON public.categorias FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "categorias_update" ON public.categorias FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "categorias_delete" ON public.categorias FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente', 'bar_manager'));

-- mesas
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mesas_select" ON public.mesas;
DROP POLICY IF EXISTS "mesas_insert" ON public.mesas;
DROP POLICY IF EXISTS "mesas_update" ON public.mesas;
DROP POLICY IF EXISTS "mesas_delete" ON public.mesas;
CREATE POLICY "mesas_select" ON public.mesas FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "mesas_insert" ON public.mesas FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "mesas_update" ON public.mesas FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "mesas_delete" ON public.mesas FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));

-- estoque
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_select" ON public.estoque;
DROP POLICY IF EXISTS "estoque_insert" ON public.estoque;
DROP POLICY IF EXISTS "estoque_update" ON public.estoque;
DROP POLICY IF EXISTS "estoque_delete" ON public.estoque;
CREATE POLICY "estoque_select" ON public.estoque FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "estoque_insert" ON public.estoque FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "estoque_update" ON public.estoque FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "estoque_delete" ON public.estoque FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));

-- estoque_movimentos
ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_movimentos_select" ON public.estoque_movimentos;
DROP POLICY IF EXISTS "estoque_movimentos_insert" ON public.estoque_movimentos;
DROP POLICY IF EXISTS "estoque_movimentos_update" ON public.estoque_movimentos;
CREATE POLICY "estoque_movimentos_select" ON public.estoque_movimentos FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "estoque_movimentos_insert" ON public.estoque_movimentos FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
-- Movimentos não se editam: imutabilidade do log. Sem UPDATE/DELETE policy.

-- fornecedores
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fornecedores_select" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_insert" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_update" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_delete" ON public.fornecedores;
CREATE POLICY "fornecedores_select" ON public.fornecedores FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "fornecedores_insert" ON public.fornecedores FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "fornecedores_update" ON public.fornecedores FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "fornecedores_delete" ON public.fornecedores FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));

-- compras
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compras_select" ON public.compras;
DROP POLICY IF EXISTS "compras_insert" ON public.compras;
DROP POLICY IF EXISTS "compras_update" ON public.compras;
DROP POLICY IF EXISTS "compras_delete" ON public.compras;
CREATE POLICY "compras_select" ON public.compras FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "compras_insert" ON public.compras FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "compras_update" ON public.compras FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "compras_delete" ON public.compras FOR DELETE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));

-- assinaturas
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assinaturas_select" ON public.assinaturas;
CREATE POLICY "assinaturas_select" ON public.assinaturas
  FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
-- Insert/update de assinatura só via service_role (billing server-side)

-- pedidos_cliente
ALTER TABLE public.pedidos_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_cliente_select" ON public.pedidos_cliente;
DROP POLICY IF EXISTS "pedidos_cliente_insert" ON public.pedidos_cliente;
DROP POLICY IF EXISTS "pedidos_cliente_update" ON public.pedidos_cliente;
CREATE POLICY "pedidos_cliente_select" ON public.pedidos_cliente FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "pedidos_cliente_insert" ON public.pedidos_cliente FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));
CREATE POLICY "pedidos_cliente_update" ON public.pedidos_cliente FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));


-- ============================================================
-- TABELAS SEM bar_id DIRETO (join necessário)
-- ============================================================

-- ── produto_variantes (via produtos.bar_id) ───────────────────
ALTER TABLE public.produto_variantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "produto_variantes_select" ON public.produto_variantes;
DROP POLICY IF EXISTS "produto_variantes_insert" ON public.produto_variantes;
DROP POLICY IF EXISTS "produto_variantes_update" ON public.produto_variantes;
DROP POLICY IF EXISTS "produto_variantes_delete" ON public.produto_variantes;

CREATE POLICY "produto_variantes_select" ON public.produto_variantes
  FOR SELECT USING (
    produto_id IN (SELECT id FROM public.produtos WHERE bar_id = ANY(public.my_bar_ids()))
  );

CREATE POLICY "produto_variantes_insert" ON public.produto_variantes
  FOR INSERT WITH CHECK (
    produto_id IN (SELECT id FROM public.produtos WHERE bar_id = ANY(public.my_bar_ids()))
  );

CREATE POLICY "produto_variantes_update" ON public.produto_variantes
  FOR UPDATE USING (
    produto_id IN (SELECT id FROM public.produtos WHERE bar_id = ANY(public.my_bar_ids()))
  );

CREATE POLICY "produto_variantes_delete" ON public.produto_variantes
  FOR DELETE USING (
    produto_id IN (SELECT id FROM public.produtos WHERE bar_id = ANY(public.my_bar_ids()))
  );


-- ── compra_items (via compras.bar_id) ─────────────────────────
ALTER TABLE public.compra_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compra_items_select" ON public.compra_items;
DROP POLICY IF EXISTS "compra_items_insert" ON public.compra_items;
DROP POLICY IF EXISTS "compra_items_update" ON public.compra_items;
DROP POLICY IF EXISTS "compra_items_delete" ON public.compra_items;

CREATE POLICY "compra_items_select" ON public.compra_items
  FOR SELECT USING (
    compra_id IN (SELECT id FROM public.compras WHERE bar_id = ANY(public.my_bar_ids()))
  );

CREATE POLICY "compra_items_insert" ON public.compra_items
  FOR INSERT WITH CHECK (
    compra_id IN (SELECT id FROM public.compras WHERE bar_id = ANY(public.my_bar_ids()))
  );

CREATE POLICY "compra_items_update" ON public.compra_items
  FOR UPDATE USING (
    compra_id IN (SELECT id FROM public.compras WHERE bar_id = ANY(public.my_bar_ids()))
  );

CREATE POLICY "compra_items_delete" ON public.compra_items
  FOR DELETE USING (
    compra_id IN (SELECT id FROM public.compras WHERE bar_id = ANY(public.my_bar_ids()))
  );


-- ── planos (tabela global — qualquer usuário autenticado lê) ──
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planos_select" ON public.planos;
CREATE POLICY "planos_select" ON public.planos
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);


-- ============================================================
-- REALTIME: garante que subscriptions respeitam RLS
-- ============================================================

-- O Supabase Realtime usa as políticas de SELECT do RLS automaticamente.
-- Não é necessário configuração adicional além do ENABLE ROW LEVEL SECURITY
-- já aplicado acima. A filtragem de eventos acontece no DB.

-- Garantir que as tabelas de operação em tempo real estão no publication (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comandas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comanda_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos_cliente') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_cliente;
  END IF;
END $$;
