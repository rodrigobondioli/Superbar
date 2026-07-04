-- Estágios do pipeline de leads, com rótulo editável.
-- O id é fixo (o lead.status referencia ele); só o label muda.

create table if not exists crm_stages (
  id    text primary key,
  label text not null,
  ordem int  not null
);

insert into crm_stages (id, label, ordem) values
  ('novo',       'Novo',       1),
  ('contatado',  'Contatado',  2),
  ('demo',       'Demo',       3),
  ('convertido', 'Convertido', 4),
  ('perdido',    'Perdido',    5)
on conflict (id) do nothing;

-- App lê/escreve via service role (bypassa RLS). RLS ligada por segurança.
alter table crm_stages enable row level security;
