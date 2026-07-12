-- ============================================================
-- Centro de anotações do admin: notas do fundador + tickets e
-- sugestões que chegam dos clientes. Tabela única, filtrada por `tipo`.
-- ============================================================

create type public.anotacao_tipo   as enum ('nota', 'ticket', 'sugestao');
create type public.anotacao_status as enum ('aberto', 'resolvido', 'arquivado');

create table public.anotacoes (
  id          uuid primary key default gen_random_uuid(),
  tipo        public.anotacao_tipo   not null,
  status      public.anotacao_status not null default 'aberto',
  titulo      text,                       -- opcional (nota/ticket têm; sugestão usa categoria)
  corpo       text not null,              -- o conteúdo
  categoria   text,                       -- p/ sugestão: "Nova funcionalidade", etc.
  bar_id      uuid references public.bars(id) on delete set null, -- de qual bar veio (null = nota do fundador)
  autor_nome  text,                       -- quem abriu (cliente)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index anotacoes_tipo_idx on public.anotacoes (tipo, status, created_at desc);

-- Acesso só via Server Actions (service-role). RLS ligada sem policy pública
-- = nega tudo por padrão (nenhum acesso direto do cliente ao dado bruto).
alter table public.anotacoes enable row level security;
