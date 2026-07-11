-- ============================================================
-- Hotfix pré-inauguração.
-- ============================================================

-- ── P1-3: impedir estoque NEGATIVO ─────────────────────────────────────────
-- A baixa por venda (fn_entregar_pedido) decrementa ingredientes.estoque_atual
-- sem checar saldo; o pré-check no add-item é TOCTOU. Um BEFORE trigger clampa
-- qualquer ingrediente em 0 — cobre TODOS os caminhos de baixa sem reescrever
-- a função de entrega (110 linhas), com risco mínimo.

CREATE OR REPLACE FUNCTION public.clamp_estoque_ingrediente()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estoque_atual < 0 THEN
    NEW.estoque_atual := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clamp_estoque ON public.ingredientes;
CREATE TRIGGER trg_clamp_estoque
BEFORE INSERT OR UPDATE ON public.ingredientes
FOR EACH ROW EXECUTE FUNCTION public.clamp_estoque_ingrediente();


-- ── P1-6: pagamento só alterável por dono/gerente ──────────────────────────
-- Antes: pagamentos_update liberado para qualquer membro do bar -> qualquer
-- staff podia alterar valor/método de um pagamento sem trilha. Nenhum fluxo
-- legítimo do app faz UPDATE em pagamentos (verificado), então restringir é
-- seguro e fecha a brecha de fraude interna.

DROP POLICY IF EXISTS "pagamentos_update" ON public.pagamentos;
CREATE POLICY "pagamentos_update" ON public.pagamentos
  FOR UPDATE USING (public.my_role_in_bar(bar_id) IN ('dono', 'gerente'));
