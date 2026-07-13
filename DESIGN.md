# SUPERBAR — Design System

> **Esta é a única fonte de verdade para decisões visuais.**
> Não improvise estilo. Qualquer decisão fora deste documento é inconsistência.
>
> **Para telas de dashboard / monitoramento** (Operação ao Vivo, Central de
> Inteligência, Relatórios, KPIs): consulte **`docs/principios-dashboard.md`**
> (princípios do Stephen Few adaptados) *antes* de desenhar. Este `DESIGN.md`
> manda nos tokens/estética; aquele doc manda na estrutura da informação
> (relance, resumo+exceção, os 13 erros). Em conflito, o `DESIGN.md` prevalece.

---

## Filosofia

Clareza antes de decoração. Premium através de contenção.

O design é um argumento: *"Este software é mais inteligente do que você esperava."*
A interface some — os dados falam. Nenhum elemento existe por estética; cada elemento responde a uma pergunta de negócio.

---

## Stack

- **Font:** Inter — única fonte do app inteiro (dashboard + auth + operacional). Corpo de texto da landing também é Inter.
  - Carregada via `next/font/google` em `src/app/layout.tsx` → variável `--font-sans`
  - `--font-display` e `--font-roboto-mono` são aliases de `--font-sans` definidos em `globals.css`
  - Nunca adicione outra fonte sem decisão explícita
- **EXCEÇÃO (decisão de 2026-07-11): fonte display da landing.** Títulos/display da landing page usam **Londrina Solid 400** (Google Fonts, licença OFL — livre), carregada em `src/app/(marketing)/layout.tsx` que re-aponta `--font-display` **apenas no subtree da marketing**. O app (dashboard/auth/operacional) segue 100% Inter; `--font-display` fora da landing continua alias de Inter.
  - Uso do display na landing: uppercase, `line-height` 0.92–1.0, `letter-spacing` 0.01em, tamanhos fluid via clamp (títulos cartaz até ~12vw). Nunca em texto corrido, nunca no app.
- **Estilo:** Tailwind CSS v4 + inline styles via CSS variables
- **Tema:** dark por padrão (`data-theme="dark"` no layout)
- **CSS Vars:** definidas em `globals.css` — nunca use hex direto no JSX

---

## Paleta — Dark Mode (primário)

| Token                | Valor             | Uso                                 |
|---------------------|-------------------|-------------------------------------|
| `--bg`              | `#111113`         | Fundo da página                     |
| `--bg-elevated`     | `#111113`         | Sidebar, header, superfícies altas  |
| `--bg-card`         | `#1C1C1E`         | Cards, painéis                      |
| `--bg-hover`        | `#242426`         | Hover states, inputs                |
| `--fg`              | `#FFFFFF`         | Texto primário                      |
| `--fg-muted`        | `#898989`         | Texto secundário, legendas          |
| `--fg-subtle`       | `#6B6B75`         | Labels, placeholders, eixos         |
| `--border`          | `rgba(255,255,255,0.08)` | Bordas hairline              |
| `--border-strong`   | `#383839` | Divisores, separadores           |
| `--accent`          | `#FF3500`         | Ação primária, progresso, destaque  |
| `--accent-fg`       | `#000000`         | Texto sobre fundo accent            |
| `--accent-bright`   | `#D92D00`         | Hover sobre accent                  |
| `--ok`              | `#22C55E`         | Positivo, meta atingida             |
| `--ok-bg`           | `rgba(34,197,94,0.10)` | Background de status ok        |
| `--warn`            | `#F59E0B`         | Atenção (âmbar, distinto do accent laranja)       |
| `--warn-bg`         | `rgba(245,158,11,0.10)` | Background de aviso           |
| `--danger`          | `#FF3B30`         | Crítico, CMV alto, alerta           |
| `--danger-bg`       | `rgba(255,59,48,0.10)` | Background de erro             |

**Regra absoluta:** nunca use hex direto no JSX. Sempre `var(--token)`.

---

## Tipografia

Fonte: **Inter** em todos os contextos.

| Estilo          | Font-size | Weight | Letter-spacing | Uso                         |
|----------------|-----------|--------|----------------|-----------------------------|
| Display        | 22–28px   | 700    | -0.025em       | H1, nome do bar, títulos    |
| Heading        | 18–20px   | 600    | -0.02em        | Seções, sub-títulos         |
| KPI Number     | 24–32px   | 700    | -0.01em        | Receita, ticket, métricas   |
| Body           | 13–14px   | 400    | 0              | Texto corrido               |
| Label / Overline | 10–11px | 600    | 0.08–0.10em    | Maiúsculas, CardOverline    |
| Caption        | 11–12px   | 400–500| 0              | Subtexto, datas             |

**Números:** sempre `fontVariantNumeric: "tabular-nums"` para dados financeiros.

---

## Radii

Escala em uso no dashboard (alinhada ao Figma):

| Valor   | Uso                                                        |
|---------|------------------------------------------------------------|
| `8px`   | Inputs, thumbnails de produto, caixas pequenas             |
| `16px`  | **Cards padrão** — KPI, insight, status, semáforo          |
| `24px`  | **Cards grandes / hero** — Faturado, AI, Top drinks, auth  |
| `9999px`| **Botões (pill)**, chips, badges de status, avatares       |

Não use 4/12/20 em card ou botão — são resíduos do sistema antigo.

**Tokens (globals.css):** `--r-input: 8px` · `--r-card: 16px` · `--r-hero: 24px` · `--r-pill: 9999px`. Todo raio de card/input/botão vem da escala 8/16/24/pill — nada de valor solto (6, 10, 12, 14, 20…). Varredura feita jul/2026: 59 arquivos snapados pra escala.

---

## Sombras

**Nenhuma.** Elevação é comunicada exclusivamente por contraste de cor entre `--bg`, `--bg-elevated`, `--bg-card`.

Exceção: tooltips podem usar `box-shadow: 0 4px 16px rgba(0,0,0,0.4)`.

---

## Margem de página (REGRA — vale pra TODAS as telas)

Margem lateral (horizontal) de toda tela — dashboard **e** landing. **Regra dura, sem exceção por tela:**

| Tela | Largura | Margem lateral |
|---|---|---|
| Celular | `< 768px` | **24px** |
| iPad / tablet | `768–1279px` | **32px** |
| Desktop | `≥ 1280px` | **56px** |

**Como aplicar:** use a classe **`.page-x`** (definida em `globals.css` via `--page-x` + media queries). Uma fonte só — muda lá, muda em todo lugar.

- Dashboard: o `.page-x` fica no `<main>` do `dashboard-layout-client`. As páginas **não** põem `px-*` próprio (senão dobra).
- Landing: cada seção usa `.page-x`.
- **Nunca** hardcode `px-6`, `lg:px-10`, `lg:px-8` etc. pra margem de página. Isso foi centralizado de propósito (custava horas de retrabalho no responsivo).

---

## Grid do Dashboard

```
┌─ Sidebar (220px) ──┬─ Main Content ────────────────────────┐
│                    │ [LiveBar — full width]                 │
│                    │─────────────────────────────────────── │
│                    │  padding: 28px 32px                    │
│                    │  gap: 24px entre zonas                 │
│                    │                                        │
│                    │  1. Header (bar name + date)           │
│                    │  2. KPI Strip: 4 cards, 1fr each       │
│                    │  3. Main: 1fr + 260px (chart + col)    │
│                    │  4. Bottom: 3 × 1fr                    │
│                    │  5. AI Input                           │
└────────────────────┴────────────────────────────────────────┘
```

Breakpoints:
- `< 768px`: sidebar vira drawer, grids colapsam para 1 coluna
- `768–1024px`: KPI strip 2×2, main area coluna única
- `> 1024px`: layout completo conforme acima

---

## Componentes base

### DashCard
```tsx
// background: var(--bg-card)
// border: 1px solid var(--border)
// borderRadius: 16px (padrão) | 24px (card grande/hero)
// padding: 24px | 32px (hero)

<DashCard>...</DashCard>
<DashCard style={{ padding: "16px 18px" }}>...</DashCard>
<DashCard accentLeft="var(--danger)">...</DashCard>
```

### CardOverline
```tsx
// font-size: 10px | weight: 600 | uppercase | letter-spacing: 0.09em
// color: var(--fg-subtle) | margin-bottom: 10px

<CardOverline>Receita</CardOverline>
```

### TrendText
```tsx
// Exibe delta percentual com seta e cor semântica
// ok = var(--ok), danger = var(--danger)
// texto envoltório usa var(--fg-muted)

<TrendText percent={12.5} comparativoLabel="vs ontem" />
<TrendText percent={-3.2} invert />  // positivo = ruim (ex: CMV)
```

### BarChart
```tsx
// Barras: gradiente laranja (rgba(255,53,0,0.90) → rgba(255,53,0,0.25))
// Eixo X: var(--fg-subtle)
// Cursor hover: rgba(255,53,0,0.06)
// fill=true: preench 100% da altura do container

<BarChart data={[{label:"Seg",value:1200}]} />
<BarChart data={dados} fill />  // preenche container (flex:1)
```

---

## Padrões proibidos

- ❌ Hex direto: `color: "#FF3500"` → use `color: "var(--accent)"`
- ❌ `rgba(255,255,255,X)` hardcoded para texto → use `var(--fg-subtle)`, `var(--fg-muted)`
- ❌ `borderRadius: 0` para cards → use `var(--radius-lg)`
- ❌ `background: "var(--bg-inset)"` → token removido, use `var(--bg-hover)`
- ❌ `fontFamily: "var(--font-mono)"` para display → use `var(--font-sans)` (ambos apontam para Inter, mas semântica importa)
- ❌ Shadows em cards → elevação via cor
- ❌ Gradients decorativos → não existe no sistema

---

## Tipografia — escala completa

### Dashboard / Auth (px fixos, viewport controlado)

| Estilo            | Font-size | Weight | Letter-spacing | Uso                         |
|------------------|-----------|--------|----------------|-----------------------------|
| Display          | 22–28px   | 700    | -0.025em       | H1, nome do bar, títulos    |
| Heading          | 18–20px   | 600    | -0.02em        | Seções, sub-títulos         |
| KPI Number       | 24–32px   | 700    | -0.01em        | Receita, ticket, métricas   |
| Body             | 13–14px   | 400    | 0              | Texto corrido               |
| Label / Overline | 10–11px   | 600    | 0.08–0.10em    | Maiúsculas, CardOverline    |
| Caption          | 11–12px   | 400–500| 0              | Subtexto, datas             |

### Landing page (fluid com clamp)

| Estilo           | clamp                              | Uso                                    |
|-----------------|------------------------------------|----------------------------------------|
| H1 Hero         | `clamp(2.5rem, 8vw, 72px)`         | Headline principal                     |
| H2 Grande       | `clamp(1.75rem, 8vw, 3rem)`        | Seções de impacto (Dores, Dono)        |
| H2 Padrão       | `clamp(1.375rem, 5.5vw, 2rem)`     | FAQ, Processo, Contato, Para Você      |
| Subtítulo       | `clamp(1rem, 2.5vw, 1.25rem)`      | Parágrafos descritivos                 |
| Card title      | `clamp(1.125rem, 3vw, 1.375rem)`   | Títulos de cards menores               |
| CTA display     | `clamp(3rem, 10vw, 9rem)`          | "INTELIGENTE." — único uso             |
| CTA pre-title   | `clamp(1.25rem, 3.5vw, 3.25rem)`   | "Seu bar ficou super"                  |

**Regras gerais de tipografia:**
- `fontFamily: "var(--font-sans)"` em todos os elementos (sem exceção)
- `--font-display` e `--font-mono` são aliases — preferir `--font-sans` diretamente
- Sentence case em todo texto de UI (exceto "INTELIGENTE." na CTA — único caso de all caps intencional)
- `text-balance` em todos os headings e subtítulos para quebra de linha equilibrada
- `letterSpacing: "-0.02em"` em H1/H2 grandes; `"-0.01em"` em H2 padrões

---

## Botões

**Regra dura:** TODO botão é **pill** (`border-radius: 9999px`). Nunca use raios diferentes (4/8/12) em botões — isso quebra o padrão. Sempre que possível use o componente `<Button>` (`src/components/ui/button.tsx`), não botão na mão.

| Variante (componente) | Background   | Texto      | Borda  | Border-radius | Uso                        |
|-----------------------|-------------|-----------|--------|---------------|----------------------------|
| `primary`             | `#FF3500`   | `#111113` | none   | 9999px        | CTA principal em todas as telas |
| `secondary`           | transparente | `var(--fg)` | `1px solid var(--border-strong)` | 9999px | Ações secundárias (Cancelar, etc.) |
| `ghost`               | transparente | `var(--fg-muted)` | none | 9999px | Ações terciárias |
| `danger`              | `var(--danger)` | `#fff` | none | 9999px | Ações destrutivas |

Tamanhos (componente): `sm` = h-8 / px-4 / 13px · `default` = h-10 / px-6 / 15px · `lg` = h-11 / px-6 / 15px. Altura mínima operacional (iPad) via variantes `op` (≥52px).

---

## Inputs

```css
background: var(--bg-card);          /* #1C1C1E */
border: 1px solid #2C2C2E;
border-radius: 12px;
padding: 14px 16px;
color: var(--fg);
font-size: 14px;
colorScheme: dark;

/* focus */
border-color: rgba(255,53,0,0.5);  /* accent com opacidade */
outline: none;
```

Placeholder: `color: var(--fg-subtle)`.

---

## Landing page (marketing)

A landing page (`/`) usa o **mesmo sistema de design** que o dashboard. Não existem duas paletas — existe uma paleta, aplicada em dois contextos.

### Hierarquia de fundos na landing

| Área                                        | Cor                          |
|--------------------------------------------|------------------------------|
| Fundo geral do site                        | `#111113`                    |
| Hero (gradient topo → fundo)               | `#111113` → `#111113`       |
| Seção CTA "INTELIGENTE."                   | `#FF3500` (laranja)            |
| Cards de dores / processo mobile           | `#1C1C1E`                    |
| Cards processo desktop (profundidade)      | `#1C1C1E` / `#232325` / `#2A2A2C` |
| Modal de contato                           | `#FF3500` (laranja)            |
| Footer                                     | `#111113`                    |

### Cards na landing

Todo card da landing usa `border: "1px solid #2C2C2E"`, `borderRadius: 16px` (`rounded-2xl`).

Os 3 cards do Processo criam profundidade com tons progressivos: `#1C1C1E` → `#232325` → `#2A2A2C`. Divider interno: `rgba(255,255,255,0.1)`.

### Serrilhado (zigzag)

Usado como separador entre seções de cores distintas. Fill = cor da seção adjacente. Nunca inventar outra forma de separação.

### Accent na landing

Idêntico ao dashboard: `#FF3500`. Aplicado em títulos de cards de dores, check icons, CTAs primários, FAQ, badges da parallax.

### Regra absoluta

Nunca crie "a paleta da landing" separada "da paleta do dashboard". Uma paleta, dois contextos. Qualquer valor novo que não caiba nos tokens existentes deve ser documentado aqui — nunca improvisado inline.

---

## Auth (login, cadastro, recuperar-senha)

Mesma linguagem visual da landing page. Regras:

- **Fundo:** gradient `#111113` → `#111113` (igual ao hero)
- **Logo:** `logo-superbar.svg`, `width: 64px`, posição `top: 32px, left: 32px` (ou `px-4 md:px-8 lg:px-14`)
- **Card:** `background: #1C1C1E`, `border: 1px solid #2C2C2E`, `borderRadius: 20px`
- **H1:** `clamp(1.375rem, 5.5vw, 2rem)`, weight 600, `letterSpacing: "-0.01em"`, `color: var(--fg)`
- **Inputs:** conforme seção Inputs acima (bg `#1C1C1E`, border `#2C2C2E`)
- **Botão primário:** variante Primary (laranja `#FF3500`, texto preto, pill)
- **Links auxiliares** (esqueceu senha, criar conta): `color: var(--fg-muted)`, font-size 13px, sem sublinhado por padrão

---

## Referências

- Inspiração técnica: Linear, Vercel, Stripe Dashboard
- Acento laranja: comunica premium, hospitalidade, spirits, receita (diferente de todos os concorrentes que usam azul)
- "Zinc palette" (Tailwind): bg `#111113` = zinc-950, card `#1C1C1E` = zinc-900 custom

---

## Biblioteca de componentes (Figma DS)

O DS vive no Figma (arquivo **Superbar - Design System**) e é a fonte dos componentes. Publicado como biblioteca — **instanciar, nunca recriar na mão**. Os componentes de código em `src/components/ui` devem espelhar estes.

### Base (`🧱 Components / Base`)
- **Button** — Type (Primary/Secondary/Ghost) × Size (MD/SM) × Icon (None/Leading). Primary = `#FF3500`, texto `#111113`, pill.
- **Icon button** — botão de ícone 48px (câmera, busca das tabs).
- **Badge** — Status (Neutral/Positive/Warning/Danger). Ponto + label.
- **Count badge** — contador numérico (notificação, quantidade). Círculo laranja.
- **Chip** — State (Default/Active). Filtros, categorias, seletores de tempo.
- **Input** — State (Default/Focus).
- **Avatar** · **Progress bar**.

### Complexos (`🧩 Components / Complex`)
- **Nav item** (Default/Active) · **KPI card** (Progress/Delta) · **Ranked row** · **Top bar**
- **Stock item row** (Severity × Tag) · **Status card** (Critical/Warning/Ok)
- **Client row** · **Team member row**
- **Mesa card** (Aguardando/Aberta) · **Mesa card livre** · **Produto card** (Default/Selected/Variação)
- **User menu**

### Escala tipográfica — Figma (fonte de verdade)

**Landing:** Display 72 · H1 56 · H2 40 · H3 30 · H4 24 · Body L 20 · Body 16 · Small 14 · Overline 12 (Semi Bold, +8% tracking).
**Dashboard:** Metric 64 · Display 32 · Heading 24 · Title 18 · Title Medium 18 · Body 15 · Body Medium 15 · Body Strong 15 · Small 13 · Small Medium 13 · Label 13 · Badge 9.

> Nota: os text styles de Dashboard no Figma estão com `line-height 100%` — no código usamos line-heights web (1.1–1.55) para não cortar descendente. Corrigir o LH no Figma quando possível.

### Spacing (base-4) — RÉGUA ÚNICA, valor fora da grade = bug
Escala: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 48**. Nunca `6`, `10`, `14`, `22` etc. (arredonda pro vizinho: 6→8, 10→12, 14→16, 22→24).

**Mapa semântico (dashboard) — use o valor certo pro contexto, não o que "parece":**

| Contexto | `gap`/`padding` |
|---|---|
| Entre seções da página (rhythm vertical) | **24** (`gap-6`) |
| Grid de cards irmãos (KPIs, guia, semáforo) | **16** (`gap-4`) |
| Padding interno de card | **20** |
| Ícone+texto, chips, grupos inline | **8** |
| Grupos de rótulo/legenda | **12** |

Todo card-grid do dashboard usa **16** — não misturar 16 e 24 pro mesmo tipo de elemento. Espaço mora em `gap`/`padding` inline hoje (sem token), então a disciplina é humana: qualquer PR com valor fora da escala é regressão.

**Ferramenta (lente, não gate):** `npm run check:spacing` lista os valores numéricos fora da base-4 por arquivo (informativo, não quebra o build). Um lint que **bloqueia** aqui não vale a pena: ou vira `error` e quebra nos milhares de valores existentes, ou vira ruído. Então: conserte **com o olho na tela** (o valor certo depende do contexto, ver mapa acima), não em sweep cego — trocar `9→8` no escuro desloca layout sem você ver. Débito atual (jul/2026): ~208 ocorrências, concentradas em menu-cliente, admin e bartender.

### Pendências de reconciliação (Figma ↔ código)
- **`--fg-subtle` (`#6B6B75`)** ainda diverge do Figma `text/subtle #C7C7C7` (o Figma é mais claro que o muted; o código é mais escuro). **Decisão pendente**: alinhar o código ao Figma ou corrigir o Figma.
- **Tema claro (`:root`)** ainda com valores antigos (`--accent-bright #FF5A2C`, `--danger #DC2626`, `--ok #16A34A`) — só relevante se o tema claro for usado.

### Padrões já unificados (não regredir)
- **Header de tela** (dashboard): título **18px Medium** + subtítulo inline 13px muted + divisória `1px var(--border-strong)`. Vale para todas as telas do dono. **Sem data no header** (a data é do dashboard home, não das telas internas — era um resíduo só em Mesas).
- **Cards**: `var(--border)` + radius **16** (padrão) ou **24** (grande/hero). Nunca `#2C2C2E`/20 no dashboard.
- **Botões — FONTE ÚNICA**: sempre pill (9999), peso **500**, altura **h-10** (default) / **h-8** (sm), texto **15px** (default) / **13px** (sm). Use o componente `<Button>`. `EmptyStateButton` e `BTN_PRIMARY/SECONDARY` (@/lib/ui) espelham o `<Button>` com **altura fixa 40px** (não padding vertical — senão dá diferença de ~2px) — se mudar um, alinhar os três. **Proibido** botão na mão com radius 8, peso 600 ou tamanho próprio.
  - **Qual tamanho:** ação **proeminente** — header de tela, empty-state, rodapé de modal, CTA — é **default (h-10)**, SEMPRE. `sm` (h-8) é **só** para controle **denso inline** (editar-no-lugar, chip, toolbar compacta tipo seletor de período). Nunca use `sm` numa ação de header — foi o que fez "Nova mesa" (40px) ≠ "Importar NF-e"/"Novo cliente" (32px). Na dúvida, é default.
- **Fonte**: Inter em tudo. Não usar `var(--font-mono)` (é alias de Inter, mas polui) — usar `var(--font-sans)`.
- **Empty state — FONTE ÚNICA**: use SEMPRE o componente `<EmptyState>` (`ui/empty-state.tsx`) — ícone (emoji) + título + descrição + **ação em botão** (`<EmptyStateButton>`, primário; secundário quando a ação é ir pra outra tela). Centralizado H+V (cresce no flex), **sem card/borda em volta**. E **esconda os cards de stat/KPI quando a tela está vazia** (semáforo do Estoque, KPIs de Clientes) — aí o empty state manda sozinho. Proibido: empty state dentro de card, com link de texto solto no lugar de botão, ou stats zerados por cima. **Botão sempre primário** (mesmo quando leva pra outra tela) pra ficar igual em todas.

**Pra centralizar de verdade (H+V):** o `<EmptyState>` cresce com `flex:1`, mas só centraliza se o WRAPPER DA PÁGINA for coluna full-height. Toda página do dono que pode ficar vazia usa `className="py-6 lg:py-8 flex flex-col min-h-full"` (ou `lg:h-full`). Sem isso, o empty state cola no topo (foi o bug de Mesas ≠ Cardápio). Empty state em tabela: renderize FORA da tabela quando vazio (não num `<td>`).

---

## Superfície operacional (iPad — Garçom / Bartender / Caixa)

Mesma paleta e tokens do dashboard; layout otimizado para toque em iPad (targets ≥ 44px, idealmente 52px via variantes `op` do `<Button>`). Fundo `var(--bg)`.

### TopBar (67px)
Logo (círculo laranja 34px) + `SUPERBAR` (15px Semi Bold) à esquerda · nome do bar (18px Medium) ao centro · **User menu** (pill: nome + "· Trocar") e **Sair** (Button `ghost sm`) à direita. Divisória inferior `1px var(--border-strong)`.

### Seleção de operador ("Quem está operando agora?")
- Título: **15px Medium `--fg-muted`, normal-case** (nunca caixa-alta).
- Card de operador: `var(--bg-card)`, borda `var(--border)`, **radius 16**, largura 160, centralizado. Avatar 64px circular com anel laranja sutil. Nome **18px Semi Bold `--fg`**, função **13px `--fg-muted`**. Hover: tinte de accent na borda/fundo.

### Grid de mesas (Garçom)
- Heading de contagem: **32px Bold** ("N ocupadas" / "Todas livres").
- Label de seção: **13px Semi Bold `--fg-muted`, normal-case** + contagem em `--fg-subtle`.
- **Card livre** (r12, pad 16): título 18px Medium · "N lugares" 13px muted · **"+ Abrir comanda"** como pill pequeno (contorno `--border-strong`, texto `--accent`).
- **Card ocupado** (r14): nome + preço (15px Semi Bold) / divisória / status (15px Medium). Borda por estado — **chamada = `--danger`**, **aguardando pagamento = `--warn` (âmbar)**, aberta = `--border`.
