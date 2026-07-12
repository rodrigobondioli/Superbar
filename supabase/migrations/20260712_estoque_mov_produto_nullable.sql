-- estoque_movimentos.produto_id: tornar nullable.
-- O estoque do SUPERBAR é rastreado por INSUMO (ingrediente), não por produto.
-- Movimentos manuais (ajuste/perda/compra via tela de estoque) referenciam a
-- linha de `estoque` (referencia_tipo='estoque', referencia_id), não um produto.
-- A coluna era NOT NULL, então o insert do movimento falhava calado e o log
-- era perdido (Princípio 12). Aqui liberamos o null pra esses casos.
alter table public.estoque_movimentos
  alter column produto_id drop not null;
