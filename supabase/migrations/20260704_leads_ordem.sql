-- Ordem manual dos leads dentro de cada coluna do kanban.
-- Maior "ordem" = mais em cima. Backfill pela data de criação (mais novo no topo).

alter table leads add column if not exists ordem double precision;

update leads
set ordem = extract(epoch from created_at) * 1000
where ordem is null;
