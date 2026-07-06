-- Garante Realtime (replication) nas tabelas operacionais.
-- Sem isso, o caixa/garçom não recebem updates ao vivo (comanda enviada, paga, etc.)
-- e dependem de refresh/polling. Idempotente: só adiciona o que faltar.

do $$
declare t text;
begin
  foreach t in array array['comandas','comanda_items','pedidos','chamadas'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- REPLICA IDENTITY FULL: entrega a linha completa nos UPDATE/DELETE, o que faz
-- os filtros do realtime (e a RLS) funcionarem de forma confiável.
alter table public.comandas      replica identity full;
alter table public.comanda_items replica identity full;
alter table public.pedidos       replica identity full;
alter table public.chamadas      replica identity full;
