-- Produção: permitir cancelar um pedido (erro, cliente desistiu, etc).
-- Pedido cancelado sai da fila e não conta como venda.

alter table public.pedidos drop constraint if exists pedidos_status_check;
alter table public.pedidos add constraint pedidos_status_check
  check (status in ('recebido', 'preparando', 'pronto', 'entregue', 'cancelado'));

alter table public.pedidos add column if not exists cancelado_em timestamptz;
