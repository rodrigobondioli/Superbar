-- Campos opcionais exibidos na "ficha do drink" (tela de detalhe do cliente).
-- Preenchidos pelo dono no admin; só aparecem no app quando têm valor.
-- Nada de dado inventado: vazio = não mostra.

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS tempo_preparo INTEGER,   -- minutos
  ADD COLUMN IF NOT EXISTS calorias      INTEGER;   -- kcal
