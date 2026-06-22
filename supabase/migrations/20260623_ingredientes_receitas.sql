-- ============================================================
-- Camada 2: Ingredientes, Receitas e Movimentos
-- Fundação da inteligência: CMV real + margem real
--
-- Decisões de arquitetura:
--   • bar_id em todas as tabelas (multi-tenant sem joins indiretos)
--   • tipo como TEXT + CHECK (nunca enum — adicionar waste/loss/return sem migration)
--   • Sem trigger automático — baixa via fn_entregar_pedido() chamado explicitamente
-- ============================================================


-- ── ingredientes ──────────────────────────────────────────────────────────────

CREATE TABLE public.ingredientes (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id         UUID           NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  nome           TEXT           NOT NULL,
  unidade        TEXT           NOT NULL
    CHECK (unidade IN ('un', 'ml', 'l', 'g', 'kg')),
  estoque_atual  NUMERIC(12,3)  NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,3)  NOT NULL DEFAULT 0,
  custo_atual    NUMERIC(12,4)  NOT NULL DEFAULT 0,
  ativo          BOOLEAN        NOT NULL DEFAULT true,
  criado_em      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  atualizado_em  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ingredientes IS
  'Insumos do bar. Ex: Tanqueray 750ml, Tônica Schweppes, Limão.
   custo_atual = último preço de compra (desnormalizado para performance no dashboard).
   Histórico completo de custo vive em ingrediente_movimentos.unit_cost.';

COMMENT ON COLUMN public.ingredientes.unidade IS
  'Unidade de medida base do ingrediente. Receitas usam a mesma unidade.
   Ex: gin em ml, limão em un, açúcar em g.';


-- ── receitas ──────────────────────────────────────────────────────────────────

CREATE TABLE public.receitas (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id         UUID           NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  produto_id     UUID           NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  ingrediente_id UUID           NOT NULL REFERENCES public.ingredientes(id) ON DELETE RESTRICT,
  quantidade     NUMERIC(12,3)  NOT NULL,
  criado_em      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (produto_id, ingrediente_id)
);

COMMENT ON TABLE public.receitas IS
  'Composição de ingredientes por produto vendido.
   Ex: Gin Tônica → 50ml Gin + 1un Tônica + 1un Limão.
   UNIQUE(produto_id, ingrediente_id): produto usa cada ingrediente uma vez por receita.
   quantidade está na unidade do ingrediente (ml, g, un etc.).';


-- ── ingrediente_movimentos ────────────────────────────────────────────────────

CREATE TABLE public.ingrediente_movimentos (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id          UUID           NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  ingrediente_id  UUID           NOT NULL REFERENCES public.ingredientes(id) ON DELETE RESTRICT,
  pedido_id       UUID           REFERENCES public.pedidos(id),
  comanda_item_id UUID           REFERENCES public.comanda_items(id),
  tipo            TEXT           NOT NULL
    CHECK (tipo IN ('entrada', 'venda', 'ajuste')),
  quantidade      NUMERIC(12,3)  NOT NULL,
  custo_unitario  NUMERIC(12,4),
  criado_por      UUID           REFERENCES public.profiles(id),
  motivo          TEXT,
  criado_em       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ingrediente_movimentos IS
  'Audit trail de movimentações de ingredientes.
   tipo: TEXT + CHECK para ser extensível sem migration (waste, loss, transfer, inventory_count).
   Venda: quantidade negativa; entrada: positiva; ajuste: ambos.
   pedido_id + comanda_item_id: rastreabilidade completa por venda.
   custo_unitario: snapshot do custo no momento do movimento (imutável).';


-- ── índices ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_ingredientes_bar
  ON public.ingredientes(bar_id);

CREATE INDEX idx_receitas_bar_produto
  ON public.receitas(bar_id, produto_id);

CREATE INDEX idx_receitas_ingrediente
  ON public.receitas(ingrediente_id);

CREATE INDEX idx_ing_mov_bar_ing
  ON public.ingrediente_movimentos(bar_id, ingrediente_id);

CREATE INDEX idx_ing_mov_bar_data
  ON public.ingrediente_movimentos(bar_id, criado_em DESC);

CREATE INDEX idx_ing_mov_pedido
  ON public.ingrediente_movimentos(pedido_id);

CREATE INDEX idx_ing_mov_tipo
  ON public.ingrediente_movimentos(tipo);


-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.ingredientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingrediente_movimentos ENABLE ROW LEVEL SECURITY;

-- ingredientes: todos os membros leem; dono/gerente gerenciam
CREATE POLICY "ingredientes_select" ON public.ingredientes
  FOR SELECT USING (public.is_bar_member(bar_id));

CREATE POLICY "ingredientes_manage" ON public.ingredientes
  FOR ALL USING (
    public.is_bar_member(bar_id, ARRAY['dono', 'gerente']::public.bar_role[])
  );

-- receitas: todos os membros leem; dono/gerente gerenciam
CREATE POLICY "receitas_select" ON public.receitas
  FOR SELECT USING (public.is_bar_member(bar_id));

CREATE POLICY "receitas_manage" ON public.receitas
  FOR ALL USING (
    public.is_bar_member(bar_id, ARRAY['dono', 'gerente']::public.bar_role[])
  );

-- ingrediente_movimentos: todos leem; inserções via fn_entregar_pedido (security definer)
-- + inserções manuais por dono/gerente (entradas de estoque)
CREATE POLICY "ingrediente_movimentos_select" ON public.ingrediente_movimentos
  FOR SELECT USING (public.is_bar_member(bar_id));

CREATE POLICY "ingrediente_movimentos_insert" ON public.ingrediente_movimentos
  FOR INSERT WITH CHECK (public.is_bar_member(bar_id));


-- ── Motor de entrega ──────────────────────────────────────────────────────────
--
-- Chamado EXPLICITAMENTE pela server action entregarPedido().
-- NÃO é trigger — nada dispara isso automaticamente.
--
-- Fluxo:
--   1. Valida pedido (status = preparando, usuário é membro do bar)
--   2. Marca pedido como entregue
--   3. Para cada comanda_item ativo do pedido:
--      a. Busca a receita do produto
--      b. Para cada ingrediente da receita:
--         - Cria ingrediente_movimentos (tipo = venda, quantidade negativa)
--         - Decrementa ingredientes.estoque_atual
--         - Coleta alerta se estoque_atual < estoque_minimo
--   4. Retorna { ok, alertas } para o app processar
--
-- Produtos sem receita cadastrada: sem baixa, sem erro (bar ainda não configurou).

CREATE OR REPLACE FUNCTION public.fn_entregar_pedido(
  p_pedido_id UUID,
  p_user_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido  RECORD;
  v_item    RECORD;
  v_receita RECORD;
  v_ing     RECORD;
  v_deducao NUMERIC(12,3);
  v_alertas JSONB := '[]'::JSONB;
BEGIN
  -- 1. Valida pedido: deve estar em 'preparando' e pertencer ao bar do usuário
  SELECT p.*
  INTO   v_pedido
  FROM   public.pedidos p
  WHERE  p.id     = p_pedido_id
    AND  p.status = 'preparando'
    AND  public.is_bar_member(p.bar_id);   -- auth.uid() via JWT mesmo em security definer

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok',    false,
      'error', 'Pedido não encontrado, status inválido ou acesso negado.'
    );
  END IF;

  -- 2. Marca como entregue
  UPDATE public.pedidos
  SET    status      = 'entregue',
         entregue_em = now()
  WHERE  id = p_pedido_id;

  -- 3. Percorre itens ativos do pedido
  FOR v_item IN
    SELECT id, produto_id, quantidade, bar_id
    FROM   public.comanda_items
    WHERE  pedido_id = p_pedido_id
      AND  status    = 'ativo'
  LOOP

    -- 3a. Percorre receita do produto (sem receita = sem baixa, sem erro)
    FOR v_receita IN
      SELECT ingrediente_id,
             quantidade AS qtd_por_unidade
      FROM   public.receitas
      WHERE  produto_id = v_item.produto_id
        AND  bar_id     = v_item.bar_id
    LOOP
      v_deducao := v_receita.qtd_por_unidade * v_item.quantidade;

      -- 3b. Snapshot do custo atual antes de decrementar
      SELECT custo_atual
      INTO   v_ing
      FROM   public.ingredientes
      WHERE  id = v_receita.ingrediente_id;

      -- 3c. Cria movimento de saída (quantidade negativa = consumo)
      INSERT INTO public.ingrediente_movimentos (
        bar_id, ingrediente_id,
        pedido_id, comanda_item_id,
        tipo, quantidade, custo_unitario, criado_por
      ) VALUES (
        v_item.bar_id,
        v_receita.ingrediente_id,
        p_pedido_id,
        v_item.id,
        'venda',
        -v_deducao,          -- negativo: saída de estoque
        v_ing.custo_atual,   -- snapshot imutável do custo no momento da venda
        p_user_id
      );

      -- 3d. Decrementa estoque_atual
      UPDATE public.ingredientes
      SET    estoque_atual = estoque_atual - v_deducao,
             atualizado_em = now()
      WHERE  id = v_receita.ingrediente_id;

      -- 3e. Verifica alerta de estoque baixo (lê após update)
      SELECT id, nome, estoque_atual, estoque_minimo
      INTO   v_ing
      FROM   public.ingredientes
      WHERE  id = v_receita.ingrediente_id;

      IF v_ing.estoque_minimo > 0
        AND v_ing.estoque_atual < v_ing.estoque_minimo
      THEN
        v_alertas := v_alertas || jsonb_build_array(
          jsonb_build_object(
            'ingrediente_id', v_ing.id,
            'nome',           v_ing.nome,
            'estoque_atual',  v_ing.estoque_atual,
            'estoque_minimo', v_ing.estoque_minimo
          )
        );
      END IF;

    END LOOP; -- receita
  END LOOP;   -- item

  RETURN jsonb_build_object('ok', true, 'alertas', v_alertas);
END;
$$;

COMMENT ON FUNCTION public.fn_entregar_pedido IS
  'Motor de entrega transacional: atualiza pedido + baixa ingredientes + coleta alertas.
   Chamado explicitamente pelo app — NUNCA dispara automaticamente.
   Retorna: { ok: true, alertas: [{ingrediente_id, nome, estoque_atual, estoque_minimo}] }
         ou { ok: false, error: "..." }';
