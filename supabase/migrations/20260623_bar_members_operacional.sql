-- ============================================================
-- Staff operacional sem conta Supabase Auth
--
-- Garçom, bartender e caixa são cadastrados diretamente pelo dono.
-- Não precisam de email, senha ou fluxo de convite.
-- A seleção de usuário ("Quem é você?") é estado local no device.
--
-- user_id = NULL  →  membro operacional sem conta de auth
-- user_id = UUID  →  dono/gerente com conta Supabase Auth
-- ============================================================

-- Torna user_id opcional (idempotente: se já for nullable, não faz nada)
ALTER TABLE public.bar_members ALTER COLUMN user_id DROP NOT NULL;

-- Coluna nome direto no bar_members (sem depender de profiles)
ALTER TABLE public.bar_members ADD COLUMN IF NOT EXISTS nome TEXT;
