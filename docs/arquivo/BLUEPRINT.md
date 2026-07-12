# SUPERBAR — Blueprint do Projeto
### Documento de contexto para agente de IA

**Versão:** 1.0 · Junho 2026  
**Status:** Produto em desenvolvimento ativo. Estágio 1 implementado. Primeiro piloto pendente.

> Este documento é a fonte de contexto única para qualquer agente de IA que trabalhe neste projeto. Leia inteiro antes de tomar qualquer decisão de código, produto ou estratégia.

---

## 1. O que é o SUPERBAR

O SUPERBAR é o **cérebro do bar**: transforma cada pedido, comanda e noite em **decisão de dinheiro** — quanto se lucra, qual drink dá margem, onde vaza, o que fazer agora.

Para ter esse cérebro, ele roda a operação inteira em tempo real (pedido → bartender → caixa → dono, sem papel e sem grito). Mas a hierarquia não se inverte: **a operação é o meio; a inteligência é o fim e o diferencial.**

**Slogan:** *Seu bar ficou super inteligente.*

**A missão em uma frase:** O dono não deve procurar a informação. A informação deve encontrar o dono.

---

## 2. Os 12 Princípios (a régua de toda decisão)

Toda decisão de produto, código, preço ou estratégia passa por aqui primeiro.

**O norte**
1. **A inteligência é o fim.** Toda decisão começa: *isso aumenta a capacidade do dono de decidir sobre dinheiro?* Se não, é operação ou enfeite.
2. **A operação serve à inteligência.** Operação que não vira dado útil é peso morto.
3. **Evoluir sempre, pela porta certa.** Feature nova entra avaliada pela inteligência, não pela moda.

**O que protege**
4. **Nunca virar commodity.** Se só iguala a Goomer/Consumer/Zig, não é prioridade.
5. **O dado é o moat.** Lock-in por valor (histórico acumulado), nunca por multa.
6. **Premium, feito pra bar.** Não diluir pra atender bar médio antes de dominar o topo.

**As linhas que não se cruzam**
7. **Tudo incluído.** Nunca cobrar módulo à parte. Jamais.
8. **Não tocar no dinheiro do bar.** Registra o método (Pix/Dinheiro/Débito/Crédito/Cortesia). NÃO transaciona. Regra dura.
9. **Não prometer o que não existe.** Copy e venda só falam do que o produto faz hoje.

**As verdades que sustentam tudo**
10. **Custo cadastrado = inteligência real.** Sem custo de produto, margem e CMV são ficção. É passo obrigatório do onboarding.
11. **O bartender não pode sentir o sistema como inimigo.** A tela do bartender é a peça mais importante do produto — prioridade máxima de usabilidade, velocidade e robustez.
12. **Dado limpo desde o dia 1.** Nenhum pedido, comanda ou pagamento pode ser perdido.

---

## 3. Para quem é

**Segmento de entrada (beachhead):** bares premium e casas de coquetelaria de São Paulo capital, depois Rio. Operações com bartender, garçom e caixa separados — onde tem volume, comanda aberta horas e o caos entre pista e caixa custa dinheiro todo fim de semana.

**Papéis e relação com o produto:**

| Papel | Quem é | Surface principal |
|---|---|---|
| **Dono / Gestor** | Quem paga e decide | Dashboard `/dashboard` |
| **Bartender** | Quem produz e entrega | iPad `/bartender` |
| **Garçom** | Quem anota e serve | Mobile `/garcom/[id]` |
| **Caixa** | Quem fecha e registra pagamento | `/caixa` |
| **Cliente do bar** | Quem consome | QR/NFC — hipótese em teste, não core |

---

## 4. Modelo de negócio

**Mensalidade por plano. O SUPERBAR nunca toca no dinheiro do bar.**

| Plano | Preço | Condição |
|---|---|---|
| **Fundador** (10 primeiros bares) | R$ 697/mês travado por 12 meses | Implantação incluída, sem multa. Após 12 meses migra para o Padrão. |
| **Padrão** (do 11º em diante) | R$ 1.297/mês + setup R$ 1.800 | Setup cobrado só após go-live |

**Regras de cobrança que viram diferencial:**
- Tudo incluído — sem cobrar módulo à parte
- Mensalidade começa só quando o sistema estiver rodando
- Sem multa pra cancelar — retenção por valor, não por contrato

---

## 5. Roadmap de inteligência (os 3 estágios)

O roadmap não é de features — é de profundidade da inteligência.

**Estágio 1 — Decidir o turno (atual)**
Alertas determinísticos e confiáveis: CMV, meta mensal, estoque crítico, ticket. Regras: verdade ou silêncio.

**Estágio 2 — Decidir o negócio (próximo)**
Detecção de anomalias com histórico (≥30 turnos). Ticket caindo, produto em queda, categoria desacelerando. Exige linha de base.

**Estágio 3 — Decidir contra o mercado (futuro)**
Causalidade + recomendações + benchmark de rede. "Seu ticket está 12% abaixo de bares similares."

> **Regra de ouro:** falsos positivos são piores que ausência de alertas. Um alerta errado que o dono descarta destrói a credibilidade de todos os seguintes.

---

## 6. Stack técnica

```
Next.js 15 (App Router)     — framework principal
Tailwind CSS v4             — estilização via @theme {}
Supabase                    — banco PostgreSQL + Auth + Realtime + Edge Functions
Vercel                      — deploy
```

**Padrões arquiteturais:**
- **Server Components** por padrão — dados carregados no servidor
- **Client Components** (`"use client"`) apenas onde há interatividade (Realtime, estado local, eventos)
- **Server Actions** para mutações (não API routes)
- **Supabase Realtime** para fila de produção do bartender (INSERT/UPDATE em `pedidos`, `comanda_items`, `chamadas`)
- **PWA** — sem instalar app: iPad do bartender, celular do dono
- **Multi-tenant por `bar_id`** — RLS no banco garante isolamento, não o app

**Atenção ao Next.js 15:** esta versão tem breaking changes. Antes de escrever qualquer código de roteamento, middleware ou Server Actions, consultar `AGENTS.md` na raiz do projeto.

---

## 7. Estrutura de arquivos

```
/src
  /app
    /dashboard          — Dashboard do Dono (rota protegida)
      page.tsx          — Página principal do dashboard
      /cardapio         — Gestão de cardápio, categorias, variantes
      /equipe           — Gestão de membros do bar
      /mesas            — Gestão de mesas e QR codes
      /turnos           — Histórico de turnos, abrir/fechar
      /caixa            — Lista de comandas do turno
      /estoque          — Alertas de estoque
      /inteligencia     — Insights e análises (stage 2)
      /relatorios       — Relatórios históricos
    /bartender          — Tela do bartender (iPad) — tabs Mesas | Produção
    /garcom/[id]        — Visão da comanda individual
    /caixa              — Fechamento de comanda e registro de pagamento
    /onboarding         — Wizard de configuração inicial
    /admin              — Painel interno (guard por email)
    /menu               — Cardápio público (QR code)
    /mesa/[mesaId]      — Página do cliente (QR flow)
  /components
    /dashboard          — Componentes do dashboard
      dash-card.tsx     — Card base do dashboard (bg-elevated + border)
      card-overline.tsx — Label uppercase de seção
      live-bar.tsx      — Barra de KPIs ao vivo (Realtime)
      proxima-melhor-acao.tsx — Card de next best action
      ai-hero-input.tsx — Input do assistente AI
    /ui
      bar-chart.tsx     — BarChart (Recharts) com suporte a fill
      trend-text.tsx    — Indicador de tendência ↑↓
  /lib
    /dashboard
      queries.ts        — Queries de dados do dashboard
      insights.ts       — Gerador de insights declarativos
      operacao.ts       — KPIs de operação (pico, mesas, pagamento, preparo)
      relatorios.ts     — Faturamento por dia/período
      menu-engineering.ts — Categorização BCG de produtos
      turno-actions.ts  — Server Actions de turno
    /inteligencia
      queries.ts        — Stage da inteligência, insights não lidos
    /supabase           — Cliente Supabase (server + client)
/docs
  negocio.md            — Estratégia e princípios (fonte de verdade de negócio)
  SCHEMA.md             — Documentação do banco de dados
  PRD.md                — Product Requirements Document
  API.md                — Referência de queries e actions
  TDD.md                — Decisões técnicas
  BLUEPRINT.md          — Este arquivo
/supabase
  /migrations           — Migrations SQL incrementais
  /functions            — Edge Functions (calcular-insights)
CLAUDE.md               — Ponto de entrada para agentes de IA
DESIGN.md               — Contrato visual completo
AGENTS.md               — Regras específicas do Next.js desta versão
```

---

## 8. Banco de dados — tabelas principais

**Arquitetura:** multi-tenant por `bar_id`, RLS em todas as tabelas, Realtime em `pedidos`, `comanda_items`, `chamadas`.

### Tabelas centrais

| Tabela | Papel |
|---|---|
| `bars` | Tenant principal — um por bar |
| `bar_members` | Vínculo usuário ↔ bar com role. `user_id` pode ser NULL para staff sem login |
| `profiles` | Extensão do `auth.users` do Supabase |
| `turnos` | Sessão de trabalho. Um aberto por bar por vez |
| `mesas` | Mesas físicas — agrupador visual, não unidade de cobrança |
| `comandas` | **Núcleo do sistema.** Uma por pessoa, nunca por mesa |
| `comanda_items` | Itens de comanda — tabela mais quente, Realtime habilitado |
| `pedidos` | Agrupamento de itens para a fila de produção |
| `pagamentos` | Registro de método — NÃO transaciona (Princípio 8) |
| `categorias` | Categorias do cardápio |
| `produtos` | Produtos com `custo` nullable (Princípio 10) |
| `produto_variantes` | Variantes de produto (ex: Caipirinha Limão / Morango) |
| `ingredientes` | Insumos com estoque e custo atual |
| `receitas` | Composição ingrediente × produto |
| `ingrediente_movimentos` | Audit trail imutável de movimentos de estoque |
| `insights` | Insights calculados com `dedupe_key` (Edge Function) |
| `planos` / `assinaturas` | Modelo de cobrança |

### Roles de `bar_members`
`dono | gerente | bar_manager | bartender | garcom | caixa`

### Função crítica
`fn_entregar_pedido(pedido_id, user_id)` — motor de baixa de estoque. Chamado via RPC quando bartender marca pedido como entregue.

### Status de comanda
`aberta → aguardando_pagamento → paga | cancelada`

### Status de pedido
`recebido → preparando → entregue`

---

## 9. Design System

**Fonte de verdade visual:** `DESIGN.md`

**Identidade:**
- Fundo: `#222222` (dark) / `#F2F2F2` (light)
- Cards: `#2E2E2E` (dark) / `#F5F5F7` (light)
- Texto: `#FFFFFF` / `#0D0D14`
- Accent: `#1133FF` (ação/CTA)
- Semânticas: `--ok: #22C55E`, `--warn: #F59E0B`, `--danger: #EF4444` — **apenas em telas operacionais (Bartender/Caixa)**
- Fonte display: ABC Maxi Round Plus (`--font-display`) — títulos e heroes
- Fonte corpo/dados: Roboto Mono (`--font-mono`) — tudo o mais

**Ativação do tema dark:** `data-theme="dark"` no elemento pai (aplicado em `dashboard-layout-client.tsx`)

**Componentes padrão do dashboard:**
- `DashCard` — `bg-elevated + border 1px + borderRadius 14px + padding 20px 24px`
- `CardOverline` — label uppercase, font-mono, `rgba(255,255,255,0.45)`
- `BarChart` — Recharts, barras com gradient branco, suporta `fill` prop (preenche altura do container)
- `TrendText` — indicador ↑↓ com percentual

**Proibido:**
- Degradê de qualquer tipo
- Sombra colorida ou decorativa
- `#39FF14` como fundo (só ação)
- Cores semânticas fora de Bartender/Caixa
- Hex cru no componente — sempre token CSS

---

## 10. Dashboard — estrutura atual

O dashboard do dono tem turno ativo e turno fechado (dois estados completamente diferentes).

### Com turno ativo (`/dashboard`)

```
LiveBar (full-width)
  └── KPIs ao vivo via Supabase Realtime: Faturamento, Comandas, Drinks, Margem, Ticket

CONTENT (padding 20px 24px):

  ROW 1 — CSS Grid 2 colunas (1fr 252px), minHeight: 420px
    └── LEFT: DashCard com BarChart fill (Receita 7 dias)
         - Título "Receita" em font-display 28px
         - Subtítulo + TrendText vs semana passada
         - BarChart preenche 100% da altura restante
    └── RIGHT: Grid 3 linhas iguais (1fr 1fr 1fr)
         - Meta do Mês (% com progress bar)
         - Ticket Médio (R$ com trend)
         - Estoque (OK | N alertas)

  ROW 2 — CSS Grid 3 colunas iguais (1fr 1fr 1fr)
    └── Col 1: Alertas/Insights (top 3, com border-left semântico)
    └── Col 2: Vendas por hora (SVG inline, line chart)
    └── Col 3: Próxima Melhor Ação (produto top por margem)

  AI Input (AiHeroInput)
```

### Sem turno ativo

Se nunca teve turno → Checklist de setup (cardápio, mesas, equipe, abrir 1º turno).
Se já teve turno → Resumo do último turno fechado + insights disponíveis.

---

## 11. Superfícies operacionais

### Bartender (`/bartender`)

Dois modos via tabs:
- **Mesas:** lista de mesas com comandas ativas, abertura de comanda, adição de produto (com modal de variante), fechamento para caixa
- **Produção:** fila em tempo real via Realtime. Botões: "Iniciar preparo" → "Entregue" (dispara `fn_entregar_pedido()`)

Requisitos de usabilidade (Princípio 11): toque em iPad, Realtime sem delay, zero travamento no pico, tamanho de toque mínimo 48px.

### Garçom (`/garcom/[comandaId]`)

Visão individual da comanda. Adiciona e remove itens. Solicita fechamento.

### Caixa (`/caixa`)

Lista de comandas `aguardando_pagamento`. Registra pagamento por método. Não transaciona (Princípio 8).

### Menu público (`/menu`)

Cardápio público acessado via QR code. Hipótese de pedido pelo cliente em avaliação — não é core.

---

## 12. Inteligência — estado atual

**Stage 1 (regras determinísticas):** implementado.
- Insights gerados em `src/lib/dashboard/insights.ts` + `operacao.ts`
- Edge Function `calcular-insights` gera insights persistidos na tabela `insights`
- Tipos: `action` (crítico), `opportunity` (oportunidade), `info` (informativo)
- Regra: nunca gerar alerta se o dado for insuficiente — silêncio é melhor que ruído

**Stage 2 (anomalias):** tabela `insights` e Edge Function já existem. Lógica de detecção de anomalia a implementar.

---

## 13. Fluxo de dados principal

```
Garçom/Bartender abre comanda
  → INSERT em comandas

Garçom/Bartender adiciona item
  → INSERT em comanda_items
  → Trigger recalcula comandas.total
  → INSERT em pedidos (agrupamento)
  → Realtime notifica tela do bartender

Bartender inicia preparo
  → UPDATE pedidos.status = 'preparando'

Bartender entrega
  → UPDATE pedidos.status = 'entregue'
  → RPC fn_entregar_pedido() → decrementa ingrediente.estoque_atual
  → INSERT em ingrediente_movimentos

Mesa pede conta
  → UPDATE comandas.status = 'aguardando_pagamento'
  → Realtime notifica caixa

Caixa registra pagamento
  → UPDATE comandas.status = 'paga'
  → INSERT em pagamentos (método apenas)
  → Trigger atualiza turnos.total_vendas
```

---

## 14. Server Actions e queries principais

**Ações de turno:**
- `abrirTurno(barId)` / `fecharTurno(turnoId, barId)`

**Ações de comanda:**
- `abrirComanda(barId, turnoId, mesaId, identificador, nomeMembro)` 
- `adicionarItem(comandaId, produtoId, varianteId?, barId)`
- `removerItem(itemId, barId)`
- `fecharComandaParaPagamento(comandaId, barId)`

**Ações de pedido:**
- `criarPedido(comandaId, barId, turnoId, itensSelecionados)`
- `iniciarPedido(pedidoId, barId, memberId)`
- `entregarPedido(pedidoId, barId, memberId)` → dispara `fn_entregar_pedido()`

**Ações de pagamento:**
- `registrarPagamento(comandaId, barId, turnoId, valor, metodo)`

**Queries principais do dashboard:**
- `getKpisTurno(turno)` → faturamento, ticket médio, comandas abertas
- `getKpisComparacao(barId, turno, kpis, ...)` → variação vs período anterior
- `getMetaMes(barId, meta?)` → progresso da meta mensal
- `getFaturamentoPorDia(barId, periodo, agrupamento)` → dados do BarChart
- `getAlertasEstoque(barId)` → ingredientes abaixo do mínimo
- `getHorarioPico(barId, turnoId)` → horário de maior venda
- `getRankingMesas(barId, turnoId)` → mesas por faturamento
- `getMixPagamento(barId, turnoId)` → distribuição de métodos
- `getTempoMedioPreparo(barId, turnoId)` → tempo bartender
- `getInteligenciaStage(barId)` → stage (1 ou 2) + insights não lidos

---

## 15. Migrations SQL (mais recentes)

```
20260622_pedidos.sql              — Tabela pedidos + pedido_id em comanda_items
20260623_bar_members_operacional.sql — user_id nullable + PIN + member_id attribution
20260623_ingredientes_receitas.sql   — ingredientes, receitas, movimentos
20260624_member_attribution.sql   — campos *_member_id em comanda_items e pedidos
20260625_insights.sql             — tabela insights + dedupe_key
20260626_estoque_custo_unitario.sql  — custo_unitario em estoque
20260627_leads.sql                — tabela leads (CRM primitivo)
```

---

## 16. O que NÃO fazer (linhas duras)

- **Não** construir processamento de pagamento (gateway, split, settlement). Só `pagamentos.metodo`.
- **Não** criar paywall ou cobrar módulo à parte.
- **Não** expor feature mock/falsa em produção como real.
- **Não** perder dado: cada pedido, comanda e pagamento persistido integralmente.
- **Não** subordinar a inteligência à operação.
- **Não** improvisar UI fora do `DESIGN.md`.
- **Não** usar cor semântica (`--ok`, `--danger`, `--warn`) fora de Bartender/Caixa.
- **Não** usar hex cru no componente — sempre token CSS.
- **Não** fazer migrations destrutivas sem backup explícito.

---

## 17. Em caso de dúvida

**Hierarquia de decisão:**
1. Os 12 Princípios (seção 2 deste documento)
2. `docs/negocio.md` — estratégia de negócio
3. `DESIGN.md` — decisões visuais
4. `AGENTS.md` — regras técnicas do Next.js desta versão
5. Se não estiver em nenhum dos acima: parar e perguntar. Não improvise estratégia no código.

**A pergunta que resolve a maioria dos casos:**
> *"Isso aumenta a capacidade do dono de tomar decisão de dinheiro?"*

Se sim → prioriza. Se não → opera ou descarta.
