-- ============================================================
-- Ficha por categoria: SÓ drink usa ficha; o resto é custo direto
--
-- Ficha (receita) só faz sentido pra DRINK MONTADO. Água, suco, cerveja, chopp,
-- comida — tudo entra com custo DIRETO, sem ficha. Foi uma ficha numa água
-- (custo do insumo em unidade errada) que estourou o CMV.
--
-- Default = false (sem ficha). As categorias de DRINK já existentes são marcadas
-- pelo nome. Categoria nova adivinha pelo nome no cadastro. O toggle na tela
-- corrige qualquer exceção.
-- ============================================================

alter table public.categorias
  add column if not exists usa_ficha boolean not null default false;

-- Marca as categorias de drink já existentes (o resto fica custo direto).
update public.categorias
   set usa_ficha = true
 where nome ~* '(drink|coquet|cocktail|mocktail|autora|caipir|aperitiv|cl[aá]ssic)';

comment on column public.categorias.usa_ficha is
  'true = drink montado (usa ficha/receita). false = revenda/comida (custo direto).
   Default false — só drink usa ficha.';
