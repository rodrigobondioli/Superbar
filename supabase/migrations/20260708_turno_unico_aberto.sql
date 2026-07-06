-- Garante NO MÁXIMO UM turno aberto por bar.
--
-- Problema: getOuCriarTurno faz SELECT-e-depois-INSERT. Dois dispositivos
-- abrindo a noite ao mesmo tempo podiam criar dois turnos "aberto" no mesmo bar
-- → pedidos e pagamentos espalhados em turnos diferentes → fechamento e
-- relatório do turno bagunçados. (Princípio 12 — dado limpo/íntegro.)
--
-- Solução: índice único parcial. O banco passa a rejeitar um segundo turno
-- aberto no mesmo bar; o app trata a violação relendo o turno vencedor.

-- 1. Defensivo: se já existirem turnos abertos duplicados, mantém o mais ANTIGO
--    por bar e fecha os demais (evita que a criação do índice falhe).
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY bar_id ORDER BY aberto_em ASC, id ASC) AS rn
  FROM public.turnos
  WHERE status = 'aberto'
)
UPDATE public.turnos t
SET    status = 'fechado',
       fechado_em = now()
FROM   ranked r
WHERE  t.id = r.id
  AND  r.rn > 1;

-- 2. Trava dura: um único turno aberto por bar.
CREATE UNIQUE INDEX IF NOT EXISTS turnos_um_aberto_por_bar
  ON public.turnos (bar_id)
  WHERE status = 'aberto';
