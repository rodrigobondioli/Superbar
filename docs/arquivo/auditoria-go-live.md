# SUPERBAR — Auditoria Pré-Inauguração (SRE / Red Team / Integridade)

**Escopo:** código real do repositório `~/Developer/Superbar` (Next 16, React 19, Supabase/Postgres, sem gateway de pagamento — correto por Princípio 8).
**Cenário-alvo:** inauguração amanhã 20h — 200 clientes, 6 garçons, 2 bartenders, 1 caixa, 1 gerente, casa lotada.
**Método:** só reporto o que foi comprovado no código. O que não pude validar está marcado como **Não comprovado** ou **Hipótese**.

> **Nota de honestidade:** auditei em profundidade os caminhos que quebram uma inauguração — pagamento, estoque, transações, RLS, concorrência, offline. Não fiz varredura exaustiva de 100% dos arquivos (performance sob carga real, todo tech-debt, cada fluxo). Onde não olhei a fundo, está marcado.

---

## O que está COMPROVADAMENTE BOM (não é tudo ruim)

Antes dos furos, o que o código faz certo — porque isso muda o veredito:

- **Pagamento duplo é bloqueado no banco.** `marcar_comanda_paga` (`supabase/migrations/20260621_fn_marcar_comanda_paga.sql`) é um `UPDATE ... WHERE status='aguardando_pagamento' RETURNING`. Dois cliques/requests simultâneos: só o primeiro acha a linha; o segundo recebe `ok:false`. Race de pagamento duplo **mitigada na origem**.
- **Entrega é idempotente.** `fn_entregar_pedido` (`20260624_member_attribution.sql`) checa status no passo 1; duplo-tap no "entregar" não baixa estoque duas vezes.
- **Total da comanda é sempre íntegro.** Trigger `recalcular_total_comanda` (`20260620_trigger_comanda_total.sql`) faz `SUM(preco*qtd) WHERE status!='cancelado'` a cada mudança — recomputo completo, não `+=`. Concorrência de itens é segura.
- **Um único turno aberto por bar.** Índice único parcial `turnos_um_aberto_por_bar` (`20260708_turno_unico_aberto.sql`) impede dois turnos abertos.
- **RLS multi-tenant sólida.** `my_bar_ids()` isola por `bar_id`; DELETE de comanda/item restrito a dono/gerente; DELETE de pagamento só dono (`20240622_rls_policies.sql`).
- **Preço vem do servidor.** Item usa `variante.preco ?? prod.preco` lido do banco (`src/lib/mesa/actions.ts:228`) — cliente não escolhe o preço via a action.
- **Trilha de auditoria financeira existe.** `pagamentos` grava `processado_por` + `processado_por_member_id` + `processado_em`; consumo de estoque gera `ingrediente_movimentos` imutável com custo-snapshot.

---

## Achados por prioridade (com evidência)

### P0-1 — Registro de pagamento NÃO é atômico → dinheiro pode sumir do caixa
- **Prioridade:** P0 — Crítico
- **Arquivo/função:** `src/lib/caixa/actions.ts` → `registrarPagamento` (e `registrarPagamentosMesa`)
- **Evidência:** a comanda é marcada como paga por RPC atômica (`marcar_comanda_paga`), mas o `INSERT` em `pagamentos` e o `rpc("incrementar_total_turno")` acontecem **depois, em chamadas separadas, sem transação e sem checagem de erro** (`await supabase.from("pagamentos").insert({...})` — o retorno não é lido).
- **Causa raiz:** ausência de transação abrangendo "marcar paga + inserir pagamento + incrementar turno". Não há rollback.
- **Impacto operacional:** se a rede/servidor falhar entre marcar-paga e inserir-pagamento, a comanda fica `paga` **sem linha em `pagamentos`**. Uma retentativa manual encontra a comanda já paga (`ok:false`) e **não** insere — o pagamento some do registro para sempre.
- **Impacto financeiro:** dinheiro recebido fisicamente que não aparece no fechamento; `total_vendas` do turno pode divergir da soma de `pagamentos`. Caixa não fecha.
- **Probabilidade:** Alta num evento lotado com Wi-Fi de casa noturna (blips são a regra).
- **Reprodução:** derrubar a conexão logo após o clique de pagar; comanda vira `paga`, `pagamentos` fica sem registro.
- **Solução:** mover tudo para uma única função Postgres `SECURITY DEFINER` (marcar paga → inserir pagamento → incrementar turno → agregados do cliente) numa transação. Ou, no mínimo, checar o erro do insert e, se falhar, reverter o status da comanda.
- **Risco da correção:** médio — mexe no caminho financeiro; exige teste. Vale porque é o pior modo de falha.

### P1-2 — Criação de pedido NÃO é atômica → pedido órfão e/ou duplicado
- **Prioridade:** P1 — Alto
- **Arquivo/função:** `src/lib/mesa/actions.ts` → `criarPedidoCliente` (linhas ~248–266). **Não comprovado** se o fluxo staff (garçom) usa o mesmo padrão — precisa validar.
- **Evidência:** insere `pedidos` primeiro, depois `comanda_items` numa segunda chamada. Se o insert de itens falha, retorna erro **mas o pedido já foi criado** — sem rollback.
- **Impacto operacional:** bartender recebe pedido fantasma (sem itens) na fila; cliente/garçom acha que falhou e reenvia → **pedido duplicado**.
- **Impacto financeiro:** itens produzidos/entregues em duplicidade = perda de insumo; ou pedido cobrado sem itens.
- **Probabilidade:** Alta sob rede instável.
- **Reprodução:** falhar o insert de itens (rede) após o pedido criado.
- **Solução:** função Postgres transacional que cria pedido + itens junto; ou inserir itens primeiro e o pedido por último; adicionar chave de idempotência.
- **Risco da correção:** médio.

### P1-3 — Estoque pode ficar NEGATIVO (sobre-venda)
- **Prioridade:** P1 — Alto
- **Arquivo/função:** `fn_entregar_pedido` (`supabase/migrations/20260624_member_attribution.sql`, passo 3d) + pré-check em `src/lib/mesa/actions.ts:193`
- **Evidência:** o decremento é `UPDATE ingredientes SET estoque_atual = estoque_atual - v_deducao` — **sem clamp em zero e sem checar saldo suficiente**. O "trava de estoque" no add-item lê o saldo no momento do pedido (TOCTOU): dois pedidos passam pela checagem com base no mesmo saldo e ambos são entregues.
- **Causa raiz:** decremento incondicional + checagem em momento diferente da baixa.
- **Impacto operacional:** sistema mostra estoque negativo; "doses possíveis" e alertas ficam incorretos; bar promete o que não tem.
- **Impacto financeiro:** indireto (sobre-venda, ruptura sem aviso).
- **Probabilidade:** Média-Alta em pico com item popular acabando.
- **Reprodução:** 1 dose de gin, dois Negronis entregues quase juntos → estoque vira negativo.
- **Solução:** na função de baixa, `estoque_atual = GREATEST(0, estoque_atual - v_deducao)` **ou** bloquear entrega quando saldo insuficiente (decisão de produto); e travar a linha do ingrediente (`FOR UPDATE`) durante a baixa.
- **Risco da correção:** baixo-médio.

### P1-4 — Sem operação offline / retry → Wi-Fi cair para a operação
- **Prioridade:** P1 — Alto
- **Evidência:** não há service worker de fila offline, IndexedDB de mutações, nem retry. Só `manifest.json` (PWA instalável) e referências soltas a `localStorage`/`navigator.onLine` em `operador-shell.tsx`/`menu-app.tsx`. Todo write é Supabase online.
- **Impacto operacional:** qualquer queda de rede = iPad do garçom/bartender **não lança pedido**. Sem fila, sem recuperação. Ações em voo podem falhar em silêncio ou duplicar ao reconectar.
- **Probabilidade:** Alta (Wi-Fi de casa lotada é o cenário do enunciado).
- **Reprodução:** desligar Wi-Fi 2 min no meio do pico.
- **Solução (curto prazo p/ amanhã):** rede redundante (4G/roteador dedicado só pro sistema), avisar operação. **Médio prazo:** fila offline com idempotência.
- **Risco da correção:** alto para implementar fila offline agora — **não dá pra amanhã**; mitigar por infra.

### P1-5 — Double-submit no envio de pedido — CORRIGIDO NA REVISÃO / mitigado
- **Prioridade:** rebaixado para P2 (era P1 por imprecisão de busca)
- **Correção da auditoria:** a busca inicial usou padrões que não batiam com o código. Na 2ª passada, **todos** os pontos de envio/pagamento **já têm guard de double-submit** via `useTransition`/`disabled`: caixa (`caixa-tela.tsx:356-367`, `disabled={isPending}`), bartender add (`produto-grid.tsx:213,306`, `disabled={pending}`), QR cliente (`menu-app.tsx:663,815`, `disabled={submitting}`), mesa (`mesa-app.tsx:320`, `if (enviando…) return`). Pagamento também é protegido no DB. **P1-5 original não procede.**
- **Resíduo real (P2):** o guard é de UI (`disabled` após re-render). Um duplo-toque genuinamente simultâneo em touch pode escapar antes do disable aplicar, e o envio de pedido **não tem chave de idempotência server-side** → pedido duplicado raro. Pagamento não sofre (guarda no DB).
- **Solução (follow-up):** chave de idempotência por pedido no server. **Risco:** baixo.

### P1-6 — `pagamentos` é editável por qualquer membro
- **Prioridade:** P1 — Alto
- **Evidência:** `20240622_rls_policies.sql:175` → `pagamentos_update USING (bar_id = ANY(my_bar_ids()))` — sem restrição de role. Qualquer staff logado pode `UPDATE` um pagamento (valor, método, status).
- **Impacto financeiro:** alteração posterior de pagamento sem trilha; garçom/insider muda valor recebido.
- **Solução:** restringir `pagamentos_update` a dono/gerente (ou proibir update; correções via estorno auditável).
- **Risco da correção:** baixo.

### P1-7 — `service_role` (bypassa RLS) usado em ~20 arquivos server
- **Prioridade:** P1 — Alto (sistêmico)
- **Evidência:** `src/lib/supabase/admin.ts` usa `SUPABASE_SERVICE_ROLE_KEY`; importado por mesa, caixa, bartender, kiosk, admin, settings, leads, onboarding, turno-actions, menu, destaques, aceitar-convite (…). O client admin **ignora RLS**.
- **Causa raiz:** o fluxo de login compartilhado / QR precisa escrever sem sessão do cliente, então usa admin. A segurança passa a depender de **cada action revalidar `bar_id`/role manualmente**.
- **Impacto:** qualquer action que use admin e esqueça de checar dono do recurso = IDOR / mutação cross-tenant. Validei que `registrarPagamento` usa client normal (RLS aplica) e faz check de bar; **não** auditei as ~20 individualmente — **Hipótese de risco** onde não olhei.
- **Solução:** varredura dedicada de cada uso do admin client confirmando checagem explícita de `current.bar.id` antes de qualquer escrita; centralizar um `assertBarAccess()`.
- **Risco da correção:** médio (revisão ampla).

### P2-8 — Agregados do cliente com read-modify-write sem lock
- **Prioridade:** P2 — Médio
- **Arquivo:** `src/lib/caixa/actions.ts` (`total_visitas`, `total_gasto`, `ticket_medio`)
- **Evidência:** lê `clientes` e escreve de volta (`novo = antigo + x`) sem lock/transação. Pagamentos concorrentes do mesmo cliente = last-write-wins → visitas/gasto subcontados.
- **Impacto:** CRM impreciso (não financeiro-crítico). **Solução:** incremento atômico no DB (`UPDATE ... SET total_gasto = total_gasto + x`).

### P2-9 — Insider pode inserir item com preço arbitrário direto no banco
- **Prioridade:** P2 — Médio (exige conhecimento técnico + acesso ao token)
- **Evidência:** `comanda_items_insert WITH CHECK (bar_id = ANY(my_bar_ids()))` (`20240622_rls_policies.sql:162`) valida só o `bar_id`, não o preço. A action usa preço do servidor (correto), mas a RLS não impede um insert direto via supabase-js com `preco_total: 0`.
- **Impacto:** bebida grátis / preço adulterado por staff técnico. Login compartilhado no iPad amplia quem tem o token.
- **Solução:** trigger de validação server-side que force `preco_unitario` = preço vigente do produto/variante no insert; ou canalizar 100% dos inserts por função `SECURITY DEFINER` e remover INSERT direto do role.

### P2-10 — Movimento de estoque manual sem concorrência
- **Prioridade:** P2 — Médio
- **Arquivo:** `src/lib/estoque/actions.ts` → `registrarMovimento` (read `quantidade_atual` → calcula → update). Sem lock. Baixa frequência durante serviço, mas ajustes simultâneos se perdem. **Solução:** update atômico/relativo no DB.

### P3-11 — Rate limit / brute force de login
- **Prioridade:** P3
- **Evidência:** único rate limit é `rateLimitMap` **em memória** no `api/ai/chat/route.ts` (por instância serverless — ineficaz em escala). Login depende dos limites nativos do Supabase Auth. **Não comprovado** endurecimento app-level. Baixa relevância para a inauguração.

### Observabilidade / Logs (Auditoria 9) — parcial
- **Comprovado:** `console.error` em actions; trilha em `pagamentos`, `ingrediente_movimentos`, `estoque_movimentos` (quem/quando). 
- **Não comprovado / lacuna:** log estruturado central + alertas; auditoria de cancelamento de item, desconto/cortesia, alteração de preço, troca de mesa, reset de senha. `pagamentos_update` sem trilha (ver P1-6). Sem correlação/monitoramento além dos logs da Vercel. **Prioridade agregada: P2.**

---

## Single Points of Failure (Auditoria 13)

| SPOF | Impacto | Probabilidade | Solução |
|---|---|---|---|
| Wi-Fi da casa | Operação inteira para (sem offline) | Alta | Rede dedicada 4G + roteador só do sistema; plano B em papel |
| Supabase (DB único) | Sem pedidos/pagamentos/leitura | Baixa-Média | Aceitar p/ piloto; monitorar status; plano manual |
| Vercel (app) | App fora | Baixa | Idem; página estática de contingência |
| 1 dispositivo de caixa | Fila de pagamento trava | Média | Segundo device/browser logado pronto |
| Sessão de login compartilhada | Se expira/desloga, iPad para | Média | Testar persistência PWA antes; device de reserva |

---

## FMEA (falhas priorizadas)

| Falha | Causa | Efeito | Sev | Ocorr | Detec | RPN | Mitigação |
|---|---|---|---|---|---|---|---|
| Pagamento sem registro | Insert não-transacional após marcar paga | Dinheiro some do caixa | 10 | 6 | 3 | 180 | Transação única (P0-1) |
| Pedido órfão/duplicado | Pedido+itens não atômico | Fila fantasma / duplo preparo | 8 | 6 | 4 | 192 | Transação/idempotência (P1-2) |
| Estoque negativo | Baixa sem clamp/lock + TOCTOU | Sobre-venda, inventário errado | 6 | 6 | 5 | 180 | GREATEST(0,…)+FOR UPDATE (P1-3) |
| Operação para no Wi-Fi | Sem offline/retry | Bar sem sistema no pico | 9 | 6 | 2 | 108 | Rede redundante (P1-4) |
| Pedido duplicado (2 cliques) | Sem guard/idempotência | Duplo preparo | 6 | 6 | 4 | 144 | Botão bloqueia + chave (P1-5) |
| Pagamento adulterado | pagamentos_update p/ qualquer role | Fraude sem trilha | 7 | 3 | 5 | 105 | Restringir a dono/gerente (P1-6) |
| Vazamento cross-tenant | service_role sem check | IDOR | 9 | 2 | 6 | 108 | Auditar cada uso admin (P1-7) |

*(Sev/Ocorr/Detec de 1–10; RPN = produto. Valores são estimativa fundamentada, não medição.)*

---

## Critério Final de Go-Live

### Nota de prontidão: **~60%**
Núcleo do caminho feliz é sólido e com boas travas de banco (pagamento atômico anti-duplo, turno único, trigger de total, RLS, entrega idempotente). O que derruba a nota são os **modos de falha parcial** (pagamento/pedido não-transacionais) e a **ausência de offline** — exatamente os cenários que uma casa lotada com Wi-Fi instável provoca.

### Classificação: **⚠️ Apenas piloto controlado**
Pode inaugurar **com o fundador/dev presente monitorando**, rede redundante e um caderno de contingência. **Não** está pronto para escalar sem supervisão nem para operar em rede instável.

### Bloqueadores mínimos antes das 20h (o que dá pra fazer hoje)
1. **P0-1** — tornar o pagamento transacional (função Postgres única) **ou** checar o erro do insert e reverter status. *Inegociável.*
2. **P1-6** — restringir `pagamentos_update` a dono/gerente (1 linha de RLS).
3. **P1-4** — **infra:** rede dedicada 4G + roteador exclusivo; device de caixa reserva logado.
4. **P1-5** — desabilitar botões de enviar/pagar durante o submit (guard de UI rápido).
5. **P1-3** — `GREATEST(0, …)` na baixa de estoque (1 linha).

### Top 20 Problemas (mais graves primeiro)
1. Pagamento não-transacional → dinheiro some (P0-1)
2. Pedido não-transacional → órfão/duplicado (P1-2)
3. Estoque negativo por baixa sem clamp/lock (P1-3)
4. Sem operação offline/retry (P1-4)
5. Sem idempotência/guard no envio de pedido (P1-5)
6. `pagamentos` editável por qualquer membro (P1-6)
7. `service_role` amplo sem auditoria de authz por action (P1-7)
8. Insert direto de item com preço arbitrário (P2-9)
9. Agregados de cliente com race (P2-8)
10. Movimento de estoque manual sem concorrência (P2-10)
11. Sem log/auditoria de cancelamento, desconto, cortesia, alteração de preço (P2, obs.)
12. Wi-Fi como SPOF sem plano B (P1-4/SPOF)
13. Caixa único como gargalo de fila (SPOF)
14. Sessão compartilhada: comportamento em expiração **Não comprovado** (SPOF)
15. `incrementar_total_turno` roda mesmo se pagamento falhou → divergência de faturado (P0-1 derivado)
16. Estorno/correção de pagamento: **Não comprovado** que exista fluxo auditável
17. Reabertura de comanda paga: **Não comprovado** (fluxo de erro do caixa)
18. Rate limit de login só em memória / inexistente app-level (P3)
19. Feature de IA fora do ar por crédito Anthropic esgotado (intelligence, não operacional — ver auditoria anterior)
20. Sem monitoramento/alerta central — descoberta de falha é reativa (P2)

### Plano de Ação

| Prioridade | Categoria | Problema | Evidência | Solução | Esforço | Impacto |
|---|---|---|---|---|---|---|
| P0 | Financeiro | Pagamento não-atômico | caixa/actions.ts `registrarPagamento` | Função Postgres transacional (pagar+registrar+turno) | M | Altíssimo |
| P1 | Segurança | pagamentos_update aberto | rls_policies.sql:175 | Restringir a dono/gerente | XS | Alto |
| P1 | Integridade | Pedido não-atômico | mesa/actions.ts `criarPedidoCliente` | Transação + idempotência | M | Alto |
| P1 | Integridade | Estoque negativo | fn_entregar_pedido 3d | GREATEST(0,…)+FOR UPDATE | S | Alto |
| P1 | Resiliência | Sem offline | ausência de SW/fila | Infra redundante agora; fila offline depois | S(infra)/L(código) | Alto |
| P1 | UX/Integridade | Double-submit | components sem guard | Bloquear botão + chave idempotente | S | Alto |
| P1 | Segurança | service_role sem authz | admin.ts + 20 arquivos | Auditar cada uso + assertBarAccess() | M | Alto |
| P2 | Segurança | Preço arbitrário via insert | rls comanda_items_insert | Trigger valida preço / só via RPC | M | Médio |
| P2 | Integridade | Race agregados cliente | caixa/actions.ts | Update atômico relativo | S | Médio |
| P2 | Observabilidade | Sem log de cancel/desconto | — (ausência) | Tabela de auditoria de eventos sensíveis | M | Médio |

---

## Itens marcados como Não Comprovado (precisam de validação antes de afirmar)
- Fluxo **staff/garçom** de criação de pedido é atômico? (só comprovei `criarPedidoCliente` não-atômico)
- Existe **estorno / correção de pagamento** auditável? Não encontrado.
- Existe **reabertura de comanda** após erro de caixa? Não encontrado.
- Cada uso do **service_role** revalida `bar_id`/role? Auditados poucos; o resto é **Hipótese de risco**.
- Comportamento da **sessão compartilhada** ao expirar (iPad para?) — não testado no código.
- Guard de **double-submit** no front — ausência inferida por busca, não provada exaustivamente.

*Auditoria baseada exclusivamente em código-fonte, migrations e RLS do repositório. Nenhuma funcionalidade foi assumida como existente sem evidência.*
