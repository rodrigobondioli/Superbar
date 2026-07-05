-- Auto-pedido: quando o próprio cliente adiciona um item pela tela da mesa (QR),
-- não há usuário/staff que "adicionou". comanda_items.adicionado_por era NOT NULL
-- (o garçom sempre preenche com o user), o que quebraria o insert do cliente.
-- Torna a coluna opcional. Itens lançados pela equipe continuam preenchendo.

ALTER TABLE public.comanda_items ALTER COLUMN adicionado_por DROP NOT NULL;
