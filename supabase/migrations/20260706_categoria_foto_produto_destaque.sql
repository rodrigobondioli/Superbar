-- Foto própria por categoria (o dono escolhe a capa no admin) +
-- destaque por produto (o que vira "Assinatura da casa" / hero no app do cliente).

alter table public.categorias add column if not exists imagem_url text;

alter table public.produtos add column if not exists destaque boolean not null default false;

create index if not exists idx_produtos_destaque
  on public.produtos (bar_id) where destaque;
