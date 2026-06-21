-- ============================================================
-- Tabela: chamadas
-- Registra quando o cliente aperta "Chamar atendimento".
-- O bartender vê em tempo real e pode marcar como atendida.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chamadas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id      UUID        NOT NULL REFERENCES public.bars(id)   ON DELETE CASCADE,
  mesa_id     UUID        NOT NULL REFERENCES public.mesas(id)  ON DELETE CASCADE,
  turno_id    UUID        NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pendente'
                          CHECK (status IN ('pendente', 'atendida')),
  criada_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  atendida_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS chamadas_bar_turno_idx
  ON public.chamadas (bar_id, turno_id, status);

ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;

-- Clientes anônimos podem criar chamadas (via server action com admin client)
-- Não precisamos de policy de INSERT para anon pois usamos admin client no server action.

-- Equipe autenticada do bar pode ver e atualizar chamadas
DROP POLICY IF EXISTS "chamadas_select" ON public.chamadas;
CREATE POLICY "chamadas_select" ON public.chamadas
  FOR SELECT
  TO authenticated
  USING (bar_id = ANY(public.my_bar_ids()));

DROP POLICY IF EXISTS "chamadas_update" ON public.chamadas;
CREATE POLICY "chamadas_update" ON public.chamadas
  FOR UPDATE
  TO authenticated
  USING (bar_id = ANY(public.my_bar_ids()));
