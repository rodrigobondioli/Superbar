-- Comanda aberta pelo próprio cliente (via QR da mesa) não tem bartender.
-- O schema base definia comandas.bartender_id como NOT NULL, o que fazia o
-- insert do fluxo do cliente (abrirComandaCliente) falhar silenciosamente
-- ("Não foi possível abrir a comanda"). Torna a coluna opcional.
-- Comandas abertas pelo bartender continuam preenchendo normalmente.

ALTER TABLE public.comandas ALTER COLUMN bartender_id DROP NOT NULL;
