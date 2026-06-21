-- Telefone opcional do cliente para recuperação de comanda entre sessões.
-- Permite buscar comanda aberta pelo telefone caso sessionStorage seja perdido.
ALTER TABLE public.comandas
  ADD COLUMN IF NOT EXISTS telefone_cliente TEXT;

CREATE INDEX IF NOT EXISTS comandas_telefone_idx
  ON public.comandas (bar_id, telefone_cliente)
  WHERE telefone_cliente IS NOT NULL;
