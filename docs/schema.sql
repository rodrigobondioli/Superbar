-- ============================================================
-- SANTÉ — Database Schema
-- Supabase / PostgreSQL
-- ============================================================
-- Ordem de execução: rode este arquivo inteiro no SQL Editor do Supabase
-- Tabelas: 17 | Roles: dono, gerente, bartender, caixa
-- Multi-tenant: cada bar é um tenant isolado via RLS
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- ENUMS
-- ============================================================

create type public.bar_role as enum (
  'dono',
  'gerente',
  'bartender',
  'caixa'
);

create type public.comanda_status as enum (
  'aberta',
  'aguardando_pagamento',
  'paga',
  'cancelada'
);

create type public.comanda_item_status as enum (
  'ativo',
  'cancelado'
);

create type public.pagamento_metodo as enum (
  'pix',
  'credito',
  'debito',
  'dinheiro',
  'cortesia'
);

create type public.pagamento_status as enum (
  'pendente',
  'confirmado',
  'estornado'
);

create type public.turno_status as enum (
  'aberto',
  'fechado'
);

create type public.movimento_tipo as enum (
  'venda',
  'compra',
  'ajuste',
  'perda',
  'devolucao'
);

create type public.compra_status as enum (
  'pendente',
  'recebida',
  'cancelada'
);

create type public.assinatura_status as enum (
  'ativa',
  'cancelada',
  'inadimplente'
);

create type public.estoque_unidade as enum (
  'un',   -- unidade
  'ml',
  'l',
  'g',
  'kg'
);


-- ============================================================
-- TABLE: profiles
-- Estende auth.users do Supabase com dados de perfil
-- ============================================================

create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  nome        text        not null,
  email       text        not null,
  avatar_url  text,
  telefone    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público do usuário. Criado automaticamente via trigger ao registrar.';


-- ============================================================
-- TABLE: planos
-- Planos de assinatura do SaaS
-- ============================================================

create table public.planos (
  id              uuid        primary key default uuid_generate_v4(),
  nome            text        not null,
  slug            text        not null unique,
  preco_mensal    numeric(10,2) not null,
  max_usuarios    int         not null default 5,
  max_mesas       int         not null default 20,
  features        jsonb       not null default '{}',
  ativo           boolean     not null default true,
  created_at      timestamptz not null default now()
);

comment on column public.planos.features is
  'Ex: {"relatorios": true, "ia": true, "estoque_avancado": true}';

-- Plano inicial — UM plano só (estratégia jul/2026, docs/negocio.md).
-- Padrão: R$ 1.297/mês (valor cheio, tudo incluído).
insert into public.planos (nome, slug, preco_mensal, max_usuarios, max_mesas, features) values
  ('Padrão', 'padrao', 1297.00, 999, 999, '{"relatorios": true, "ia": true, "estoque_avancado": true}');


-- ============================================================
-- TABLE: bars
-- Tenant principal. Cada bar é um registro aqui.
-- ============================================================

create table public.bars (
  id              uuid        primary key default uuid_generate_v4(),
  nome            text        not null,
  slug            text        not null unique,
  cnpj            text,
  telefone        text,
  endereco        jsonb,
  logo_url        text,
  configuracoes   jsonb       not null default '{}',
  ativo           boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.bars.endereco is
  'Ex: {"rua": "...", "numero": "...", "bairro": "...", "cidade": "...", "estado": "SP", "cep": "..."}';
comment on column public.bars.configuracoes is
  'Ex: {"fuso_horario": "America/Sao_Paulo", "alerta_turno_horas": 12, "moeda": "BRL"}';


-- ============================================================
-- TABLE: assinaturas
-- Vínculo entre bar e plano. Gerenciado pelo Stripe webhook.
-- ============================================================

create table public.assinaturas (
  id                      uuid        primary key default uuid_generate_v4(),
  bar_id                  uuid        not null references public.bars(id) on delete cascade,
  plano_id                uuid        not null references public.planos(id),
  status                  public.assinatura_status not null default 'ativa',
  stripe_subscription_id  text        unique,
  stripe_customer_id      text,
  periodo_inicio          timestamptz not null default now(),
  periodo_fim             timestamptz,
  trial_fim               timestamptz, -- legado: sem trial no modelo atual
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);


-- ============================================================
-- TABLE: bar_members
-- Vínculo entre usuário e bar com role.
-- Um usuário pode ser membro de múltiplos bares.
-- ============================================================

create table public.bar_members (
  id              uuid        primary key default uuid_generate_v4(),
  bar_id          uuid        not null references public.bars(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  role            public.bar_role not null,
  ativo           boolean     not null default true,
  convidado_por   uuid        references public.profiles(id),
  created_at      timestamptz not null default now(),
  unique (bar_id, user_id)
);

comment on column public.bar_members.role is
  'dono: acesso total | gerente: sem billing | bartender: comanda | caixa: pagamento';


-- ============================================================
-- TABLE: mesas
-- Mesas físicas do bar. Comanda é por pessoa, não por mesa.
-- ============================================================

create table public.mesas (
  id          uuid        primary key default uuid_generate_v4(),
  bar_id      uuid        not null references public.bars(id) on delete cascade,
  numero      int         not null,
  nome        text,
  capacidade  int,
  ativo       boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (bar_id, numero)
);

comment on column public.mesas.nome is
  'Ex: "Mesa 1", "Varanda", "Balcão", "Área VIP"';


-- ============================================================
-- TABLE: categorias
-- Categorias de produtos. Ex: Drinques, Cervejas, Petiscos
-- ============================================================

create table public.categorias (
  id          uuid        primary key default uuid_generate_v4(),
  bar_id      uuid        not null references public.bars(id) on delete cascade,
  nome        text        not null,
  ordem       int         not null default 0,
  ativo       boolean     not null default true,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- TABLE: produtos
-- Cardápio do bar. Cada produto pode controlar estoque.
-- ============================================================

create table public.produtos (
  id                  uuid        primary key default uuid_generate_v4(),
  bar_id              uuid        not null references public.bars(id) on delete cascade,
  categoria_id        uuid        references public.categorias(id) on delete set null,
  nome                text        not null,
  descricao           text,
  preco               numeric(10,2) not null,
  custo               numeric(10,2),
  imagem_url          text,
  ativo               boolean     not null default true,
  controla_estoque    boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ============================================================
-- TABLE: fornecedores
-- Fornecedores de insumos do bar
-- ============================================================

create table public.fornecedores (
  id          uuid        primary key default uuid_generate_v4(),
  bar_id      uuid        not null references public.bars(id) on delete cascade,
  nome        text        not null,
  cnpj        text,
  contato     text,
  email       text,
  telefone    text,
  ativo       boolean     not null default true,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- TABLE: estoque
-- Nível atual de estoque por produto.
-- Um registro por produto por bar.
-- ============================================================

create table public.estoque (
  id                  uuid        primary key default uuid_generate_v4(),
  bar_id              uuid        not null references public.bars(id) on delete cascade,
  produto_id          uuid        not null references public.produtos(id) on delete cascade,
  quantidade_atual    numeric(10,3) not null default 0,
  quantidade_minima   numeric(10,3) not null default 0,
  unidade             public.estoque_unidade not null default 'un',
  updated_at          timestamptz not null default now(),
  unique (bar_id, produto_id)
);

comment on column public.estoque.quantidade_minima is
  'Abaixo desse valor, o sistema gera alerta de reposição.';


-- ============================================================
-- TABLE: compras
-- Pedidos de compra para fornecedores
-- ============================================================

create table public.compras (
  id                  uuid        primary key default uuid_generate_v4(),
  bar_id              uuid        not null references public.bars(id) on delete cascade,
  fornecedor_id       uuid        references public.fornecedores(id) on delete set null,
  status              public.compra_status not null default 'pendente',
  total               numeric(10,2) not null default 0,
  nota_fiscal         text,
  observacoes         text,
  data_pedido         timestamptz not null default now(),
  data_recebimento    timestamptz,
  criado_por          uuid        not null references public.profiles(id),
  created_at          timestamptz not null default now()
);


-- ============================================================
-- TABLE: compra_items
-- Itens de uma ordem de compra
-- ============================================================

create table public.compra_items (
  id              uuid        primary key default uuid_generate_v4(),
  compra_id       uuid        not null references public.compras(id) on delete cascade,
  produto_id      uuid        not null references public.produtos(id) on delete restrict,
  quantidade      numeric(10,3) not null,
  preco_unitario  numeric(10,2) not null,
  preco_total     numeric(10,2) not null,
  created_at      timestamptz not null default now()
);


-- ============================================================
-- TABLE: turnos
-- Turno de trabalho. Fechado manualmente pelo dono/gerente.
-- ============================================================

create table public.turnos (
  id              uuid        primary key default uuid_generate_v4(),
  bar_id          uuid        not null references public.bars(id) on delete cascade,
  status          public.turno_status not null default 'aberto',
  abertura_por    uuid        not null references public.profiles(id),
  fechamento_por  uuid        references public.profiles(id),
  aberto_em       timestamptz not null default now(),
  fechado_em      timestamptz,
  total_vendas    numeric(10,2) not null default 0,
  total_comandas  int         not null default 0,
  observacoes     text,
  created_at      timestamptz not null default now()
);

comment on table public.turnos is
  'Apenas um turno pode estar aberto por bar por vez. Enforce via app logic.';


-- ============================================================
-- TABLE: comandas
-- NÚCLEO do sistema. Uma comanda por pessoa — nunca por mesa.
-- ============================================================

create table public.comandas (
  id              uuid        primary key default uuid_generate_v4(),
  bar_id          uuid        not null references public.bars(id) on delete cascade,
  turno_id        uuid        not null references public.turnos(id) on delete restrict,
  mesa_id         uuid        references public.mesas(id) on delete set null,
  bartender_id    uuid        not null references public.profiles(id),
  identificador   text,
  status          public.comanda_status not null default 'aberta',
  total           numeric(10,2) not null default 0,
  aberta_em       timestamptz not null default now(),
  fechada_em      timestamptz,
  created_at      timestamptz not null default now()
);

comment on column public.comandas.identificador is
  'Nome ou descrição livre: "João Silva", "Mesa 3 - Pessoa 2", "Balcão #1"';
comment on column public.comandas.total is
  'Calculado automaticamente via trigger ao inserir/cancelar comanda_items.';


-- ============================================================
-- TABLE: comanda_items
-- Itens de uma comanda. Tabela mais quente do sistema.
-- bar_id denormalizado para RLS e filtro de Realtime.
-- ============================================================

create table public.comanda_items (
  id              uuid        primary key default uuid_generate_v4(),
  comanda_id      uuid        not null references public.comandas(id) on delete cascade,
  bar_id          uuid        not null references public.bars(id),
  produto_id      uuid        not null references public.produtos(id) on delete restrict,
  quantidade      numeric(10,3) not null default 1,
  preco_unitario  numeric(10,2) not null,
  preco_total     numeric(10,2) not null,
  observacao      text,
  status          public.comanda_item_status not null default 'ativo',
  adicionado_por  uuid        not null references public.profiles(id),
  cancelado_por   uuid        references public.profiles(id),
  adicionado_em   timestamptz not null default now(),
  cancelado_em    timestamptz,
  created_at      timestamptz not null default now()
);

comment on column public.comanda_items.bar_id is
  'Denormalizado intencionalmente: permite filter no canal Realtime (bar_id=eq.X) sem JOIN.';


-- ============================================================
-- TABLE: pagamentos
-- Pagamento de uma comanda. Individual (sem split).
-- ============================================================

create table public.pagamentos (
  id              uuid        primary key default uuid_generate_v4(),
  comanda_id      uuid        not null references public.comandas(id) on delete restrict,
  bar_id          uuid        not null references public.bars(id),
  turno_id        uuid        not null references public.turnos(id),
  valor           numeric(10,2) not null,
  metodo          public.pagamento_metodo not null,
  status          public.pagamento_status not null default 'confirmado',
  referencia      text,
  processado_por  uuid        not null references public.profiles(id),
  processado_em   timestamptz not null default now(),
  estornado_por   uuid        references public.profiles(id),
  estornado_em    timestamptz,
  created_at      timestamptz not null default now()
);

comment on column public.pagamentos.referencia is
  'ID de transação externa: Pix end-to-end ID, TEF etc.';


-- ============================================================
-- TABLE: estoque_movimentos
-- Audit trail de todas as movimentações de estoque.
-- Escrito por triggers — nunca diretamente pelo app.
-- ============================================================

create table public.estoque_movimentos (
  id                    uuid        primary key default uuid_generate_v4(),
  bar_id                uuid        not null references public.bars(id) on delete cascade,
  produto_id            uuid        not null references public.produtos(id) on delete restrict,
  tipo                  public.movimento_tipo not null,
  quantidade            numeric(10,3) not null,
  quantidade_anterior   numeric(10,3) not null,
  quantidade_posterior  numeric(10,3) not null,
  referencia_tipo       text,
  referencia_id         uuid,
  motivo                text,
  criado_por            uuid        references public.profiles(id),
  criado_em             timestamptz not null default now()
);

comment on column public.estoque_movimentos.quantidade is
  'Positivo = entrada. Negativo = saída.';
comment on column public.estoque_movimentos.referencia_tipo is
  'comanda_item | compra | ajuste_manual';


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Helper: verifica se o usuário atual é membro do bar com role opcional
create or replace function public.is_bar_member(
  p_bar_id  uuid,
  p_roles   public.bar_role[] default null
)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.bar_members
    where bar_id  = p_bar_id
      and user_id = auth.uid()
      and ativo   = true
      and (p_roles is null or role = any(p_roles))
  );
$$;

-- Trigger function: atualiza updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger function: cria profile ao registrar novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

-- Trigger function: decrementa estoque ao inserir comanda_item ativo
create or replace function public.handle_comanda_item_estoque()
returns trigger
language plpgsql
security definer
as $$
declare
  v_produto  record;
  v_estoque  record;
  v_nova_qtd numeric;
begin
  if new.status != 'ativo' then return new; end if;

  select * into v_produto
  from public.produtos where id = new.produto_id;

  if not v_produto.controla_estoque then return new; end if;

  select * into v_estoque
  from public.estoque
  where bar_id = new.bar_id and produto_id = new.produto_id;

  if not found then return new; end if;

  v_nova_qtd := v_estoque.quantidade_atual - new.quantidade;

  update public.estoque
  set quantidade_atual = v_nova_qtd, updated_at = now()
  where id = v_estoque.id;

  insert into public.estoque_movimentos (
    bar_id, produto_id, tipo, quantidade,
    quantidade_anterior, quantidade_posterior,
    referencia_tipo, referencia_id
  ) values (
    new.bar_id, new.produto_id, 'venda', -new.quantidade,
    v_estoque.quantidade_atual, v_nova_qtd,
    'comanda_item', new.id
  );

  return new;
end;
$$;

-- Trigger function: restaura estoque ao cancelar comanda_item
create or replace function public.handle_comanda_item_cancel()
returns trigger
language plpgsql
security definer
as $$
declare
  v_produto  record;
  v_estoque  record;
  v_nova_qtd numeric;
begin
  if old.status = 'ativo' and new.status = 'cancelado' then
    select * into v_produto from public.produtos where id = new.produto_id;
    if not v_produto.controla_estoque then return new; end if;

    select * into v_estoque from public.estoque
    where bar_id = new.bar_id and produto_id = new.produto_id;
    if not found then return new; end if;

    v_nova_qtd := v_estoque.quantidade_atual + new.quantidade;

    update public.estoque
    set quantidade_atual = v_nova_qtd, updated_at = now()
    where id = v_estoque.id;

    insert into public.estoque_movimentos (
      bar_id, produto_id, tipo, quantidade,
      quantidade_anterior, quantidade_posterior,
      referencia_tipo, referencia_id
    ) values (
      new.bar_id, new.produto_id, 'devolucao', new.quantidade,
      v_estoque.quantidade_atual, v_nova_qtd,
      'comanda_item', new.id
    );
  end if;
  return new;
end;
$$;

-- Trigger function: recalcula total da comanda ao mudar itens
create or replace function public.handle_comanda_total()
returns trigger
language plpgsql
security definer
as $$
declare
  v_comanda_id uuid;
begin
  v_comanda_id := coalesce(new.comanda_id, old.comanda_id);

  update public.comandas
  set total = (
    select coalesce(sum(preco_total), 0)
    from public.comanda_items
    where comanda_id = v_comanda_id
      and status = 'ativo'
  )
  where id = v_comanda_id;

  return coalesce(new, old);
end;
$$;

-- Trigger function: atualiza totais do turno ao pagar comanda
create or replace function public.handle_turno_on_comanda_paid()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'paga' and old.status != 'paga' then
    update public.turnos
    set
      total_vendas   = total_vendas + new.total,
      total_comandas = total_comandas + 1
    where id = new.turno_id;
  end if;
  return new;
end;
$$;

-- Trigger function: incrementa estoque ao receber compra
create or replace function public.handle_compra_recebida()
returns trigger
language plpgsql
security definer
as $$
declare
  v_item     record;
  v_estoque  record;
  v_nova_qtd numeric;
begin
  if new.status = 'recebida' and old.status != 'recebida' then
    for v_item in
      select * from public.compra_items where compra_id = new.id
    loop
      select * into v_estoque from public.estoque
      where bar_id = new.bar_id and produto_id = v_item.produto_id;

      if found then
        v_nova_qtd := v_estoque.quantidade_atual + v_item.quantidade;

        update public.estoque
        set quantidade_atual = v_nova_qtd, updated_at = now()
        where id = v_estoque.id;

        insert into public.estoque_movimentos (
          bar_id, produto_id, tipo, quantidade,
          quantidade_anterior, quantidade_posterior,
          referencia_tipo, referencia_id, criado_por
        ) values (
          new.bar_id, v_item.produto_id, 'compra', v_item.quantidade,
          v_estoque.quantidade_atual, v_nova_qtd,
          'compra', new.id, new.criado_por
        );
      end if;
    end loop;
  end if;
  return new;
end;
$$;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-criar profile ao registrar usuário
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_bars
  before update on public.bars
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_produtos
  before update on public.produtos
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_assinaturas
  before update on public.assinaturas
  for each row execute function public.handle_updated_at();

-- Estoque: venda
create trigger on_comanda_item_insert
  after insert on public.comanda_items
  for each row execute function public.handle_comanda_item_estoque();

-- Estoque: devolução por cancelamento
create trigger on_comanda_item_cancel
  after update on public.comanda_items
  for each row execute function public.handle_comanda_item_cancel();

-- Total da comanda
create trigger on_comanda_item_change
  after insert or update or delete on public.comanda_items
  for each row execute function public.handle_comanda_total();

-- Totais do turno
create trigger on_comanda_paid
  after update on public.comandas
  for each row execute function public.handle_turno_on_comanda_paid();

-- Estoque: entrada de compra
create trigger on_compra_recebida
  after update on public.compras
  for each row execute function public.handle_compra_recebida();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.planos             enable row level security;
alter table public.bars               enable row level security;
alter table public.assinaturas        enable row level security;
alter table public.bar_members        enable row level security;
alter table public.mesas              enable row level security;
alter table public.categorias         enable row level security;
alter table public.produtos           enable row level security;
alter table public.fornecedores       enable row level security;
alter table public.estoque            enable row level security;
alter table public.compras            enable row level security;
alter table public.compra_items       enable row level security;
alter table public.turnos             enable row level security;
alter table public.comandas           enable row level security;
alter table public.comanda_items      enable row level security;
alter table public.pagamentos         enable row level security;
alter table public.estoque_movimentos enable row level security;

-- profiles: usuário vê o próprio perfil + colegas do mesmo bar
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid() or
    exists (
      select 1 from public.bar_members bm1
      join public.bar_members bm2 on bm1.bar_id = bm2.bar_id
      where bm1.user_id = auth.uid()
        and bm2.user_id = profiles.id
        and bm1.ativo = true
    )
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- planos: leitura pública (usado na landing page)
create policy "planos_select" on public.planos
  for select using (true);

-- bars
create policy "bars_select" on public.bars
  for select using (public.is_bar_member(id));

create policy "bars_update" on public.bars
  for update using (public.is_bar_member(id, array['dono']::public.bar_role[]));

-- assinaturas: apenas dono
create policy "assinaturas_select" on public.assinaturas
  for select using (
    public.is_bar_member(bar_id, array['dono']::public.bar_role[])
  );

-- bar_members: membros veem; dono/gerente gerenciam
create policy "bar_members_select" on public.bar_members
  for select using (public.is_bar_member(bar_id));

create policy "bar_members_insert" on public.bar_members
  for insert with check (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

create policy "bar_members_update" on public.bar_members
  for update using (
    public.is_bar_member(bar_id, array['dono']::public.bar_role[])
  );

-- mesas
create policy "mesas_select" on public.mesas
  for select using (public.is_bar_member(bar_id));

create policy "mesas_manage" on public.mesas
  for all using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

-- categorias
create policy "categorias_select" on public.categorias
  for select using (public.is_bar_member(bar_id));

create policy "categorias_manage" on public.categorias
  for all using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

-- produtos
create policy "produtos_select" on public.produtos
  for select using (public.is_bar_member(bar_id));

create policy "produtos_manage" on public.produtos
  for all using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

-- fornecedores: apenas gerência
create policy "fornecedores_select" on public.fornecedores
  for select using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

create policy "fornecedores_manage" on public.fornecedores
  for all using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

-- estoque
create policy "estoque_select" on public.estoque
  for select using (public.is_bar_member(bar_id));

create policy "estoque_manage" on public.estoque
  for all using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

-- compras
create policy "compras_select" on public.compras
  for select using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

create policy "compras_manage" on public.compras
  for all using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

create policy "compra_items_select" on public.compra_items
  for select using (
    exists (
      select 1 from public.compras c
      where c.id = compra_id
        and public.is_bar_member(c.bar_id, array['dono', 'gerente']::public.bar_role[])
    )
  );

create policy "compra_items_manage" on public.compra_items
  for all using (
    exists (
      select 1 from public.compras c
      where c.id = compra_id
        and public.is_bar_member(c.bar_id, array['dono', 'gerente']::public.bar_role[])
    )
  );

-- turnos
create policy "turnos_select" on public.turnos
  for select using (public.is_bar_member(bar_id));

create policy "turnos_insert" on public.turnos
  for insert with check (
    public.is_bar_member(bar_id, array['dono', 'gerente', 'caixa']::public.bar_role[])
  );

create policy "turnos_update" on public.turnos
  for update using (
    public.is_bar_member(bar_id, array['dono', 'gerente', 'caixa']::public.bar_role[])
  );

-- comandas: todos os membros criam e leem; caixa/gerente/dono fecham
create policy "comandas_select" on public.comandas
  for select using (public.is_bar_member(bar_id));

create policy "comandas_insert" on public.comandas
  for insert with check (public.is_bar_member(bar_id));

create policy "comandas_update" on public.comandas
  for update using (public.is_bar_member(bar_id));

-- comanda_items: todos inserem; gerência cancela
create policy "comanda_items_select" on public.comanda_items
  for select using (public.is_bar_member(bar_id));

create policy "comanda_items_insert" on public.comanda_items
  for insert with check (public.is_bar_member(bar_id));

create policy "comanda_items_update" on public.comanda_items
  for update using (public.is_bar_member(bar_id));

-- pagamentos: caixa/gerente/dono inserem
create policy "pagamentos_select" on public.pagamentos
  for select using (public.is_bar_member(bar_id));

create policy "pagamentos_insert" on public.pagamentos
  for insert with check (
    public.is_bar_member(bar_id, array['dono', 'gerente', 'caixa']::public.bar_role[])
  );

create policy "pagamentos_update" on public.pagamentos
  for update using (
    public.is_bar_member(bar_id, array['dono', 'gerente']::public.bar_role[])
  );

-- estoque_movimentos: todos leem, só triggers escrevem (security definer)
create policy "estoque_movimentos_select" on public.estoque_movimentos
  for select using (public.is_bar_member(bar_id));


-- ============================================================
-- INDEXES
-- ============================================================

-- bar_members
create index idx_bar_members_bar_id   on public.bar_members(bar_id);
create index idx_bar_members_user_id  on public.bar_members(user_id);

-- mesas
create index idx_mesas_bar_id         on public.mesas(bar_id);

-- produtos
create index idx_produtos_bar_id      on public.produtos(bar_id);
create index idx_produtos_categoria   on public.produtos(categoria_id);

-- estoque
create index idx_estoque_bar_produto  on public.estoque(bar_id, produto_id);

-- turnos
create index idx_turnos_bar_status    on public.turnos(bar_id, status);

-- comandas — tabela quente
create index idx_comandas_bar_status  on public.comandas(bar_id, status);
create index idx_comandas_turno       on public.comandas(turno_id);
create index idx_comandas_mesa        on public.comandas(mesa_id);
create index idx_comandas_bartender   on public.comandas(bartender_id);

-- comanda_items — tabela mais quente (Realtime)
create index idx_comanda_items_comanda on public.comanda_items(comanda_id);
create index idx_comanda_items_bar    on public.comanda_items(bar_id);
create index idx_comanda_items_produto on public.comanda_items(produto_id);

-- pagamentos
create index idx_pagamentos_comanda   on public.pagamentos(comanda_id);
create index idx_pagamentos_bar_turno on public.pagamentos(bar_id, turno_id);

-- estoque_movimentos
create index idx_mov_bar_produto      on public.estoque_movimentos(bar_id, produto_id);
create index idx_mov_referencia       on public.estoque_movimentos(referencia_id);

-- assinaturas
create index idx_assinaturas_bar_id   on public.assinaturas(bar_id);


-- ============================================================
-- REALTIME
-- Habilitar no Supabase Dashboard → Database → Replication
-- Ou via SQL (requer superuser / service_role):
-- ============================================================

-- alter publication supabase_realtime add table public.comanda_items;
-- alter publication supabase_realtime add table public.comandas;
-- alter publication supabase_realtime add table public.pagamentos;
-- alter publication supabase_realtime add table public.turnos;

-- NOTA: habilite as tabelas acima no Dashboard em:
-- Database → Replication → supabase_realtime → Tables
-- Filtro recomendado no cliente: bar_id=eq.<bar_id>


-- ============================================================
-- FIM DO SCHEMA
-- Próximos passos:
-- 1. Rodar este arquivo no SQL Editor do Supabase
-- 2. Habilitar Realtime nas 4 tabelas acima
-- 3. Configurar variáveis de ambiente no Next.js:
--    NEXT_PUBLIC_SUPABASE_URL
--    NEXT_PUBLIC_SUPABASE_ANON_KEY
--    SUPABASE_SERVICE_ROLE_KEY (apenas server-side)
-- 4. Criar primeiro bar + usuário dono via seed script
-- ============================================================
