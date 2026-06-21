-- Merge atômico de campos JSONB em bars.configuracoes.
-- Substitui o padrão read-then-write das actions de settings,
-- eliminando perda de dados quando dois campos são salvos simultaneamente.
--
-- O operador || no Postgres é atômico dentro de um UPDATE —
-- lê e escreve em uma única operação, sem janela para race condition.

CREATE OR REPLACE FUNCTION public.merge_bar_config(
  p_bar_id UUID,
  p_patch  JSONB
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.bars
  SET configuracoes = COALESCE(configuracoes, '{}'::jsonb) || p_patch
  WHERE id = p_bar_id;
$$;
