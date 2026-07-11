-- ============================================================
-- Impede estoque product-level NEGATIVO.
-- O clamp anterior (P1-3) foi na tabela `ingredientes`. A tabela `estoque`
-- (quantidade por produto) não tinha clamp — daí os -51/-79 aparecerem na tela
-- (dado-semente + ausência de trava). Corrige o que já está negativo e trava
-- qualquer valor futuro em 0 (Princípio 12 — dado limpo).
-- ============================================================

-- 1) Corrige o que já está negativo (seed/histórico).
update public.estoque set quantidade_atual = 0 where quantidade_atual < 0;

-- 2) Trigger: clampa qualquer insert/update futuro em 0.
create or replace function public.clamp_estoque_quantidade()
returns trigger as $$
begin
  if new.quantidade_atual < 0 then
    new.quantidade_atual := 0;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clamp_estoque_quantidade on public.estoque;
create trigger trg_clamp_estoque_quantidade
before insert or update on public.estoque
for each row execute function public.clamp_estoque_quantidade();
