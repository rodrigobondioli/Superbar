-- Leads: realtime (aparecer sem refresh) + policy de SELECT pro admin.

-- 1) Coloca a tabela leads no publication de realtime (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;

-- 2) Realtime respeita RLS: o app lê via service role, mas o canal realtime
--    usa a sessão do usuário no navegador. Sem policy de SELECT, o admin não
--    recebe os eventos. Liberamos SELECT só pro email do admin da plataforma.
drop policy if exists "admin select leads" on leads;
create policy "admin select leads" on leads
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'rodrigobondioli@gmail.com');
