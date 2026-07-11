-- ============================================================
-- Contagem em unidade natural (garrafa/lata), não em ml
--
-- O insumo é modelado na unidade-base (ml/g) porque a FICHA precisa disso
-- (um drink usa 30ml). Mas ninguém conta a prateleira em ml — conta em
-- GARRAFA. Este campo guarda o tamanho da embalagem na unidade-base, pra
-- contar em garrafa (com fração pra aberta) e o sistema converter.
--
-- tamanho_embalagem NULL = conta direto na unidade-base (ex: limão em 'un').
-- ============================================================

alter table public.ingredientes
  add column if not exists tamanho_embalagem numeric(12,3),
  add column if not exists unidade_compra    text;

comment on column public.ingredientes.tamanho_embalagem is
  'Tamanho da embalagem na unidade-base (ex: 750 = garrafa de 750ml).
   NULL = sem embalagem, conta direto na unidade-base.';
comment on column public.ingredientes.unidade_compra is
  'Rótulo da unidade de contagem/compra (garrafa, lata, pacote). Cosmético.';
