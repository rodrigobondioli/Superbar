# Plano — Inteligência de Custo (ficha técnica com IA)

> Como o SUPERBAR sai de "custo é um número que o dono digita" para "custo real, calculado a partir do que o bar compra, sugerido pela IA e confirmado pelo dono". Mexe direto no **Princípio 10** (custo cadastrado = inteligência real), **12** (dado limpo) e **9** (não prometer o que não existe).

---

## 1. O que JÁ existe (não reinventar)

**Schema (sólido):**
- `produtos` — tem `custo` (nullable): custo direto por produto.
- `produto_variantes` — `nome`, `preco`, `custo` (nullable), `ordem`, `ativo`. Variante tem preço **e custo próprios**.
- `comanda_items` — rastreia `variante_id` + `variante_nome`.
- `ingredientes` — o **SKU real** do bar: `nome`, `unidade` (un/ml/l/g/kg), `estoque_atual`, `estoque_minimo`, `custo_atual` (custo por unidade base). Ex: cachaça em ml, custo por ml.
- `receitas` — a **ficha**: `produto_id` + `ingrediente_id` + `quantidade`. `UNIQUE(produto_id, ingrediente_id)`.
- `ingrediente_movimentos` — audit trail; baixa de estoque na venda.
- `fn_entregar_pedido()` — baixa transacional lendo `receitas` do produto.

**App:**
- Onboarding wizard: criar-bar → importar → preview → custos.
- Import de cardápio: `/api/importar-cardapio` (xlsx/csv, Claude Haiku mapeia colunas).
- Telas: `dashboard/cardapio`, `dashboard/estoque`.

## 2. As LACUNAS (o que falta pra estratégia que fechamos)

1. **Ficha é por produto, não por variante.** `receitas.produto_id` não tem `variante_id`. Caipirinha de Vodka e de Morango compartilham a ficha do produto-pai → custo errado. `fn_entregar_pedido` também só lê por produto.
2. **A IA não explode drink em insumos.** O import só lê colunas de uma planilha (nome/preço/custo já prontos). Não pega "Caipirinha" e sugere *60ml cachaça + 1 limão + 2 açúcar*.
3. **Sem PDF.** Import só aceita xlsx/csv. 90% dos bares têm PDF.
4. **Sem checklist de clássicos** (Porta B).
5. **Sem flag de honestidade.** `custo` é um número solto, sem saber se é real (ficha confirmada), estimado (IA) ou inexistente. O dashboard não consegue ser honesto.
6. **Onboarding não constrói a ficha.** O passo "custos" grava `produtos.custo` direto — nunca cria `ingredientes`/`receitas`. O estoque não nasce dos drinks.

## 3. Decisões de arquitetura (a régua)

**Regra única de custo (fonte da verdade):**
> Custo do item = **se existe ficha de ingredientes (receitas), soma dela** (Σ quantidade × `ingredientes.custo_atual`); **senão, cai no custo direto** (`variante.custo` ?? `produto.custo`).

Isso reconcilia os dois caminhos sem quebrar o que existe:
- **Drink** → ficha de ingredientes (preciso, é o moat).
- **Item fechado** (coca, cerveja) → ficha de **1 linha** (o próprio insumo, custo = preço de compra unitário). Mesmo modelo, formato mínimo.
- **Comida/petisco** → **custo direto** por padrão (dono digita "~R$12"); ficha completa é opcional. Não viramos ERP de cozinha (**Princípio 6**).

**IA sugere estrutura, dono confirma custo.** A IA nunca inventa marca nem preço. Ela sugere o *papel* ("vodka", "limão") e a quantidade padrão. O dono amarra o SKU real (`ingredientes`) e o preço — uma vez, reusado em todos os drinks.

**Flag de honestidade.** Cada produto/variante ganha um status de ficha: `sem` | `sugerida` | `confirmada`. O dashboard só trata como margem real o que está `confirmada`; `sugerida` aparece etiquetado como estimativa; `sem` é margem cega. **Prefere silêncio a alerta incorreto.**

---

## 4. Fases

### Fase 0 — Reconciliar o modelo de custo (schema) ⟵ fundação
- Migration: `receitas` ganha `variante_id UUID NULL REFERENCES produto_variantes`. Novo `UNIQUE(produto_id, variante_id, ingrediente_id)` (variante_id null = ficha do produto-pai / comuns).
- Migration: `produtos` e `produto_variantes` ganham `custo_status TEXT CHECK (sem|sugerida|confirmada) DEFAULT 'sem'`.
- `fn_entregar_pedido`: se o item tem `variante_id` e existe receita da variante, usa ela; senão cai na do produto. Baixa correta por variante.
- Helper único `custoDoItem()` no app (regra da seção 3) — todo lugar que hoje lê `produto.custo` passa por ele.
- **Migração sem perda:** produtos com `custo` hoje continuam funcionando via fallback direto. Nada quebra.

### Fase 1 — IA explode drink → ficha sugerida
- Endpoint `POST /api/sugerir-ficha`: entrada `{ nome, base?, sabor? }` → saída `{ insumos: [{ papel, quantidade, unidade }] }`. Claude, marcado `sugerida`.
- Casamento: para cada papel, procurar `ingredientes` do bar por nome (fuzzy). Achou → vincula. Não achou → cria "insumo pendente" (sem preço), a preencher.
- Composição base+sabor: comuns (açúcar, gelo, lima) na ficha do produto-pai (`variante_id null`); slot destilado e slot fruta na ficha da variante. Custo da variante = comuns + destilado + fruta.

### Fase 2 — Onboarding: duas portas + estoque emergente
- **Porta A (importar):** estender `/api/importar-cardapio` pra aceitar **PDF** (extrair nomes+preços via Claude, dono revisa). Mantém xlsx/csv.
- **Porta B (checklist de clássicos):** lista curada de clássicos → dono marca os que tem → + autorais manuais.
- Ambas caem no mesmo passo: **IA explode cada drink → lista de insumos que o cardápio precisa** → dono precifica o SKU real de cada um (helper *pack→unidade*: "garrafa 750ml por R$34" → custo/ml). O `estoque` (`ingredientes`) nasce completo, sem sobra nem falta.
- Fecha marcando fichas como `confirmada`. Termina mostrando **margem por drink** — o "aha".

### Fase 3 — Ficha por variante + edição no cardápio
- Em `dashboard/cardapio`: editar ficha por produto **e por variante**, custo/margem calculada ao vivo, status visível. Sobrescrever SKU num drink específico (a premium) quando precisar.

### Fase 4 — Dashboard honesto
- Cada drink: margem **real** (confirmada) / **estimada** (sugerida, etiquetada) / **cega** (sem ficha). Nunca mostrar estimativa como verdade (**Princípio 9**).

---

## 5. Ordem de execução

Fase 0 é a fundação — habilita tudo e não quebra nada (fallback direto). Depois 1 (a inteligência nova), 2 (a experiência), 3 e 4 (edição e leitura honesta). Cada fase entrega valor sozinha.

## 6. Linhas que não se cruzam (relembrar em cada PR)

- IA **nunca** inventa custo/marca — só estrutura e quantidade padrão (dono confirma).
- Custo estimado **nunca** entra na margem sem a etiqueta "estimado".
- Nada de estoque de cozinha / sub-receitas — medimos margem, não gerenciamos cozinha.
- Migração sem perder o `custo` que os bares já têm.
