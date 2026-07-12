# Auditoria — Dashboard do Dono (UI/UX · código · consistência)

> Base: varredura do código em `src/app/dashboard/**` e `src/components/{dashboard,mesas,clientes,equipe,estoque,cardapio}`, cruzada com `DESIGN.md`, `src/app/globals.css` e a paleta do Figma.
> Data: fechamento da rodada do dashboard do dono.

## Resumo executivo

O dashboard está **sólido e consistente na maioria das telas** — 6 das 8 telas já seguem o mesmo padrão (header 18px Medium + subtítulo inline + divisória, cards r16/r24, botões pill, gaps base-4, tudo em Inter, componentes server-side). Os problemas restantes são **dívidas pontuais e de documentação**, não estruturais:

- **`DESIGN.md` está desatualizado** — descreve o sistema antigo (border `#2C2C2E`, cards radius 20, radius tokens 4/8/12). Precisa refletir o que o código realmente faz.
- **2 telas ficaram fora do padrão novo**: `inteligencia` e `turnos/[id]` (detalhe do turno) ainda usam header legado, `font-mono` e raios antigos.
- **`--fg-subtle` invertido** em relação ao Figma (já anotado no DESIGN.md, não resolvido).
- **Tema claro (`:root`)** ainda com cores antigas (não usado, mas inconsistente).

Nada disso quebra a experiência hoje. É acabamento e higiene.

---

## 1. Cores & tokens (globals.css × Figma)

O tema **dark** (o que o produto usa) bate com a paleta do Figma:

| Token código | Valor | Figma (neutral/brand) | Status |
|---|---|---|---|
| `--bg` | `#111113` | neutral 950 | ✅ |
| `--bg-card` / `--bg-elevated` | `#1C1C1E` | neutral 900 | ✅ |
| `--bg-card-hi` / `--bg-hover` | `#242426` | neutral 850 | ✅ |
| `--border-strong` | `#383839` | neutral 700 | ✅ |
| `--fg` | `#FFFFFF` | neutral 0 | ✅ |
| `--fg-muted` | `#898989` | neutral 500 | ✅ |
| `--accent` | `#FF3500` | orange 500 | ✅ |
| `--accent-bright` | `#D92D00` | orange 600 | ✅ |
| `--warn` | `#F59E0B` | amber 500 | ✅ |
| `--ok` | `#22C55E` | green 500 | ✅ |
| `--danger` | `#FF3B30` | red 500 | ✅ |

Divergências:

- **`--fg-subtle: #6B6B75`** — o Figma tem `text/subtle = #C7C7C7` (neutral 300), que é **mais claro** que o muted. No código está **mais escuro** que o muted → hierarquia invertida. Decisão pendente: alinhar o código ao Figma (`#C7C7C7`) **ou** corrigir o Figma. Hoje diverge.
- **`--border: #222226`** — não existe na escala neutral do Figma (o mais próximo é 850 `#242426`). É um divisor mais sutil, proposital, mas fora do sistema.
- **Tema claro (`:root`)** ainda com `--accent-bright #FF5A2C`, `--danger #DC2626`, `--ok #16A34A`, `--accent-fg #000000` — valores antigos, não-Figma. Não afeta o dashboard (dark), mas se um dia o tema claro for usado, sai errado.

## 2. Tipografia

- **Inter em tudo** ✅ — `--font-mono` e `--font-display` são **alias de `--font-sans` (Inter)** no globals.css. Ou seja, mesmo onde o código escreve `font-mono`, renderiza Inter.
- **Porém**: ainda há **27 usos de `var(--font-mono)`** espalhados (principalmente `turnos/[id]` e helpers do `page.tsx`). Visualmente inócuo, mas é code smell e contradiz a intenção "Inter only". Limpar.

## 3. DESIGN.md — está desatualizado (precisa correção)

Evidências de contradição com o código atual:

- Linha 259 e 283: *"Todo card usa `border #2C2C2E`, `borderRadius 20px`"* → o código usa `var(--border)` e **radius 16/24** (Figma). `#2C2C2E` é borda do sistema antigo.
- Linhas 77–79: radius tokens `sm 4 / md 8 / lg 12` → as telas novas usam **16 (cards) e 24 (hero/cards grandes)**. O próprio DESIGN.md admite na linha 331 que "radius não foi unificado".
- Seção de botões **já foi corrigida** nesta rodada (pill 9999 + tabela de variantes) ✅.

Ação: reescrever as seções de **card** e **radius** do DESIGN.md pra refletir 16/24 e `var(--border)`, e resolver a nota do `fg-subtle`.

## 4. Consistência entre telas

**Header (18px Medium + subtítulo inline + divisória `border-strong`):**

| Tela | Status |
|---|---|
| Principal (Operação ao vivo) | ✅ |
| Turnos | ✅ |
| Relatórios | ✅ |
| Cardápio | ✅ |
| Estoque | ✅ |
| Clientes | ✅ |
| Equipe | ✅ |
| **Inteligência** | ❌ header legado (`H1/SUBTITLE` do `@/lib/ui`) |
| **Turnos / [id]** (detalhe) | ❌ `fontSize 22` + `font-mono` |

**Cards:** raios em uso: `24` (hero/cards grandes) e `16` (KPI/insight/status) ✅ como padrão; mas ainda restam `12` e `20` legados em pontos isolados (limpar). Inputs/badges em `8` — ok.

**Botões:** ✅ padronizados como **pill** nesta rodada — componente `Button`, `BTN_PRIMARY/SECONDARY` (`@/lib/ui`) e os botões inline de cardápio/mesas/clientes/equipe. (As telas fora do dono — bartender/caixa/admin — ainda não foram varridas botão-a-botão.)

**Gaps/espaçamento:** base-4 consistente (`8/12/16/24`, um `32`) ✅.

## 5. Estrutura & código & performance

- **Todas as 8 telas do dashboard são Server Components** ✅ — dados buscados no servidor, só as ilhas interativas (tabelas editáveis, seletor de período, AI input) são client. Bom pra performance e SEO/streaming.
- **Padrão de dados**: cada tela usa queries dedicadas (`getKpisTurno`, `getEstoque`, `getRankingProdutos`, etc.) e formatação BRL centralizada (`currency`/`fmt`). Consistente.
- **Simulação de demo** isolada em blocos marcados (`SIM` no `page.tsx` principal; `simMesa`/`simStats` em mesas) — ✅ com ponto de troca claro pra dado real. **Atenção**: garantir que isso não vaze pra produção sem a virada (Princípio 9).
- **Imagens**: `next/image` na maioria; avatares e logo ok.
- **Acessibilidade**: faltam `aria-label` em vários botões só-ícone (ações de linha em cardápio/estoque/clientes). Pontual.

## 6. Recomendações priorizadas

**P0 — fecham a consistência do dashboard do dono:**
1. Migrar **`inteligencia`** e **`turnos/[id]`** pro header/tipografia padrão (18px, sem `font-mono`, radius 16/24).
2. Atualizar **DESIGN.md** (card border/radius, radius tokens, nota `fg-subtle`) pra virar fonte de verdade de novo.

**P1 — higiene:**
3. Resolver **`--fg-subtle`** (alinhar ao Figma `#C7C7C7` ou corrigir o Figma — decisão de produto).
4. Trocar os **27 `var(--font-mono)`** por `var(--font-sans)` (ou remover — é alias).
5. Eliminar raios legados **12/20** remanescentes → 16/24.

**P2 — quando pegar as outras superfícies:**
6. Varredura botão-a-botão em **bartender/caixa/admin** (pill).
7. Alinhar o **tema claro** (`:root`) aos valores Figma, ou remover se nunca for usado.
8. `aria-label` nos botões só-ícone.

---

### Veredito

O dashboard do dono está **pronto e consistente** no essencial. O que falta é **acabamento** (2 telas atrasadas + doc desatualizada + 2–3 tokens a alinhar), não retrabalho estrutural. Fechando os P0, o conjunto fica coeso de ponta a ponta.
