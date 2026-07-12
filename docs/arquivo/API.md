# SUPERBAR — API Documentation

**Versão:** 1.0  
**Data:** Junho 2026  
**Tipo:** Next.js Server Actions (não REST — chamadas diretas de Client/Server Components)

> Todas as mutations do SUPERBAR são **Server Actions** definidas em `src/lib/*/actions.ts`.  
> Não há REST API pública. O cliente chama actions diretamente via React.

---

## Convenções

### Autenticação
Todas as actions protegidas chamam `getCurrentBar()` internamente. Se o usuário não está autenticado ou não pertence ao bar, retornam `{ error: "Não autenticado." }`.

### Retorno padrão
```typescript
// Sucesso
{ ok: true }
// Sucesso com dados
{ ok: true, pedidoId: string }
// Erro
{ error: string }
// Sem retorno (void) — apenas para mutations simples sem feedback crítico
```

### Revalidação
Actions que modificam dados chamam `revalidatePath()` antes de retornar, forçando o Next.js a re-renderizar as Server Components afetadas.

---

## Módulo: Operação do Bartender
**Arquivo:** `src/lib/bartender/actions.ts`

---

### `abrirComanda`
Abre uma nova comanda para uma mesa ou balcão.

```typescript
abrirComanda(
  mesaId: string | null,
  totalPessoas?: number,
  identificador?: string,
  nomeCliente?: string
): Promise<{ id: string } | { error: string } | null>
```

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `mesaId` | `string \| null` | UUID da mesa, ou `null` para balcão |
| `totalPessoas` | `number?` | Número de pessoas na mesa |
| `identificador` | `string?` | Identificador livre (nome, cartão, "Mesa 3 P2") |
| `nomeCliente` | `string?` | Nome do cliente |

**Pré-condições:** turno aberto no bar.  
**Retorno:** `{ id }` com o UUID da comanda criada.

---

### `buscarComandaPorCartao`
Busca comanda aberta pelo identificador (cartão ou QR) no turno atual.

```typescript
buscarComandaPorCartao(identificador: string): Promise<string | null>
```

**Retorno:** UUID da comanda se encontrada, `null` se não existe.

---

### `adicionarItem`
Adiciona um produto a uma comanda (cria um `comanda_item`).

```typescript
adicionarItem(
  produtoId: string,
  comandaId: string,
  varianteId?: string | null,
  varianteName?: string | null
): Promise<void>
```

Busca o preço do produto ou variante no momento da inserção (snapshot de preço).

---

### `removerItem`
Cancela um item de comanda (não deleta — muda status para `cancelado`).

```typescript
removerItem(itemId: string, comandaId: string): Promise<void>
```

---

### `fecharComanda`
Muda status da comanda para `aguardando_pagamento`.

```typescript
fecharComanda(comandaId: string): Promise<{ ok: true } | { error: string }>
```

---

### `cancelarComanda`
Cancela uma comanda aberta.

```typescript
cancelarComanda(comandaId: string): Promise<{ ok: true } | { error: string }>
```

---

### `criarPedido`
Persiste o carrinho do bartender como um `pedido` + `comanda_items` em uma única operação.

```typescript
criarPedido(
  comandaId: string,
  itens: CartItem[]
): Promise<{ ok: true; pedidoId: string } | { error: string }>
```

```typescript
interface CartItem {
  produto_id: string;
  variante_id?: string | null;
  variante_nome?: string | null;
  quantidade: number;
  preco: number;
}
```

**Pré-condições:** turno aberto, `itens.length > 0`.  
**Efeito:** cria 1 registro em `pedidos` + N registros em `comanda_items` (um por unidade).

---

### `iniciarPedido`
Bartender inicia o preparo. Muda status: `recebido` → `preparando`.

```typescript
iniciarPedido(pedidoId: string): Promise<void>
```

---

### `entregarPedido`
Bartender entrega o pedido. Chama `fn_entregar_pedido()` via RPC.

```typescript
entregarPedido(pedidoId: string): Promise<{ ok: true; alertas: EstoqueAlerta[] } | { error: string }>
```

```typescript
interface EstoqueAlerta {
  ingrediente_id: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
}
```

**Efeito (dentro do RPC, em transação única):**
1. Atualiza `pedidos.status` → `entregue`
2. Para cada `comanda_item` ativo do pedido:
   - Busca receita do produto
   - Cria `ingrediente_movimentos` (tipo `venda`, quantidade negativa)
   - Decrementa `ingredientes.estoque_atual`
3. Retorna alertas de estoque abaixo do mínimo

**Produtos sem receita:** sem erro, sem baixa.

---

### `atenderChamada`
Marca uma chamada de atendimento como atendida.

```typescript
atenderChamada(chamadaId: string): Promise<void>
```

---

## Módulo: Equipe
**Arquivo:** `src/lib/equipe/actions.ts`

---

### `adicionarMembro`
Adiciona membro diretamente à equipe — sem convite, sem email, sem auth obrigatório.

```typescript
adicionarMembro(
  _prev: AdicionarState,
  formData: FormData
): Promise<AdicionarState>

type AdicionarState = { error?: string; ok?: boolean } | null
```

**FormData esperado:**

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | Primeiro nome |
| `sobrenome` | string | Sobrenome (opcional) |
| `role` | BarRole | `gerente \| bar_manager \| bartender \| garcom \| caixa` |

**Efeito:** INSERT em `bar_members` com `user_id = NULL` para staff operacional.  
**Permissão:** dono ou gerente.

---

### `alterarRole`
Altera o papel de um membro.

```typescript
alterarRole(membroId: string, novoRole: BarRole): Promise<void>
```

**Permissão:** dono ou gerente.

---

### `desativarMembro`
Remove o acesso de um membro (não deleta o registro).

```typescript
desativarMembro(membroId: string): Promise<void>
```

---

### `reativarMembro`
Restaura o acesso de um membro desativado.

```typescript
reativarMembro(membroId: string): Promise<void>
```

---

### `removerMembro`
Remove permanentemente um membro da equipe.

```typescript
removerMembro(membroId: string): Promise<{ ok: true } | { error: string }>
```

**Permissão:** dono apenas.

---

## Módulo: Turnos
**Arquivo:** `src/lib/turnos/actions.ts`

---

### `abrirTurno`
Abre um novo turno para o bar.

```typescript
abrirTurno(): Promise<{ ok: true } | { error: string }>
```

**Pré-condição:** nenhum turno aberto no bar.  
**Permissão:** dono ou gerente.

---

### `fecharTurno`
Fecha o turno atual.

```typescript
fecharTurno(): Promise<{ ok: true } | { error: string }>
```

**Permissão:** dono ou gerente.

---

## Módulo: Cardápio
**Arquivo:** `src/lib/cardapio/actions.ts`

---

### Produtos

```typescript
criarProduto(formData: FormData): Promise<{ ok: true } | { error: string }>
editarProduto(produtoId: string, formData: FormData): Promise<{ ok: true } | { error: string }>
deletarProduto(produtoId: string): Promise<void>
```

---

### Variantes

```typescript
criarVariante(produtoId: string, formData: FormData): Promise<{ ok: true } | { error: string }>
editarVariante(varianteId: string, formData: FormData): Promise<{ ok: true } | { error: string }>
deletarVariante(varianteId: string): Promise<void>
```

---

### Categorias

```typescript
criarCategoria(formData: FormData): Promise<{ ok: true } | { error: string }>
editarCategoria(categoriaId: string, formData: FormData): Promise<{ ok: true } | { error: string }>
deletarCategoria(categoriaId: string): Promise<void>
```

---

## Módulo: Mesas
**Arquivo:** `src/lib/mesas/actions.ts`

```typescript
criarMesa(formData: FormData): Promise<{ ok: true } | { error: string }>
editarMesa(mesaId: string, formData: FormData): Promise<{ ok: true } | { error: string }>
deletarMesa(mesaId: string): Promise<void>
```

---

## Módulo: Caixa
**Arquivo:** `src/lib/caixa/actions.ts` (ou `bartender/actions.ts`)

### `registrarPagamento`

```typescript
registrarPagamento(
  comandaId: string,
  valor: number,
  metodo: PagamentoMetodo
): Promise<{ ok: true } | { error: string }>

type PagamentoMetodo = "pix" | "credito" | "debito" | "dinheiro" | "cortesia"
```

**Efeito:** INSERT em `pagamentos`, UPDATE em `comandas.status` → `paga`.  
**Permissão:** dono, gerente ou caixa.

---

## Módulo: Onboarding
**Arquivo:** `src/lib/onboarding/actions.ts`

### `criarBar`
Cria o bar e vincula o usuário como dono. Usa `adminClient` (bypass RLS).

```typescript
criarBar(formData: FormData): Promise<{ ok: true; barId: string } | { error: string }>
```

---

## Queries principais
**Arquivos:** `src/lib/dashboard/queries.ts`, `src/lib/equipe/queries.ts`

### `getCurrentBar`
Context do usuário atual — bar selecionado, role, IDs.

```typescript
getCurrentBar(): Promise<{
  bar: Bar;
  userId: string;
  memberId: string;   // bar_members.id — identidade operacional para atribuição
  userNome: string;
  userEmail: string;
  role: BarRole;
} | null>
```

Usado em toda Server Action como primeira linha de autenticação.

---

### `getTurnoAtual`
Retorna o turno aberto do bar, ou `null` se não há turno.

```typescript
getTurnoAtual(barId: string): Promise<Turno | null>
```

---

### `getMembrosEquipe`
Retorna todos os membros do bar com stats de vendas dos últimos 30 dias.

```typescript
getMembrosEquipe(barId: string): Promise<MembroEquipe[]>

interface MembroEquipe {
  id: string;
  userId: string | null;
  nome: string;
  role: BarRole;
  ativo: boolean;
  desde: string;
  totalComandas: number;
  totalVendas: number;
  ticketMedio: number;
}
```

---

### `getInsightsOperacao`
Dados de operação para o dashboard: pico de horário, métodos de pagamento, tempo médio de preparo.

```typescript
getInsightsOperacao(barId: string, turnoId: string): Promise<InsightsOperacao>
```

---

## RPC do banco

### `fn_entregar_pedido`
Motor de entrega e baixa de estoque. Chamado via `supabase.rpc()`.

```typescript
// Chamada
const { data, error } = await supabase.rpc("fn_entregar_pedido", {
  p_pedido_id: pedidoId,
  p_user_id:   userId,    // profiles.id — para usuários com auth
  p_member_id: memberId,  // bar_members.id — para todos (opcional, DEFAULT NULL)
});

// Retorno de sucesso
{
  ok: true,
  alertas: [
    {
      ingrediente_id: string,
      nome: string,
      estoque_atual: number,
      estoque_minimo: number
    }
  ]
}

// Retorno de erro
{
  ok: false,
  error: "Pedido não encontrado, status inválido ou acesso negado."
}
```

**Pré-condição:** `pedidos.status = 'preparando'`, usuário é membro do bar.  
**Transação:** atômica — se qualquer etapa falhar, tudo reverte.

---

## Tipos principais

```typescript
// src/types/database.ts

type BarRole = "dono" | "gerente" | "bar_manager" | "bartender" | "garcom" | "caixa";

type ComandaStatus = "aberta" | "aguardando_pagamento" | "paga" | "cancelada";

type PedidoStatus = "recebido" | "preparando" | "entregue";

type PagamentoMetodo = "pix" | "credito" | "debito" | "dinheiro" | "cortesia";

interface Bar { id: string; nome: string; slug: string; configuracoes: BarConfig; }

interface Comanda {
  id: string; bar_id: string; turno_id: string; mesa_id: string | null;
  bartender_id: string; identificador: string | null; nome_cliente: string | null;
  status: ComandaStatus; total: number; aberta_em: string; fechada_em: string | null;
}

interface Pedido {
  id: string; bar_id: string; turno_id: string; comanda_id: string;
  status: PedidoStatus; criado_em: string; iniciado_em: string | null; entregue_em: string | null;
}

interface CartItem {
  produto_id: string; variante_id?: string | null; variante_nome?: string | null;
  quantidade: number; preco: number;
}
```
