# Auditoria do app — punch-list para "deixar redondo"

_Varredura estática de 13/07/2026. Objetivo: trocar o conserto reativo (tela por tela) por uma lista finita + guarda-corpos automáticos, pra parar o loop de "toda hora um problema novo"._

Prioridade: **P0** = quebra ou dinheiro errado (bloqueia vender) · **P1** = inconsistência sistêmica (o loop visual) · **P2** = polimento.

---

## P0 — Quebra / dinheiro errado

1. **Dashboard lê tabela de estoque LEGADA.** `getAlertasEstoque` (`lib/dashboard/queries.ts:113`) e mais 2 pontos (`:332`, `:337`) leem `estoque`/`estoque_movimentos` — tabela vazia. Os **alertas de reposição do dono e o sino de alertas não refletem os insumos reais** (que vivem em `ingredientes`). Mesma deriva já corrigida na tela de Estoque; o dashboard ficou pra trás.
   → Religar pra `ingredientes` / `ingrediente_movimentos`.

2. **Contas de dinheiro sem teste.** As fórmulas que definem lucro não têm rede: `baseDoItem` (custo/ml na NF-e), `calcularCmv`, `calcularCoberturaReceita`, `getVariacaoCusto`, conversão de estoque pra base. O bug "6 ml" passou exatamente aqui, sem nada avisar.
   → Testes unitários (Vitest, já instalado) com números reais de bar.

3. **Erros engolidos em silêncio.** 4 `catch {}` vazios + ~42 queries que ignoram `error`. A maioria em leitura (ok), mas as de **escrita** podem falhar caladas — foi o que aconteceu no `confirmarNfe` (a nota não entrava e a tela não dizia nada).
   → Revisar as de escrita: sempre tratar `error` e mostrar causa.

4. **Resíduo `/demo` quebrando o type-check.** `tsc` acusa `Cannot find module '.../src/app/demo/page.js'` — rota que não existe mais, mas ainda referenciada. É o único erro de tipos hoje; some mascarando erros reais.
   → Limpar o resíduo / regenerar tipos.

---

## P1 — Inconsistência sistêmica (a raiz do loop visual)

5. **57 botões "na mão" em ~40 arquivos.** Pill com `borderRadius: 999` + padding próprio, fora do `<Button>` do DS. É a causa real do "toda hora um botão de altura diferente" — não dá pra acertar caso a caso. Concentrados em: `bartender/*` (grande), `admin/*`, `cardapio/*`, `dashboard/settings/*`, `dashboard/operacao-ao-vivo`, `menu/*`.
   → Migração em lote pro `<Button>` + regra de lint que **proíbe** o padrão voltar (ver guarda-corpos).

6. **28 usos de `var(--font-mono)`.** Memória/DS mandam usar `--font-sans`. Espalha inconsistência tipográfica em números.
   → Trocar em lote por `fontVariantNumeric: "tabular-nums"` + font-sans.

7. **Legado morto de estoque.** Depois do item 1, a tabela `estoque`/`estoque_movimentos` e `getMovimentosEstoque` (`lib/estoque/queries.ts:222`) provavelmente ficam sem uso.
   → Remover (código e, num segundo momento, as tabelas) pra ninguém reusar por engano.

---

## P2 — Polimento

8. **Espaçamento fora da escala base-4.** Vários paddings/gaps em 9/10/11/14 px espalhados (muitos em inputs/modais). Precisa de uma passada por arquivo (não bloqueia venda).
9. **Cor hard-coded.** 1 hex fora de token no dashboard/estoque/cardápio; mais na landing (marketing) — menos crítico.

---

## Guarda-corpos (pra não voltar) — frente 2

Estes são o que muda o jogo: transformam "meu olho encontra" em "a máquina barra antes de subir".

- **ESLint — proibir botão na mão.** Regra `no-restricted-syntax` barrando `<button>` com `borderRadius: 999`/`rounded-full`; obriga `<Button>`. Idem alertas para `var(--font-mono)` e hex hard-coded.
- **Smoke test de rotas (Playwright, já instalado).** Abrir cada rota do dono autenticado e falhar se aparecer error boundary, tela branca ou erro no console. Pega rota quebrada antes de você clicar.
- **Testes das contas (Vitest, já instalado).** Trava as fórmulas de dinheiro do item 2.
- **CI verde obrigatório.** `typecheck + lint + test + build` tem que passar pra fazer merge. Hoje passa quase tudo (só o resíduo `/demo`).
- **Seed realista.** Dado-semente com quantidades/custos plausíveis, pra demo não mostrar "6 ml".

---

## Sequência sugerida

1. **P0** inteiro (correção de dinheiro/quebra) — é o que te deixa seguro pra mostrar pra um bar.
2. **Guarda-corpos** (lint do botão + smoke test + testes das contas) — trava o que foi consertado.
3. **P1** em lote (botões, font-mono, legado) com a rede de segurança já ligada.
4. **P2** por último.

Ao fim disso: os problemas ficam raros e o sistema te avisa antes do cliente. Não é "zero bug pra sempre" — é sair do pinga-pinga.
