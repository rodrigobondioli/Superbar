# SUPERBAR — Database Schema

**Versão:** 1.0  
**Data:** Junho 2026  
**Banco:** PostgreSQL 15 via Supabase  
**Total de tabelas:** 21  

> Para o SQL completo, veja `docs/schema.sql` (schema base) e `supabase/migrations/` (alterações incrementais).

---

## Arquitetura geral

- **Multi-tenant por `bar_id`:** cada bar é um tenant isolado. Toda tabela operacional tem `bar_id`.
- **RLS em todas as tabelas:** isolamento garantido pelo banco, não pelo app.
- **Realtime habilitado:** `pedidos`, `comandas`, `comanda_items`, `chamadas`.
- **Sem ENUMs para tipos extensíveis:** `ingrediente_movimentos.tipo` usa `TEXT + CHECK` para evitar migrations ao adicionar novos tipos.

---

## Diagrama de relacionamentos (simplificado)

```
profiles ──────────────────────────────────┐
    │                                       │
    └── bar_members ──── bars ──── mesas    │
                           │                │
                     assinaturas            │
                     planos                 │
                     turnos                 │
                           │                │
                        comandas ───────────┘ (bartender_id)
                           │
                    comanda_items
                           │
                        pedidos
                           │
                    pagamentos
                           │
                        produtos ── categorias
                           │           │
                   produto_variantes    │
                           │            │
                        receitas ─── ingredientes
                                         │
                               ingrediente_movimentos
```

---

## Tabelas por grupo

### Identidade e tenant

#### `profiles`
Estende `auth.users` do Supabase. Criado automaticamente via trigger.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | FK → `auth.users(id)` |
| `nome` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `avatar_url` | TEXT | |
| `telefone` | TEXT | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `bars`
Tenant principal. Um registro por bar.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `nome` | TEXT NOT NULL | |
| `slug` | TEXT UNIQUE | URL-friendly |
| `cnpj` | TEXT | |
| `configuracoes` | JSONB | `{ fuso_horario, alerta_turno_horas, auto_pedido }` |
| `ativo` | BOOLEAN | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `bar_members`
Vínculo entre usuário e bar com papel.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | **Identidade operacional** — usado em todos os campos `*_member_id` |
| `bar_id` | UUID NOT NULL | FK → `bars` |
| `user_id` | UUID **NULLABLE** | NULL = staff operacional sem auth |
| `nome` | TEXT | Nome direto (para staff sem auth) |
| `role` | bar_role | `dono \| gerente \| bar_manager \| bartender \| garcom \| caixa` |
| `pin` | TEXT(4) NULLABLE | PIN numérico para identificação rápida (Fase 2) |
| `ativo` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

> `user_id = NULL` para bartender/garçom/caixa que não precisam de login.  
> `user_id != NULL` para dono/gerente com conta Supabase Auth.  
> `bar_members.id` é a **identidade operacional** — apontada por todos os campos `*_member_id` nas tabelas de operação.

---

### Assinatura

#### `planos`
Planos de assinatura disponíveis.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `nome` | TEXT | Ex: "Fundador", "Padrão" |
| `slug` | TEXT UNIQUE | |
| `preco_mensal` | NUMERIC(10,2) | |
| `features` | JSONB | `{ relatorios, ia, estoque_avancado }` |
| `ativo` | BOOLEAN | |

#### `assinaturas`
Vínculo bar ↔ plano. Gerenciado server-side.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID | FK → `bars` |
| `plano_id` | UUID | FK → `planos` |
| `status` | assinatura_status | `trial \| ativa \| cancelada \| inadimplente` |
| `stripe_subscription_id` | TEXT | Para integração futura |
| `periodo_inicio` / `periodo_fim` | TIMESTAMPTZ | |
| `trial_fim` | TIMESTAMPTZ | Default: +14 dias |

---

### Operação

#### `turnos`
Sessão de trabalho. Apenas um aberto por bar por vez (enforce no app).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `status` | turno_status | `aberto \| fechado` |
| `abertura_por` | UUID | FK → `profiles` |
| `fechamento_por` | UUID | FK → `profiles` (nullable) |
| `aberto_em` | TIMESTAMPTZ | |
| `fechado_em` | TIMESTAMPTZ | |
| `total_vendas` | NUMERIC(10,2) | Acumulado via trigger |
| `total_comandas` | INT | Acumulado via trigger |

#### `mesas`
Mesas físicas do bar. Agrupador visual — não unidade de cobrança.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `numero` | INT | UNIQUE por bar |
| `nome` | TEXT | Ex: "Varanda", "Balcão" |
| `capacidade` | INT | |
| `ativo` | BOOLEAN | |

#### `comandas`
**Núcleo do sistema.** Uma comanda por pessoa, nunca por mesa.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `turno_id` | UUID NOT NULL | FK → `turnos` |
| `mesa_id` | UUID | FK → `mesas` (nullable — balcão sem mesa) |
| `bartender_id` | UUID NOT NULL | FK → `profiles` (legacy — só para usuários com auth) |
| `aberta_por_member_id` | UUID NULLABLE | FK → `bar_members` — **fonte de verdade para rastreabilidade** |
| `identificador` | TEXT | Nome, cartão, "Mesa 3 Pessoa 2" |
| `nome_cliente` | TEXT | Nome do cliente (opcional) |
| `status` | comanda_status | `aberta \| aguardando_pagamento \| paga \| cancelada` |
| `total` | NUMERIC(10,2) | Recalculado por trigger ao mudar itens |
| `aberta_em` / `fechada_em` | TIMESTAMPTZ | |

#### `comanda_items`
Itens de uma comanda. Tabela mais quente — Realtime habilitado.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `comanda_id` | UUID NOT NULL | FK → `comandas` |
| `bar_id` | UUID NOT NULL | **Denormalizado** para Realtime e RLS |
| `pedido_id` | UUID | FK → `pedidos` (nullable — itens avulsos) |
| `produto_id` | UUID NOT NULL | FK → `produtos` |
| `variante_id` | UUID | FK → `produto_variantes` |
| `variante_nome` | TEXT | Snapshot do nome da variante |
| `quantidade` | NUMERIC(10,3) | |
| `preco_unitario` | NUMERIC(10,2) | Snapshot do preço no momento |
| `preco_total` | NUMERIC(10,2) | |
| `status` | comanda_item_status | `ativo \| cancelado` |
| `adicionado_por` | UUID | FK → `profiles` (legacy) |
| `adicionado_por_member_id` | UUID NULLABLE | FK → `bar_members` — **fonte para "quem vendeu mais"** |
| `cancelado_por` | UUID | FK → `profiles` (legacy) |
| `cancelado_por_member_id` | UUID NULLABLE | FK → `bar_members` — **fonte para auditoria de cancelamento** |
| `adicionado_em` / `cancelado_em` | TIMESTAMPTZ | |

#### `pedidos`
Agrupamento de itens para a fila de produção do bartender.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `turno_id` | UUID NOT NULL | |
| `comanda_id` | UUID NOT NULL | |
| `status` | TEXT CHECK | `recebido \| preparando \| entregue` |
| `criado_em` | TIMESTAMPTZ | |
| `iniciado_em` | TIMESTAMPTZ | Quando bartender inicia preparo |
| `entregue_em` | TIMESTAMPTZ | Quando bartender entrega |
| `criado_por_member_id` | UUID NULLABLE | FK → `bar_members` |
| `iniciado_por_member_id` | UUID NULLABLE | FK → `bar_members` |
| `entregue_por_member_id` | UUID NULLABLE | FK → `bar_members` — **fonte para tempo de preparo por bartender** |

#### `pagamentos`
Registro de método de pagamento. Não transaciona — apenas anota.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `comanda_id` | UUID NOT NULL | |
| `bar_id` | UUID NOT NULL | |
| `turno_id` | UUID NOT NULL | |
| `valor` | NUMERIC(10,2) | |
| `metodo` | pagamento_metodo | `pix \| credito \| debito \| dinheiro \| cortesia` |
| `status` | pagamento_status | `pendente \| confirmado \| estornado` |
| `processado_por` | UUID | FK → `profiles` (legacy) |
| `processado_por_member_id` | UUID NULLABLE | FK → `bar_members` — **fonte para auditoria de caixa** |
| `processado_em` | TIMESTAMPTZ | |

---

### Cardápio

#### `categorias`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `nome` | TEXT NOT NULL | Ex: "Drinques", "Cervejas" |
| `ordem` | INT | Ordenação no cardápio |
| `ativo` | BOOLEAN | |

#### `produtos`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `categoria_id` | UUID | FK → `categorias` |
| `nome` | TEXT NOT NULL | |
| `descricao` | TEXT | |
| `preco` | NUMERIC(10,2) NOT NULL | |
| `custo` | NUMERIC(10,2) | **Princípio 10** — obrigatório para inteligência real |
| `ativo` | BOOLEAN | |

#### `produto_variantes`
Variantes de um produto (ex: Caipirinha Limão / Morango / Maracujá).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `produto_id` | UUID NOT NULL | FK → `produtos` |
| `nome` | TEXT NOT NULL | Ex: "Limão", "Morango" |
| `preco` | NUMERIC(10,2) NOT NULL | Pode diferir do produto base |
| `ativo` | BOOLEAN | |

---

### Camada 2 — Inteligência (CMV real)

#### `ingredientes`
Insumos do bar com custo e estoque atual.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `nome` | TEXT NOT NULL | Ex: "Tanqueray 750ml", "Limão" |
| `unidade` | TEXT CHECK | `un \| ml \| l \| g \| kg` |
| `estoque_atual` | NUMERIC(12,3) | Decrementado por `fn_entregar_pedido()` |
| `estoque_minimo` | NUMERIC(12,3) | Gatilho de alerta |
| `custo_atual` | NUMERIC(12,4) | Desnormalizado — snapshot mais recente |
| `ativo` | BOOLEAN | |

#### `receitas`
Composição de ingredientes por produto. Uma receita por combinação produto × ingrediente.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `produto_id` | UUID NOT NULL | FK → `produtos` |
| `ingrediente_id` | UUID NOT NULL | FK → `ingredientes` |
| `quantidade` | NUMERIC(12,3) | Na unidade do ingrediente |
| UNIQUE | `(produto_id, ingrediente_id)` | Um ingrediente por receita por produto |

#### `ingrediente_movimentos`
Audit trail imutável de movimentações de ingredientes.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `bar_id` | UUID NOT NULL | |
| `ingrediente_id` | UUID NOT NULL | |
| `pedido_id` | UUID | FK → `pedidos` (rastreabilidade) |
| `comanda_item_id` | UUID | FK → `comanda_items` (rastreabilidade) |
| `tipo` | TEXT CHECK | `entrada \| venda \| ajuste` (extensível sem migration) |
| `quantidade` | NUMERIC(12,3) | Negativo = saída, positivo = entrada |
| `custo_unitario` | NUMERIC(12,4) | Snapshot imutável do custo no momento |
| `criado_por` | UUID | FK → `profiles` (legacy) |
| `criado_por_member_id` | UUID NULLABLE | FK → `bar_members` |
| `motivo` | TEXT | Para ajustes manuais |
| `criado_em` | TIMESTAMPTZ | |

---

### Estoque de produto (Camada 1 — legado)

> Estas tabelas são do schema original e controlam estoque por produto (não por ingrediente). A Camada 2 (ingredientes) é a fonte de inteligência real. A Camada 1 permanece para compatibilidade.

#### `estoque`
Nível atual por produto.

| Coluna | Tipo | Notas |
|---|---|---|
| `bar_id` + `produto_id` | UNIQUE | |
| `quantidade_atual` | NUMERIC(10,3) | |
| `quantidade_minima` | NUMERIC(10,3) | |
| `unidade` | estoque_unidade | |

#### `estoque_movimentos`
Audit trail de movimentações por produto.

---

## Funções SQL

| Função | Tipo | Descrição |
|---|---|---|
| `is_bar_member(bar_id, roles[])` | SECURITY DEFINER | Checa se auth.uid() é membro do bar com role opcional |
| `my_bar_ids()` | SECURITY DEFINER | Retorna array de bar_ids do usuário logado |
| `my_role_in_bar(bar_id)` | SECURITY DEFINER | Retorna o role do usuário no bar |
| `fn_entregar_pedido(pedido_id, user_id)` | SECURITY DEFINER | Motor de baixa de estoque — chamado explicitamente |
| `handle_new_user()` | TRIGGER | Cria `profiles` ao registrar novo usuário |
| `handle_comanda_total()` | TRIGGER | Recalcula `comandas.total` ao mudar itens |
| `handle_turno_on_comanda_paid()` | TRIGGER | Atualiza `turnos.total_vendas` ao pagar comanda |

---

## Políticas RLS (resumo)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `bars` | membro | — | dono | — |
| `bar_members` | membro | dono/gerente | dono/gerente | dono |
| `turnos` | membro | membro | membro | dono |
| `comandas` | membro | membro | membro | dono/gerente |
| `comanda_items` | membro | membro | membro | dono/gerente |
| `pedidos` | membro | membro | membro | — |
| `pagamentos` | membro | dono/gerente/caixa | dono/gerente | dono |
| `produtos` | membro | dono/gerente | dono/gerente | dono/gerente |
| `ingredientes` | membro | dono/gerente | dono/gerente | dono/gerente |
| `receitas` | membro | dono/gerente | dono/gerente | dono/gerente |
| `ingrediente_movimentos` | membro | membro | — | — |

---

## Índices principais

```sql
-- Comandas (tabela quente)
idx_comandas_bar_status   ON comandas(bar_id, status)
idx_comandas_turno        ON comandas(turno_id)
idx_comandas_bartender    ON comandas(bartender_id)

-- Comanda Items (tabela mais quente — Realtime)
idx_comanda_items_comanda ON comanda_items(comanda_id)
idx_comanda_items_bar     ON comanda_items(bar_id)

-- Pedidos
pedidos_bar_turno_idx     ON pedidos(bar_id, turno_id)
pedidos_status_idx        ON pedidos(status) WHERE status != 'entregue'

-- Ingredientes
idx_ingredientes_bar      ON ingredientes(bar_id)
idx_receitas_bar_produto  ON receitas(bar_id, produto_id)
idx_ing_mov_bar_ing       ON ingrediente_movimentos(bar_id, ingrediente_id)
idx_ing_mov_bar_data      ON ingrediente_movimentos(bar_id, criado_em DESC)
```
