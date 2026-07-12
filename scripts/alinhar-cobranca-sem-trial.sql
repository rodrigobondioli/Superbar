-- ============================================================
-- Alinhar a cobrança à estratégia (jul/2026): UM plano, sem trial.
-- Fonte de verdade: docs/negocio.md — sem trial/freemium.
--   Plano único: R$ 1.297/mês (valor cheio, "Padrão").
--   (A faixa Fundador R$ 697 foi descartada nesta decisão.)
--
-- O que faz:
--   1) Colapsa os planos legados num só: Padrão R$ 1.297.
--   2) Torna TODOS os bares pagantes (status 'ativa'), zera trial.
--   3) Cria assinatura pra bar que não tiver.
--   4) Novos registros nascem pagantes, sem trial.
--
-- Como rodar: Supabase → SQL Editor → cole tudo → Run.
-- Seguro reexecutar (idempotente) e transacional (tudo ou nada).
-- ============================================================

begin;

-- 1) Um plano só, no valor cheio. Reaproveita a linha 'premium' existente.
update public.planos
set nome         = 'Padrão',
    slug         = 'padrao',
    preco_mensal = 1297.00,
    max_usuarios = 999,
    max_mesas    = 999,
    features     = '{"relatorios": true, "ia": true, "estoque_avancado": true}',
    ativo        = true
where slug = 'premium';

-- Fallback: se não houver 'premium' nem 'padrao', cria o Padrão do zero.
insert into public.planos (nome, slug, preco_mensal, max_usuarios, max_mesas, features)
select 'Padrão', 'padrao', 1297.00, 999, 999,
       '{"relatorios": true, "ia": true, "estoque_avancado": true}'
where not exists (select 1 from public.planos where slug in ('padrao', 'premium'));

-- 2) Repontar TODAS as assinaturas pro Padrão e torná-las pagantes (sem trial).
update public.assinaturas
set plano_id       = (select id from public.planos where slug = 'padrao'),
    status         = 'ativa',
    trial_fim      = null,
    periodo_inicio = coalesce(periodo_inicio, now()),
    updated_at     = now();

-- 3) Todo bar sem assinatura ganha uma ativa no Padrão.
insert into public.assinaturas (bar_id, plano_id, status, periodo_inicio)
select b.id, (select id from public.planos where slug = 'padrao'), 'ativa', now()
from public.bars b
where not exists (select 1 from public.assinaturas a where a.bar_id = b.id);

-- 4) Aposentar os planos legados (já não referenciados após o passo 2).
delete from public.planos where slug in ('starter', 'pro', 'fundador');

-- 5) Novos registros nascem pagantes, sem data de trial.
alter table public.assinaturas alter column status    set default 'ativa';
alter table public.assinaturas alter column trial_fim drop default;

commit;

-- ── Conferência (rode depois pra ver o resultado) ──
-- select b.nome as bar, p.nome as plano, a.status, p.preco_mensal
-- from public.bars b
-- join public.assinaturas a on a.bar_id = b.id
-- join public.planos p on p.id = a.plano_id
-- order by b.nome;

-- ────────────────────────────────────────────────────────────
-- OPCIONAL (destrutivo) — só se quiser apagar o rastro do trial de vez.
-- O app já não usa nada disso; deixar não causa problema. NÃO rode por reflexo.
--
--   -- Remover a coluna trial_fim:
--   -- alter table public.assinaturas drop column trial_fim;
--
--   -- Remover o valor 'trial' do enum (Postgres não deixa dropar valor de enum
--   -- direto — precisa recriar o tipo). Só faça se realmente quiser:
--   -- alter type public.assinatura_status rename to assinatura_status_old;
--   -- create type public.assinatura_status as enum ('ativa','cancelada','inadimplente');
--   -- alter table public.assinaturas alter column status type public.assinatura_status
--   --   using status::text::public.assinatura_status;
--   -- drop type public.assinatura_status_old;
-- ────────────────────────────────────────────────────────────
