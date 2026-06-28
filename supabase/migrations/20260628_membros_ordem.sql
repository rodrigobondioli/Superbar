-- Ordem de exibição dos membros (drag-and-drop na tela de equipe)
ALTER TABLE public.bar_members
  ADD COLUMN IF NOT EXISTS ordem INT NOT NULL DEFAULT 0;

-- Inicializa a ordem pela data de criação
UPDATE public.bar_members bm
SET ordem = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY bar_id ORDER BY created_at) AS rn
  FROM public.bar_members
) sub
WHERE bm.id = sub.id;
