# Superbar Dashboard — Redesign Brief
**Versão:** 1.0 · **Data:** 2026-06-29  
**Produto:** Dashboard do Dono · Operação ao vivo  
**Autor:** Design Strategy

---

## 1. Diagnóstico — O que está errado agora

### Problemas de arquitetura de informação

**Hierarquia de leitura invertida.**
O usuário chega na tela e precisa varrer 6+ blocos para entender o estado do turno. Não há uma sentença-síntese. O cérebro do dono gasta energia para montar o diagnóstico que o sistema deveria já ter feito.

**Os números estão soltos, não narrados.**
"Ticket Médio: R$ 239,33 ▲26,3% vs ontem" responde *quanto*, mas não responde *e daí*. O dono precisa saber se R$ 239 é bom para uma segunda-feira de junho no seu bar — e o sistema tem esse dado.

**A Próxima Ação está no lugar errado.**
Está no canto inferior direito de um grid de 3 colunas, competindo visualmente com "Vendas por hora" e "Estoque". É o insight mais valioso da tela e está enterrado.

**O chat de IA parece um widget de suporte ao cliente.**
Campo de texto genérico com placeholder "Pergunte sobre margem…". Isso pede do usuário que ele saiba o que perguntar. O dono de bar não sabe. Ele sabe o que sente: "tá parecendo que tô vendendo muito mas o caixa tá fraco."

**O gráfico de receita 7 dias decora, não decide.**
Ocupa 50% do espaço acima do fold em um dos contextos mais importantes. Sem linha de meta, sem pico anotado, sem explicação de anomalia. É uma régua sem escala.

**As cores estão espalhadas sem semântica rigorosa.**
Âmbar (var(--accent)) aparece em botões primários, badges de origem, barras de progresso e alertas de atenção. O usuário não sabe o que precisa agora vs o que é configuração.

**Excesso de overlines técnicos.**
"TICKET MÉDIO", "MARGEM", "CMV" em caixa alta com 0.12em de tracking. Parece painel de BI para analista. O dono lê isso como burocracia.

### Problemas de linguagem

| Atual | O problema |
|-------|-----------|
| "CMV: 34% — saudável" | Não explica por quê nem o que fazer |
| "Confiança: 73%" | O dono não sabe o que significa confiança aqui |
| "Estimativa parcial" | Jargão técnico. Deveria dizer "Custo de alguns produtos ainda não cadastrado" |
| "1 ponto requer atenção" | Não diz qual. Obriga clicar para descobrir |
| "Próxima Melhor Ação" | Label de sistema, não de copiloto |

---

## 2. Nova Arquitetura de Informação

### Princípio organizador: do mais urgente ao mais estratégico

```
ZONA 1 — Diagnóstico do turno         (responde: como estou?)
ZONA 2 — Próxima ação                 (responde: o que faço agora?)
ZONA 3 — Alertas inteligentes         (responde: o que está errado?)
ZONA 4 — Pulso operacional            (responde: o que está acontecendo?)
ZONA 5 — Perguntas inteligentes       (responde: por que isso está acontecendo?)
```

### Hierarquia de leitura (5 segundos)

1. **Frase de status** — lida em 1 segundo, dá o estado geral
2. **3 números-âncora** — lidos em 3 segundos, quantificam o estado
3. **Próxima ação** — lida em 1 segundo, diz o que fazer

Tudo abaixo da Zona 2 é detalhe. O dono pode ignorar e ainda vai saber o que precisa.

---

## 3. Wireframe Textual — Nova Tela

```
┌──────────────────────────────────────────────────────────────────┐
│  SUPERBAR                   Aurora Bar              ● AO VIVO    │
│  sidebar...                                                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ZONA 1 — DIAGNÓSTICO DO TURNO                                   │
│                                                                  │
│  "Você está vendendo bem, mas perdendo margem.                   │
│   CMV subiu 4 pontos porque Negroni está saindo mais             │
│   do que o esperado e seu custo é alto."                         │
│                                                                  │
│  ──────────────────────────────────────────────────             │
│                                                                  │
│  RECEITA AGORA      MARGEM HOJE       MAIOR PROBLEMA             │
│  R$ 718             62%               CMV: −R$ 138               │
│  ▲ 15% vs ontem     ▼ 4pts vs ontem   Negroni com custo alto     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ZONA 2 — PRÓXIMA AÇÃO  ★ ELEMENTO PRINCIPAL                     │
│                                                                  │
│  Ofereça Sex on the Beach agora.                                 │
│                                                                  │
│  Margem de 73% e quase não está sendo pedido.                    │
│  Se 3 clientes pedirem nas próximas 2h:                          │
│  +R$ 87 de receita adicional com pouco esforço.                  │
│                                                                  │
│  [  Enviar sugestão para a equipe  ]   Ver mais produtos →       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐  ┌───────────────────────────────────┐
│  ZONA 3 — ALERTAS          │  │  ZONA 4 — PULSO OPERACIONAL       │
│                            │  │                                   │
│  ● CRÍTICO                 │  │  8 comandas abertas               │
│  CMV subiu R$ 138          │  │  Tempo médio: 12 min              │
│  Negroni saiu 9x hoje      │  │  Pix · 62% · Crédito · 31%        │
│  → Pausar ou substituir    │  │                                   │
│                            │  │  ──────────────────────────       │
│  ○ OPORTUNIDADE            │  │  ESTOQUE                          │
│  Sex on the Beach sub.     │  │  ⚠ Gelo 80% consumido            │
│  +R$ 87 est. em 2h         │  │  ⚠ Limão: último caixote         │
│  → Orientar equipe         │  │                                   │
│                            │  │  ──────────────────────────       │
│  ○ RISCO                   │  │  CORTESIAS                        │
│  3 cortesias em 1h         │  │  4 hoje · padrão: 2 por turno     │
│  Quem autorizou?            │  │  → Checar quem autorizou         │
│  → Verificar registros     │  │                                   │
└────────────────────────────┘  └───────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ZONA 5 — PERGUNTAS INTELIGENTES                                 │
│                                                                  │
│  Por que meu CMV subiu hoje?                                     │
│  O que devo pedir para a equipe vender agora?                    │
│  Onde estou perdendo margem?                                     │
│  Quais produtos devo pausar hoje?                                │
│  Resumo do turno para mandar no WhatsApp                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Ou pergunte com suas próprias palavras...               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Resposta da IA aparece aqui — sempre: diagnóstico +            │
│   evidência + ação + impacto estimado]                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Copy — Cada Seção

### Zona 1 — Frase de diagnóstico (gerada dinamicamente)

**Estados possíveis:**

```
SAUDÁVEL
"Turno saudável. Você está dentro do limite de custo e o ticket está subindo."

ATENÇÃO — CMV alto
"Você está vendendo bem, mas perdendo margem.
 CMV subiu [X] pontos porque [produto] está saindo mais do que o esperado."

ATENÇÃO — Ticket caindo
"Receita crescendo, mas clientes gastando menos.
 Ticket caiu [X]% — o que pode indicar que a equipe está sugerindo produtos mais baratos."

CRÍTICO — CMV e ticket caindo
"Turno difícil. Custo alto e clientes gastando menos.
 Dois problemas ao mesmo tempo pedem ação agora."

SEM DADOS DE CUSTO
"Vendendo bem, mas sem dados de custo não consigo calcular se você está lucrando.
 Cadastre o custo de pelo menos [X] produtos para ver a margem real."
```

### Zona 1 — 3 Números-âncora

**Receita agora**
- Valor: R$ [x]
- Comparação: "▲ [x]% vs ontem à essa hora" ou "▼ [x]% — abaixo do turno de ontem"
- Não usar: "vs turno equivalente anterior" (jargão)

**Margem hoje**
- Valor: [x]%
- Comparação: "▼ 4pts vs ontem" (pts, não %, porque é diferença de percentuais)
- Subtext: "saudável" / "atenção" / "crítico" — uma palavra só

**Maior problema do turno**
- Valor: −R$ [x] ou +R$ [x]
- Label: o nome do problema em linguagem direta
- Exemplos:
  - "CMV alto: Negroni"
  - "Ticket caindo: −R$ 28"
  - "Cortesias: acima do padrão"
  - "Tudo certo por enquanto"

### Zona 2 — Próxima Ação

**Estrutura fixa:**
```
[VERBO IMPERATIVO] [PRODUTO/AÇÃO].

[Por quê — 1 frase, dados concretos.]
Se [resultado esperado]:
[Impacto em R$] com [nível de esforço].

[BOTÃO PRIMÁRIO: ação principal]   [link secundário: ver mais]
```

**Exemplos reais:**

```
Ofereça Sex on the Beach agora.
Margem de 73% e saiu apenas 2x hoje, bem abaixo do potencial.
Se 3 clientes pedirem nas próximas 2h: +R$ 87 de receita adicional.

[ Enviar sugestão para a equipe ]   Ver produtos de alta margem →
```

```
Oriente a equipe a não sugerir Negroni.
Custo de R$ 22 com preço de venda de R$ 38 — margem de apenas 42%.
Substituir por Spritz (margem 71%) nesta hora pode salvar R$ 60 no turno.

[ Avisar equipe agora ]   Ver alternativas de alta margem →
```

```
Verifique as cortesias autorizadas hoje.
Foram 4 cortesias nas últimas 2h. Seu padrão é 2 por turno.
Cada cortesia extra representa em média R$ 45 fora do caixa.

[ Ver registro de cortesias ]   Falar com o responsável →
```

### Zona 3 — Alertas

**Estrutura de cada alerta:**
```
[LABEL TIPO]  ← apenas 3: CRÍTICO · OPORTUNIDADE · RISCO
[Título em linguagem humana]
[Impacto em R$ — sempre]
[Causa provável — 1 frase]
→ [Ação recomendada — verbo + objeto]
[Responsável sugerido: Equipe / Você / Caixa]
```

**Exemplos:**
```
● CRÍTICO
CMV subiu R$ 138 neste turno
Negroni foi pedido 9x — mais que o dobro do normal para esta hora.
Causa: produto com custo alto pode estar sendo sugerido ativamente.
→ Verificar se equipe está sugerindo Negroni por hábito
Responsável: você agora
```

```
○ OPORTUNIDADE
Sex on the Beach subofertado
Margem de 73%, mas só 2 pedidos hoje. Potencial de +R$ 87 em 2h.
→ Orientar equipe a sugerir nas próximas 2 horas
Responsável: equipe
```

```
△ RISCO
Gelo 80% consumido — faltam ~2h de operação
Sem reposição, produção de drinks pode parar no pico.
→ Ligar para fornecedor ou verificar estoque de emergência
Responsável: você agora
```

### Zona 4 — Pulso Operacional (labels curtos)

```
8 comandas abertas agora
Tempo médio de atendimento: 12 min  [dentro do padrão]
Forma de pagamento predominante: Pix · 62%

Estoque com atenção:
· Gelo — pouco
· Limão — verificar

Cortesias hoje: 4  [padrão: 2]
```

### Zona 5 — Perguntas Contextuais da IA

Não são genéricas. São geradas com base no estado atual do turno:

```
SE CMV estiver alto:
"Por que meu CMV subiu hoje?"
"Qual produto está derrubando minha margem agora?"
"O que devo tirar do cardápio por hoje?"

SE oportunidade de margem:
"O que devo pedir para a equipe sugerir agora?"
"Quais drinks têm margem acima de 70% hoje?"

SEMPRE disponível:
"Resumo do turno para mandar no WhatsApp"
"Como está minha meta de hoje?"
"O que devo acompanhar nas próximas 2 horas?"
```

**Formato de resposta da IA (sempre fixo):**

```
DIAGNÓSTICO
[1-2 frases explicando o que está acontecendo]

EVIDÊNCIA
[dado concreto que suporta o diagnóstico]

AÇÃO
[1 ação específica e simples]

IMPACTO ESPERADO
[estimativa em R$ ou resultado mensurável]
```

---

## 5. Sistema de Design — Componentes Principais

### Tokens de cor (semântica rigorosa)

```css
--color-ok:       #22c55e   /* Ganho real ou saúde confirmada */
--color-risk:     #f59e0b   /* Atenção — pode virar problema */
--color-critical: #ef4444   /* Perda real ou risco imediato */
--color-action:   #f59e0b   /* Âmbar APENAS em botão de ação primário */
--color-neutral:  #a1a1aa   /* Info sem urgência */

/* Fundo semântico */
--color-ok-bg:       color-mix(in srgb, #22c55e 8%, transparent)
--color-risk-bg:     color-mix(in srgb, #f59e0b 8%, transparent)
--color-critical-bg: color-mix(in srgb, #ef4444 8%, transparent)
```

**Regra de uso:**
- Verde: só quando há confirmação de ganho ou saúde real
- Âmbar: só em botão de ação ou sinal de atenção. **Nunca como decoração**
- Vermelho: só quando dinheiro está sendo perdido agora ou risco é imediato
- Branco/fg: dados neutros, labels, textos de suporte

### Componente: StatusBanner (Zona 1)

```
Props: type ('ok' | 'warning' | 'critical'), message: string

Visual:
- Fundo: cor semântica com 6% de opacidade
- Borda esquerda: 3px sólido na cor semântica
- Padding: 20px 24px
- Texto: 16px / 700 / line-height 1.5
- Sem ícone decorativo — a cor carrega o significado
```

### Componente: MetricAnchor (Zona 1 — 3 números)

```
Props: label, value, delta, deltaLabel, interpretation, color

Visual:
- Label: 10px / mono / uppercase / var(--fg-subtle)
- Value: 40px / 800 / tabular-nums / sem bordas, sem sombra
- Delta: inline-flex, seta SVG + percentual colorido + "vs ontem"
- Interpretation: 12px / regular / var(--fg-subtle)
- Divisor entre colunas: 1px / var(--border) / sem padding excessivo
```

### Componente: ProximaAcao (Zona 2 — hero)

```
Props: titulo, porque, impacto, confianca, botaoPrimario, linkSecundario

Visual:
- Card com destaque visual MAIOR que todos os outros elementos
- Background: levemente mais claro que --bg-elevated
- Borda: 1px sólido com --border, com brilho sutil (box-shadow interna)
- Título: 22-24px / 700 / fg principal / sem uppercase
- Impacto: 14px / mono / var(--ok) se positivo
- Botão primário: fundo var(--accent) / texto preto / border-radius 8px
- Confiança: não mostrar como percentual — mostrar como barra de 3 dots ou label verbal: "Alta confiança · 3 vendas hoje"
```

### Componente: AlertCard (Zona 3)

```
Props: tipo ('critical' | 'opportunity' | 'risk'), titulo, impacto, causa, acao, responsavel

Visual:
- Label tipo: 9px / mono / uppercase / cor semântica
- Título: 13px / 600 / fg
- Impacto: 12px / mono / cor semântica / bold
- Causa: 11px / regular / fg-subtle
- Ação: "→ Texto" / 11px / fg-subtle com hover para fg
- Responsável: tag pequena de 9px no canto inferior

- Bordas: SEM borda lateral colorida (padrão descartado)
- Fundo de critical: --color-critical-bg
- Fundo de outros: transparente
```

### Componente: PulsoOperacional (Zona 4)

```
Não usa cards separados para cada métrica.
Uma lista compacta de sinais em texto, agrupados por categoria.

Formato:
[valor em destaque]  [label]  [status opcional]

Exemplo:
8  comandas abertas
12 min  tempo médio  ↑ acima do normal
Pix  62%  ·  Crédito  31%
```

### Componente: IA Contextual (Zona 5)

```
Props: perguntas: string[], barId: string

Visual:
- Sem borda superior (integrado ao fundo da página)
- Chips de perguntas: fundo transparente, borda --border, texto --fg-subtle
  - Hover: borda --accent, texto --fg
  - As perguntas mais urgentes ficam primeiro (geradas por contexto)
- Textarea: fundo levemente elevado, sem borda aparente
  - Placeholder: "Ou pergunte com suas palavras…"
  - Focus: borda --accent 1px
- Resposta: fundo --bg-elevated, padding generoso, fonte sans 14px/1.7
  - Sempre começa com "DIAGNÓSTICO:" em mono/uppercase
```

---

## 6. Microinterações

### Transições

**StatusBanner** — quando o estado muda (ex: CMV sobe para crítico):
```
- Fade in + slide de 4px de baixo para cima
- Duração: 400ms / ease-out
- Não piscar, não chacoalhar — o dono está no pico de operação
```

**Métricas ao vivo** — quando o faturamento atualiza:
```
- O número faz flip vertical (flip de cartão) em 200ms
- Se subiu: a cor fica verde por 1 segundo, depois volta para fg
- Se caiu: vermelho por 1 segundo
- Nunca muda cor se for variação < 2% (ruído)
```

**Botão "Enviar sugestão para equipe":**
```
1. Click → botão fica disabled + spinner pequeno (500ms)
2. → Ícone de check + "Enviado para [nome da equipe]"
3. → 3 segundos depois, volta ao estado original (pode enviar novamente)
4. Toast sutil na base da tela: "✓ Equipe notificada"
```

**ProximaAcao — quando muda de produto sugerido:**
```
- Fade cross entre o texto anterior e o novo (300ms)
- Nunca jump/reflow abrupto
```

**AlertCard — quando alerta é resolvido:**
```
- Slide para a direita + fade out (250ms)
- O card abaixo sobe suavemente para ocupar o espaço
```

**Perguntas da IA — loading state:**
```
- O botão some, o chip fica com fundo levemente âmbar
- No campo de resposta: 3 pontos pulsantes com timing escalonado
  (não spinner — parece que está "pensando", não "carregando")
- Resposta aparece em tipo progressivo (palavra a palavra), não pop-in
```

### Estados de erro

```
- Timeout da IA (>8s): "Demorando mais que o normal. Tentar novamente →"
- Sem dados de custo: StatusBanner amarelo explicando especificamente o que está faltando
- Sem turno aberto: tela completamente diferente (estado "bar fechado")
  → Não mostrar métricas zeradas, mostrar "Resumo do último turno" + próximos passos
```

---

## 7. Briefing para Designer UI

**Produto:** Superbar — Dashboard do Dono / Operação ao Vivo  
**Plataforma:** Desktop (1280px+) e tablet (1024px)  
**Contexto de uso:** Dono do bar, na operação, olhando de 30 a 60 segundos, várias vezes por noite  
**Referências visuais:** Linear.app, Vercel Analytics, Raycast — não: Tableau, Excel, Grafana

---

### Atmosfera visual desejada

- Fundo: `#0a0a0a` ou `#0d0d0d` — preto profundo, não cinza escuro
- Sem gradientes de cor nas métricas — gradiente apenas em gráficos quando inevitável
- Tipografia: monospace para números, sans-serif humanista para texto narrativo
- Bordas: sutis (`rgba(255,255,255,0.06)`) — o conteúdo cria estrutura, não as bordas
- Sombras: sem drop-shadow nos cards — usar contraste de background para separação
- Respiro: generoso. Cada zona precisa de espaço para respirar. Menos elementos, mais impacto.

---

### Hierarquia visual por zona

```
ZONA 1 — StatusBanner
  → Maior área de breathing do topo
  → Fonte 16-18px bold para a frase-síntese
  → 3 números em 40px, sem caixas, só o número e o label

ZONA 2 — ProximaAcao
  → Card com máximo destaque visual na página
  → Diferente de todos os outros elementos
  → Fundo: #141414 com borda interna sutil
  → Botão primário: âmbar sólido, texto preto, sem gradiente
  → Espaço interno generoso (padding 32px)

ZONA 3 + 4 — Grid 2 colunas
  → Alertas à esquerda (2/3 de largura)
  → Pulso operacional à direita (1/3 de largura)
  → Menos visuais, mais texto direto

ZONA 5 — IA
  → Abaixo da dobra, mas acessível
  → Não parece um chatbot — parece um copiloto
  → Chips espaçados, sem aglomeração
```

---

### Uso de cor — regras para o UI

```
Âmbar (#F59E0B): SOMENTE botão de ação primário e chip de atenção
Verde (#22C55E): SOMENTE confirmação de ganho ou saúde real
Vermelho (#EF4444): SOMENTE perda real ou risco imediato
Branco/90%: dados neutros, valores principais sem urgência
Cinza/50%: labels, sublabels, comparações históricas
```

Âmbar não deve aparecer em mais de 2 lugares na tela ao mesmo tempo.
Se aparecer em 5 lugares, perde o significado de ação.

---

### Tipografia

```
Números hero (Zona 1): 40px / 800 / font-variant-numeric: tabular-nums
Frase diagnóstico: 16-18px / 600-700 / line-height 1.5
Título de ação (Zona 2): 22-24px / 700
Body de suporte: 13-14px / 400-500 / line-height 1.6
Labels/overlines: 10px / 700 / uppercase / tracking 0.12em — usar com moderação
Mono (números operacionais): 12-13px / sistema / tabular
```

---

## 8. Prompt para Mockup Visual em IA

> Crie um mockup de dashboard SaaS para desktop (1280x900px) com as seguintes especificações:
>
> **Produto:** Superbar — painel de operação ao vivo para dono de bar premium  
> **Estilo visual:** Dark mode profundo (#0a0a0a fundo), ultra-clean, premium, inspirado em Linear.app e Vercel  
> **Tipografia:** Sans-serif moderna para texto, monospace para números  
> **Paleta:** Neutros brancos e cinzas; âmbar (#F59E0B) apenas em 1 botão de ação; verde (#22C55E) apenas em 1 indicador de saúde; vermelho (#EF4444) apenas em 1 alerta crítico; sem gradientes de cor, sem tons pastéis  
>
> **Layout — de cima para baixo:**
>
> 1. **Header** — sidebar escura à esquerda (ícones + labels), topo com nome do bar e ponto verde pulsante "AO VIVO". Sem chrome excessivo.
>
> 2. **Status Banner** — faixa horizontal com fundo levemente âmbar (muito sutil). Texto grande: *"Você está vendendo bem, mas perdendo margem. CMV subiu porque Negroni está saindo mais do que o esperado."* Nenhum ícone. Apenas o texto com força.
>
> 3. **3 métricas em linha** — sem cards com borda. Apenas 3 colunas separadas por divisórias verticais sutis. Cada coluna: label pequeno em mono, número gigante (40px), comparação colorida mínima. Colunas: "Receita R$ 718", "Margem 62%", "Maior problema −R$ 138 CMV".
>
> 4. **Próxima Ação** — card com fundo #141414, levemente mais claro que o fundo da página, sem sombra. Ocupa largura total. Título em 22px: *"Ofereça Sex on the Beach agora."* Parágrafo explicativo em 13px. Botão âmbar sólido à esquerda: "Enviar sugestão para a equipe". Link cinza à direita: "Ver produtos de alta margem →".
>
> 5. **Grid 2 colunas** — à esquerda: 3 alertas em lista (CRÍTICO / OPORTUNIDADE / RISCO), cada um com título, valor em vermelho/verde, e seta de ação. À direita: pulso operacional em texto compacto — "8 comandas · 12 min · Pix 62% · ⚠ Gelo pouco".
>
> 6. **IA Contextual** — 5 chips de pergunta contextual dispostos horizontalmente (fonte mono, borda sutil). Abaixo, campo de texto limpo sem bordas aparentes: *"Ou pergunte com suas palavras…"*.
>
> **Evitar:** gradientes, glassmorphism, múltiplos tons de âmbar, sombras pesadas, mais de 3 cores de destaque, ícones decorativos, dashboards que parecem relatório de Excel.  
> **Inspiração de densidade:** Raycast Command Palette, Linear Issue Detail.  
> **Qualidade de referência:** produto real pronto para produção, não conceito.

---

## Apêndice — Decisões de produto implícitas

**O gráfico de receita 7 dias sai da tela principal.**
Ele pertence à seção Relatórios. No dashboard ao vivo, não informa decisão imediata. Se o dono quer ver tendência, vai em Relatórios.

**Meta do mês sai do hero e vai para o rodapé do diagnóstico.**
A meta é estratégica, não operacional. Durante o turno, ela só importa quando está em risco. Deve aparecer como linha discreta: "Meta do mês: 73% atingida — R$ 1.200 restantes."

**"Confiança X%" some completamente.**
Ninguém sabe o que significa. Substituir por: "Com base em [X] dados do turno" ou simplesmente omitir.

**Responsável sugerido em cada alerta.**
Cada alerta precisa nomear quem deve agir: "você", "equipe", "caixa". Sem isso, o alerta vira mais ruído.

**A IA nunca mostra "Consultando dados…" por mais de 3 segundos.**
Se demorar, o usuário abandonou. Timeout com fallback: "Os dados do seu turno sugerem [resposta parcial mais simples]."
