-- Fila de produção do bartender.
-- Cada "pedido" é um grupo de itens confirmados juntos pelo bartender.
-- 3 estados: recebido → preparando → entregue
-- Princípio 11: bartender marca tudo (sem entidade garçom no MVP).

CREATE TABLE IF NOT EXISTS public.pedidos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id      UUID        NOT NULL REFERENCES public.bars(id)     ON DELETE CASCADE,
  turno_id    UUID        NOT NULL REFERENCES public.turnos(id)   ON DELETE CASCADE,
  comanda_id  UUID        NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'preparando', 'entregue')),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  iniciado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pedidos_bar_turno_idx
  ON public.pedidos (bar_id, turno_id);

CREATE INDEX IF NOT EXISTS pedidos_status_idx
  ON public.pedidos (status)
  WHERE status != 'entregue';

-- Vincula cada item de comanda ao pedido que o criou.
ALTER TABLE public.comanda_items
  ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES public.pedidos(id);

-- RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select" ON public.pedidos
  FOR SELECT USING (bar_id = ANY(public.my_bar_ids()));

CREATE POLICY "pedidos_insert" ON public.pedidos
  FOR INSERT WITH CHECK (bar_id = ANY(public.my_bar_ids()));

CREATE POLICY "pedidos_update" ON public.pedidos
  FOR UPDATE USING (bar_id = ANY(public.my_bar_ids()));
