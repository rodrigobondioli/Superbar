-- Destaques = banners da vitrine do cliente (noite de jazz, jogo, drink novo…).
-- Separado de produto: é uma imagem + título, com link opcional pra um drink.

create table if not exists public.destaques (
  id         uuid        primary key default gen_random_uuid(),
  bar_id     uuid        not null references public.bars(id) on delete cascade,
  titulo     text        not null,
  subtitulo  text,
  imagem_url text,
  produto_id uuid        references public.produtos(id) on delete set null,
  ordem      int         not null default 0,
  ativo      boolean     not null default true,
  criado_em  timestamptz not null default now()
);

create index if not exists idx_destaques_bar on public.destaques (bar_id, ordem) where ativo;

alter table public.destaques enable row level security;

-- Cliente (anônimo) lê os banners; equipe dona/gerente gerencia.
drop policy if exists "destaques_select_public" on public.destaques;
create policy "destaques_select_public" on public.destaques
  for select using (true);

drop policy if exists "destaques_manage" on public.destaques;
create policy "destaques_manage" on public.destaques
  for all using (public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[]));
