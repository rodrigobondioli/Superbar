# SUPERBAR — Product Requirements Document

**Versão:** 1.0  
**Data:** Junho 2026  
**Status:** Estágio 1 — em produção, primeiro piloto pendente  
**Fonte de verdade estratégica:** `docs/negocio.md`

---

## 1. Visão do produto

O SUPERBAR é o **cérebro do bar**: roda a operação inteira em tempo real (pedido → bartender → caixa → dono) e transforma cada comanda e cada noite em **decisão de dinheiro** — quanto se lucra, qual drink dá margem, onde vaza.

**Hierarquia que manda em toda decisão de produto:**  
A inteligência é o fim. A operação é o meio. Toda feature responde primeiro: *isso aumenta a capacidade do dono de decidir sobre dinheiro?*

**Slogan:** Seu bar ficou super inteligente.

---

## 2. Público-alvo

**Segmento de entrada:** bares premium e casas de coquetelaria de São Paulo capital, depois Rio.

| Papel | Quem é | Relação com o produto |
|---|---|---|
| **Dono / Gestor** | Quem paga e decide | Dashboard, relatórios, configuração |
| **Bartender** | Quem produz e entrega | Fila de produção (iPad) |
| **Garçom** | Quem anota e serve | Abertura e gerência de comandas |
| **Caixa** | Quem fecha e cobra | Fechamento de comanda, registro de pagamento |
| **Cliente do bar** | Quem consome | QR code / NFC (hipótese a validar) |

---

## 3. Superfícies do produto

### 3.1 Bartender (iPad — tela mais crítica, Princípio 11)

**Rota:** `/bartender`

Dois modos: **Mesas** e **Produção**.

**Mesas** — gerência de comandas abertas:
- Lista de mesas com comandas ativas
- Abertura de comanda (por mesa, por pessoa, por identificador ou QR)
- Adição de produto (com seleção de variante quando aplicável)
- Remoção de item
- Fechamento de comanda para o caixa
- Alerta visual quando mesa chama atendimento

**Produção** — fila em tempo real:
- Todos os pedidos com status `recebido` ou `preparando`
- Botão "Iniciar preparo" → muda status para `preparando`
- Botão "Entregue" → marca como `entregue`, dispara baixa de estoque de ingredientes via `fn_entregar_pedido()`
- Realtime via Supabase (INSERT/UPDATE em `pedidos`)

### 3.2 Garçom / Caixa

**Rota:** `/garcom/[comandaId]` e `/caixa`

Garçom:
- Visão da comanda individual
- Adiciona e remove itens
- Fecha comanda para pagamento

Caixa:
- Lista de comandas `aguardando_pagamento`
- Visão completa de itens consumidos
- Registro de pagamento por método (Pix, Dinheiro, Débito, Crédito, Cortesia)
- **Não transaciona** — apenas registra o método (Princípio 8)

### 3.3 Dashboard do Dono

**Rota:** `/dashboard`

Visão geral:
- Faturamento do turno atual
- Ticket médio
- Número de comandas abertas
- Insights declarativos de operação (pico, métodos de pagamento, tempo médio de preparo)

Sub-páginas:
- `/dashboard/equipe` — gerência de membros (sem invite, sem auth para staff operacional)
- `/dashboard/cardapio` — categorias, produtos, variantes, custo
- `/dashboard/mesas` — configuração de mesas, QR code por mesa
- `/dashboard/turnos` — histórico de turnos e abertura/fechamento
- `/dashboard/caixa` — lista de comandas do turno

### 3.4 Admin / Configurações

- Cardápio: categorias, produtos (com custo — Princípio 10), variantes
- Mesas: criação, edição, QR code
- Equipe: adicionar/desativar membros (direto, sem fluxo de convite)
- Bar: nome, configurações gerais, toggle de auto_pedido (NFC/QR)

---

## 4. Funcionalidades por status

### Implementadas (Estágio 1)

| Funcionalidade | Rota / Componente |
|---|---|
| Auth (cadastro + login) | `/login`, `/cadastro` |
| Onboarding de bar | `/onboarding` |
| Dashboard com insights | `/dashboard` |
| Gerência de cardápio | `/dashboard/cardapio` |
| Variantes de produto | `/dashboard/cardapio` |
| Gerência de mesas | `/dashboard/mesas` |
| QR code por mesa | `/dashboard/mesas` |
| Gerência de equipe | `/dashboard/equipe` |
| Abertura e fechamento de turno | `/dashboard/turnos` |
| Tela do bartender (mesas + produção) | `/bartender` |
| Fila de produção em tempo real | Supabase Realtime |
| Comanda por pessoa | `/garcom/[id]` |
| Seleção de variante no pedido | Modal no bartender |
| Registro de pagamento | `/caixa` |
| Baixa de estoque de ingredientes | `fn_entregar_pedido()` RPC |
| Schema de ingredientes e receitas | Migration `20260623_ingredientes_receitas.sql` |
| Chamada de atendimento (mesa → bartender) | Realtime `chamadas` |
| Toggle auto_pedido (NFC/QR) | Configurações do bar |
| Menu público via QR | `/menu` |

### Não implementadas / fora do escopo MVP

| Funcionalidade | Motivo |
|---|---|
| Processamento de pagamento (gateway) | Princípio 8 — registra método, não transaciona |
| Nota fiscal (NFC-e / SAT) | Estágio 3 |
| Relatórios avançados de BI | Estágio 2 |
| Multi-unidade / rede | Estágio 3 |
| CRM de cliente recorrente | Estágio 2 |
| Previsão de demanda | Estágio 2 |
| UI de estoque / ingredientes | Schema pronto, UI aguarda primeiro piloto |
| Cobrança por módulo | Nunca (Princípio 7) |

---

## 5. Fluxo principal de operação

```
Dono abre turno
  → Garçom/Bartender abre comanda por mesa ou identificador
      → Bartender recebe pedido na fila (Realtime)
          → Bartender inicia preparo → entrega
              → fn_entregar_pedido() baixa ingredientes
  → Caixa fecha comanda → registra pagamento
      → Turno acumula total_vendas
Dono fecha turno
  → Dashboard mostra faturamento, ticket, CMV (quando receitas cadastradas)
```

---

## 6. Modelo de dados (resumo)

Entidades principais, em ordem de criticidade operacional:

1. **bars** — tenant principal
2. **bar_members** — equipe (user_id nullable para staff sem auth)
3. **turnos** — sessão de trabalho
4. **comandas** — uma por pessoa, nunca por mesa
5. **comanda_items** — itens (tabela mais quente, Realtime)
6. **pedidos** — agrupamento de itens para a fila de produção
7. **pagamentos** — registro de método, nunca transação
8. **produtos** + **produto_variantes** — cardápio com custo
9. **ingredientes** + **receitas** — Camada 2 de inteligência (CMV real)
10. **ingrediente_movimentos** — audit trail de estoque de ingredientes

Schema completo: `docs/SCHEMA.md`

---

## 7. Regras de negócio críticas

1. **Apenas um turno aberto por bar por vez** — enforce no app (não no DB).
2. **Comanda por pessoa, nunca por mesa** — mesa é agrupador visual, não unidade de cobrança.
3. **Pagamento = registro de método** — Pix/Dinheiro/Débito/Crédito/Cortesia. Sem integração com gateway.
4. **Baixa de ingredientes via RPC** — `fn_entregar_pedido()` chamado explicitamente ao marcar pedido como entregue. Nunca trigger automático.
5. **Produtos sem receita cadastrada** — sem baixa, sem erro. O sistema funciona parcialmente configurado.
6. **Staff operacional sem auth** — bartender/garçom/caixa têm `user_id = NULL` em `bar_members`. A seleção de usuário é estado local no device.

---

## 8. Hipóteses críticas a validar (por ordem de risco)

| # | Hipótese | Status |
|---|---|---|
| H2 | Bartender adota sem sabotar | ⚠️ Não testado em produção |
| H3 | Dono paga R$ 1.297/mês | ⚠️ Não validado com cliente real |
| H1 | A dor existe e é severa | ✅ Confirmado por pesquisa |
| H4 | Onboarding white-glove funciona | ✅ Forte indício |
| H5 | NFC/QR serve bar premium | ❓ Em teste |

---

## 9. Modelo de precificação

| Plano | Valor | Condição |
|---|---|---|
| Fundador (10 primeiros) | R$ 697/mês | Travado 12 meses · setup incluído · sem multa. Após 12 meses migra para o Padrão. |
| Padrão | R$ 1.297/mês | Setup R$ 1.800 cobrado após go-live |

Tudo incluído. Sem módulo à parte. Sem multa de cancelamento.
