# SUPERBAR — Design System

> **Esta é a única fonte de verdade para decisões visuais.**
> Não improvise estilo. Qualquer decisão fora deste documento é inconsistência.

---

## Filosofia

Clareza antes de decoração. Premium através de contenção.

O design é um argumento: *"Este software é mais inteligente do que você esperava."*
A interface some — os dados falam. Nenhum elemento existe por estética; cada elemento responde a uma pergunta de negócio.

---

## Stack

- **Font:** Inter — única fonte do projeto inteiro (landing page + dashboard + auth)
  - Carregada via `next/font/google` em `src/app/layout.tsx` → variável `--font-sans`
  - `--font-display` e `--font-roboto-mono` são aliases de `--font-sans` definidos em `globals.css`
  - Nunca adicione outra fonte sem decisão explícita
- **Estilo:** Tailwind CSS v4 + inline styles via CSS variables
- **Tema:** dark por padrão (`data-theme="dark"` no layout)
- **CSS Vars:** definidas em `globals.css` — nunca use hex direto no JSX

---

## Paleta — Dark Mode (primário)

| Token                | Valor             | Uso                                 |
|---------------------|-------------------|-------------------------------------|
| `--bg`              | `#0A0A0B`         | Fundo da página                     |
| `--bg-elevated`     | `#111113`         | Sidebar, header, superfícies altas  |
| `--bg-card`         | `#1C1C1E`         | Cards, painéis                      |
| `--bg-hover`        | `#242427`         | Hover states, inputs                |
| `--fg`              | `#FAFAFA`         | Texto primário                      |
| `--fg-muted`        | `#A1A1AA`         | Texto secundário, legendas          |
| `--fg-subtle`       | `#52525B`         | Labels, placeholders, eixos         |
| `--border`          | `rgba(255,255,255,0.08)` | Bordas hairline              |
| `--border-strong`   | `rgba(255,255,255,0.14)` | Divisores, separadores           |
| `--accent`          | `#F59E0B`         | Ação primária, progresso, destaque  |
| `--accent-fg`       | `#000000`         | Texto sobre fundo accent            |
| `--accent-bright`   | `#FCD34D`         | Hover sobre accent                  |
| `--ok`              | `#22C55E`         | Positivo, meta atingida             |
| `--ok-bg`           | `rgba(34,197,94,0.10)` | Background de status ok        |
| `--warn`            | `#F59E0B`         | Atenção (mesmo tom do accent)       |
| `--warn-bg`         | `rgba(245,158,11,0.10)` | Background de aviso           |
| `--danger`          | `#EF4444`         | Crítico, CMV alto, alerta           |
| `--danger-bg`       | `rgba(239,68,68,0.10)` | Background de erro             |

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

| Token          | Valor | Uso                          |
|----------------|-------|------------------------------|
| `--radius-sm`  | 4px   | Badges, botões, inputs       |
| `--radius-md`  | 8px   | Modais, dropdowns            |
| `--radius-lg`  | 12px  | Cards do dashboard (DashCard)|

---

## Sombras

**Nenhuma.** Elevação é comunicada exclusivamente por contraste de cor entre `--bg`, `--bg-elevated`, `--bg-card`.

Exceção: tooltips podem usar `box-shadow: 0 4px 16px rgba(0,0,0,0.4)`.

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
// borderRadius: var(--radius-lg) = 12px
// padding: 20px 24px (padrão) | 16px 18px (compact KPI strip)

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
// Barras: gradiente amber (rgba(245,158,11,0.90) → rgba(245,158,11,0.25))
// Eixo X: var(--fg-subtle)
// Cursor hover: rgba(245,158,11,0.06)
// fill=true: preench 100% da altura do container

<BarChart data={[{label:"Seg",value:1200}]} />
<BarChart data={dados} fill />  // preenche container (flex:1)
```

---

## Padrões proibidos

- ❌ Hex direto: `color: "#F59E0B"` → use `color: "var(--accent)"`
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

| Variante       | Background   | Texto      | Borda  | Border-radius | Uso                        |
|---------------|-------------|-----------|--------|---------------|----------------------------|
| Primary        | `#F59E0B`   | `#000000` | none   | 9999px        | CTA principal em todas as telas |
| Dark           | `#000000`   | `#ffffff` | none   | 9999px        | CTA sobre fundo amber (modal, CTA section) |
| Subtle         | `var(--bg-card)` | `var(--fg)` | `1px solid #2C2C2E` | 9999px | Ações secundárias |
| Destructive    | `var(--danger-bg)` | `var(--danger)` | none | 8px | Ações destrutivas |

Padding padrão: `14px 32px`. Min-height: `44px` (touch target).

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
border-color: rgba(245,158,11,0.5);  /* accent com opacidade */
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
| Hero (gradient topo → fundo)               | `#0A0A0B` → `#111113`       |
| Seção CTA "INTELIGENTE."                   | `#F59E0B` (amber)            |
| Cards de dores / processo mobile           | `#1C1C1E`                    |
| Cards processo desktop (profundidade)      | `#1C1C1E` / `#232325` / `#2A2A2C` |
| Modal de contato                           | `#F59E0B` (amber)            |
| Footer                                     | `#111113`                    |

### Cards na landing

Todo card usa `border: "1px solid #2C2C2E"`, `borderRadius: 20px`.

Os 3 cards do Processo criam profundidade com tons progressivos: `#1C1C1E` → `#232325` → `#2A2A2C`. Divider interno: `rgba(255,255,255,0.1)`.

### Serrilhado (zigzag)

Usado como separador entre seções de cores distintas. Fill = cor da seção adjacente. Nunca inventar outra forma de separação.

### Accent na landing

Idêntico ao dashboard: `#F59E0B`. Aplicado em títulos de cards de dores, check icons, CTAs primários, FAQ, badges da parallax.

### Regra absoluta

Nunca crie "a paleta da landing" separada "da paleta do dashboard". Uma paleta, dois contextos. Qualquer valor novo que não caiba nos tokens existentes deve ser documentado aqui — nunca improvisado inline.

---

## Auth (login, cadastro, recuperar-senha)

Mesma linguagem visual da landing page. Regras:

- **Fundo:** gradient `#0A0A0B` → `#111113` (igual ao hero)
- **Logo:** `logo-superbar.svg`, `width: 64px`, posição `top: 32px, left: 32px` (ou `px-4 md:px-8 lg:px-14`)
- **Card:** `background: #1C1C1E`, `border: 1px solid #2C2C2E`, `borderRadius: 20px`
- **H1:** `clamp(1.375rem, 5.5vw, 2rem)`, weight 600, `letterSpacing: "-0.01em"`, `color: var(--fg)`
- **Inputs:** conforme seção Inputs acima (bg `#1C1C1E`, border `#2C2C2E`)
- **Botão primário:** variante Primary (amber `#F59E0B`, texto preto, pill)
- **Links auxiliares** (esqueceu senha, criar conta): `color: var(--fg-muted)`, font-size 13px, sem sublinhado por padrão

---

## Referências

- Inspiração técnica: Linear, Vercel, Stripe Dashboard
- Acento amber: comunica premium, hospitalidade, spirits, receita (diferente de todos os concorrentes que usam azul)
- "Zinc palette" (Tailwind): bg `#0A0A0B` = zinc-950, card `#1C1C1E` = zinc-900 custom
