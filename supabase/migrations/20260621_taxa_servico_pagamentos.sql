-- Adiciona campos de taxa de serviço à tabela pagamentos.
-- taxa_servico_pct: percentual aplicado (ex: 10)  — null = não cobrado
-- taxa_servico_valor: valor em reais da taxa       — null = não cobrado
-- O campo `valor` continua sendo o total BASE da comanda (sem serviço).

ALTER TABLE pagamentos
  ADD COLUMN taxa_servico_pct   numeric,
  ADD COLUMN taxa_servico_valor numeric;
