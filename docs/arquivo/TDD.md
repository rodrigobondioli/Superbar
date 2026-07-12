# SUPERBAR — Technical Design Document

**Versão:** 1.0  
**Data:** Junho 2026  
**Stack:** Next.js 15 (App Router) · Tailwind CSS · Supabase · Vercel

---

## 1. Visão geral da arquitetura

O SUPERBAR é uma **PWA multi-tenant** rodando inteiramente na nuvem. Sem instalação. Sem servidor próprio. Supabase como backend completo (Postgres + Auth + Realtime + Storage).

```
Browser / iPad PWA
      │
      ▼
  Next.js (Vercel)
  ├── App Router (Server Components por padrão)
  ├── Server Actions (mutations e side effects)
  └── Client Components (interatividade, Realtime)
      │
      ▼
  Supabase
  ├── PostgreSQL (dados + RLS)
  ├── Auth (JWT, magic link, email/password)
  ├── Realtime (WebSocket sobre Postgres CDC)
  └── Storage (imagens de produto, logo)
```

**Multi-tenant:** cada bar é um tenant isolado. O isolamento é garantido por Row Level Security no DB — não pela aplicação. Nenhuma query de tenant A pode vazar para tenant B, independente de bug no app.

---

## 2. Stack e versões

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | Next.js 15 (App Router) | Consulte `AGENTS.md` antes de usar APIs do Next |
| Estilização | Tailwind CSS + tokens CSS custom | `DESIGN.md` é o contrato visual |
| Banco de dados | Supabase (PostgreSQL 15) | RLS em todas as tabelas |
| Auth | Supabase Auth | JWT, cookie-based session |
| Realtime | Supabase Realtime | CDC via WebSocket, filtrado por `bar_id` |
| Deploy | Vercel | Git push → deploy automático |
| Storage | Supabase Storage | Imagens de produto e logo do bar |

---

## 3. Estrutura de diretórios

```
src/
├── app/                        # Rotas (App Router)
│   ├── (operacional)/          # Route group — bartender, garçom, caixa, mesa
│   │   ├── bartender/          # /bartender — tabs Mesas + Produção
│   │   ├── garcom/[comandaId]/ # /garcom/:id — comanda individual
│   │   ├── caixa/              # /caixa — fechamento de comandas
│   │   └── mesa/[mesaId]/      # /mesa/:id — QR flow do cliente
│   ├── dashboard/              # /dashboard — dono/gerente
│   │   ├── cardapio/
│   │   ├── equipe/
│   │   ├── mesas/
│   │   ├── turnos/
│   │   └── caixa/
│   ├── login/
│   ├── cadastro/
│   ├── onboarding/
│   └── menu/                   # /menu — cardápio público via QR
│
├── components/                 # Componentes React
│   ├── bartender/              # producao-tab.tsx, produto-grid.tsx, etc.
│   ├── equipe/                 # convidar-form.tsx, equipe-membros.tsx
│   ├── cardapio/
│   ├── mesas/
│   └── ui/                     # toaster.tsx, etc.
│
├── lib/                        # Lógica de negócio
│   ├── supabase/               # client.ts, server.ts, admin.ts
│   ├── bartender/actions.ts    # Server Actions de operação
│   ├── dashboard/queries.ts    # getCurrentBar(), getInsightsOperacao()
│   ├── equipe/actions.ts       # adicionarMembro, alterarRole, etc.
│   ├── equipe/queries.ts       # getMembrosEquipe()
│   ├── cardapio/actions.ts
│   ├── mesas/actions.ts
│   ├── turnos/actions.ts
│   ├── onboarding/actions.ts
│   └── ui.ts                   # Tokens de UI compartilhados
│
├── types/
│   └── database.ts             # Tipos TypeScript do schema
│
public/
supabase/
├── migrations/                 # Migrations SQL em ordem cronológica
└── (schema base em docs/schema.sql)
docs/
├── negocio.md                  # Fonte de verdade estratégica
├── schema.sql                  # Schema base
├── PRD.md                      # Este documento
├── TDD.md
├── SCHEMA.md
└── API.md
```

---

## 4. Padrões de código

### 4.1 Server Components vs Client Components

- **Padrão:** Server Components. Buscam dados diretamente, sem `useEffect` + fetch.
- **Client Components** (`"use client"`) apenas quando há interatividade real: estado local, eventos de usuário, WebSocket (Realtime).
- **Nunca** `useState` + `useEffect` + `fetch` para dados que podem ser server-rendered.

### 4.2 Server Actions

Todas as mutações são **Server Actions** em `src/lib/*/actions.ts`:

```typescript
"use server";

export async function minhaAction(dados: Dados) {
  const current = await getCurrentBar(); // auth + bar context
  if (!current) return { error: "Não autenticado." };
  
  const supabase = await createClient();
  const { error } = await supabase.from("tabela").insert({ ... });
  if (error) return { error: error.message };
  
  revalidatePath("/rota");
  return { ok: true };
}
```

Regras:
- Sempre verificar `getCurrentBar()` antes de qualquer write
- Sempre checar e retornar `error` do Supabase — nunca swallow silencioso
- `revalidatePath()` após writes que afetam Server Components
- Nunca usar `admin` client para operações que o usuário autenticado pode fazer

### 4.3 Supabase Client

Três clientes, cada um com seu uso:

| Cliente | Arquivo | Usa | Quando usar |
|---|---|---|---|
| `createClient()` | `lib/supabase/server.ts` | Cookie session | Server Components e Server Actions |
| `createClient()` | `lib/supabase/client.ts` | Cookie session (browser) | Client Components, Realtime |
| `createAdminClient()` | `lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS — onboarding, migrations only |

**Nunca** usar `adminClient` em fluxo normal de usuário.

### 4.4 Tipos TypeScript

Todos os tipos do schema estão em `src/types/database.ts`. Ao adicionar coluna ou tabela:
1. Atualizar `database.ts`
2. Usar o tipo no código — nunca `any`

### 4.5 Tokens de UI

Todos os tokens visuais estão em `src/lib/ui.ts`. Não improvise CSS inline. Consulte `DESIGN.md` antes de criar ou alterar qualquer componente visual.

---

## 5. Multi-tenant e isolamento

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. O isolamento funciona assim:

```sql
-- Função helper — roda como SECURITY DEFINER para evitar recursão
CREATE FUNCTION public.is_bar_member(p_bar_id UUID, p_roles bar_role[] DEFAULT NULL)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM bar_members
    WHERE bar_id = p_bar_id
      AND user_id = auth.uid()
      AND ativo = true
      AND (p_roles IS NULL OR role = ANY(p_roles))
  );
$$;
```

Padrão das políticas:
- **SELECT:** qualquer membro ativo do bar
- **INSERT/UPDATE:** membro ativo (em tabelas operacionais) ou dono/gerente (em tabelas administrativas)
- **DELETE:** dono apenas

### `bar_id` denormalizado

Tabelas que participam de Realtime ou queries frequentes têm `bar_id` direto (mesmo que acessível via JOIN). Isso evita joins no filtro do Realtime e melhora performance de RLS.

Exemplo: `comanda_items.bar_id` — denormalizado intencionalmente.

### Staff operacional sem auth

Bartenders, garçons e caixas têm `user_id = NULL` em `bar_members`. Eles são selecionados localmente no device ("Quem é você?"). Isso elimina fricção de senha para staff de turno e foi uma decisão deliberada de produto (Princípio 11).

Implicação: `is_bar_member()` retorna `false` para esses usuários. Operações em nome do staff operacional são executadas com o contexto do usuário logado (dono/gerente) ou via `SECURITY DEFINER` functions.

### Atribuição operacional (migration 20260624)

O problema do modelo acima: campos de atribuição como `bartender_id`, `adicionado_por`, `cancelado_por` apontavam para `profiles(id)`, que exige auth. Staff sem auth nunca seria atribuído — dados de "quem vendeu mais" ficariam vazios.

**Solução:** colunas `*_member_id` paralelas apontando para `bar_members(id)` em todas as tabelas operacionais:

```
comandas.aberta_por_member_id
comanda_items.adicionado_por_member_id
comanda_items.cancelado_por_member_id
pedidos.criado_por_member_id
pedidos.iniciado_por_member_id
pedidos.entregue_por_member_id
pagamentos.processado_por_member_id
ingrediente_movimentos.criado_por_member_id
```

`getCurrentBar()` agora retorna `memberId: string` (o `bar_members.id` do usuário autenticado). Todas as server actions preenchem tanto os campos legados (`profiles.id`) quanto os novos (`member_id`). As colunas legadas permanecem para backward compat.

**PIN (Fase 2):** `bar_members.pin TEXT(4)` adicionado. A tela "Quem é você?" vai exibir lista de membros e pedir PIN para confirmar. O device resolve o `bar_members.id` localmente e o passa como parâmetro explícito para as server actions. Isso dará rastreabilidade completa para staff sem auth.

---

## 6. Realtime

Supabase Realtime usa CDC (Change Data Capture) sobre PostgreSQL. O cliente se inscreve em uma tabela com um filtro:

```typescript
supabase
  .channel("pedidos-fila")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "pedidos",
    filter: `bar_id=eq.${barId}`,
  }, (payload) => { /* handler */ })
  .subscribe();
```

Tabelas com Realtime habilitado:
- `pedidos` — fila de produção do bartender
- `comandas` — status das mesas
- `comanda_items` — itens em tempo real
- `chamadas` — sinal de atendimento (mesa → bartender)

**Importante:** o filtro `bar_id=eq.X` é aplicado no servidor — o banco não envia eventos de outros bares para o cliente. Mas o RLS é a garantia real; o filtro é otimização de rede.

---

## 7. Motor de estoque de ingredientes

### Fluxo completo

```
Bartender clica "Entregue" no pedido
  → Client Component chama Server Action entregarPedido(pedidoId)
      → Server Action chama supabase.rpc("fn_entregar_pedido", { p_pedido_id, p_user_id })
          → PostgreSQL (SECURITY DEFINER):
              1. Valida pedido (status = preparando, usuário é membro)
              2. UPDATE pedidos SET status = 'entregue'
              3. Para cada comanda_item ativo do pedido:
                 - Busca receita do produto
                 - Para cada ingrediente da receita:
                   * INSERT ingrediente_movimentos (tipo='venda', quantidade negativa)
                   * UPDATE ingredientes.estoque_atual -= quantidade
                   * Coleta alerta se estoque < mínimo
              4. Retorna { ok, alertas }
```

### Decisão de arquitetura: RPC, não trigger

A baixa de estoque é uma **transação de negócio explícita**, não um efeito colateral automático. Usar trigger tornaria o comportamento implícito e difícil de debugar. O RPC garante:
- Rastreabilidade (quem chamou, quando)
- Controle de erro no app
- Possibilidade de mockar em testes
- Alinhamento com o Princípio 2 (dado limpo via operação controlada)

### Produtos sem receita

Se um produto não tem receita cadastrada, nenhuma baixa ocorre e nenhum erro é gerado. O sistema funciona com configuração parcial — essencial para onboarding progressivo.

---

## 8. PWA e comportamento mobile

O produto é uma PWA (Progressive Web App):
- Instalável na home screen do iPad (bartender) e celular (dono)
- Sem app store — URL direta
- Safe area para notch/dynamic island: `env(safe-area-inset-top)` no layout operacional
- `(operacional)` route group tem layout próprio com safe area configurada

Prioridade de dispositivo:
- **Bartender:** iPad landscape — tela mais crítica (Princípio 11)
- **Dono:** celular / desktop — dashboard responsivo
- **Caixa:** tablet ou desktop

---

## 9. Variáveis de ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Apenas server-side, nunca exposto ao client

# App
NEXT_PUBLIC_APP_URL=            # URL base (ex: https://superbar.app)
```

---

## 10. Migrations

Todas as mudanças de schema ficam em `supabase/migrations/` com nome `YYYYMMDD_descricao.sql`.

Ordem atual:
1. `schema.sql` (base — rodar manualmente no Supabase)
2. `20240620_produto_variantes.sql`
3. `20240621_custo_produtos.sql`
4. `20240622_rls_policies.sql`
5. `20260622_pedidos.sql`
6. `20260623_bar_members_operacional.sql` — user_id nullable, coluna nome
7. `20260623_ingredientes_receitas.sql` — Camada 2 de inteligência

**Regra:** migration deve ser idempotente quando possível (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).

---

## 11. Decisões técnicas relevantes

| Decisão | Escolha | Motivo |
|---|---|---|
| ENUM vs TEXT+CHECK | TEXT+CHECK para `tipo` em movimentos | Adicionar novo tipo (waste, loss) sem migration |
| Trigger vs RPC para baixa de estoque | RPC explícito | Rastreabilidade, controle de erro, testabilidade |
| `bar_id` denormalizado | Sim, em tabelas operacionais | Performance de RLS e filtro Realtime |
| Staff sem auth | `user_id = NULL` em `bar_members` | Elimina fricção para operadores de turno |
| Atribuição por `bar_members.id` | Colunas `*_member_id` paralelas aos campos `profiles.id` legados | Staff sem auth tem `bar_members.id` mas não `profiles.id` — sem isso, dados de "quem vendeu" ficam vazios |
| PIN de 4 dígitos (Fase 2) | `bar_members.pin TEXT(4)` nullable | UX rápida de identificação no device sem auth real |
| `unit_cost` snapshot em movimentos | `custo_unitario` imutável no movimento | Histórico de custo real no tempo |
| Split de UI tokens | `src/lib/ui.ts` | Consistência visual sem improviso |
