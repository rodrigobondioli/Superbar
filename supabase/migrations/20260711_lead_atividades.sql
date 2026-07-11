-- ============================================================
-- Timeline de atividades por lead (CRM).
-- Log datado de cada toque comercial: nota, call, whatsapp, reunião e
-- mudanças de estágio (registradas automaticamente pelo app). Transforma o
-- kanban num CRM de verdade — dá pra ver o histórico de cada bar.
-- Acesso pelo app via service role (bypassa RLS), como leads/crm_stages.
-- ============================================================

create table if not exists public.lead_atividades (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  tipo       text not null default 'nota',      -- nota | call | whatsapp | reuniao | estagio
  descricao  text not null,
  criado_em  timestamptz not null default now(),
  criado_por uuid                               -- profiles.id (quem registrou), opcional
);

create index if not exists idx_lead_atividades_lead
  on public.lead_atividades(lead_id, criado_em desc);

alter table public.lead_atividades enable row level security;
