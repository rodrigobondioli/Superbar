# SUPERBAR — Auditoria de Responsividade e Compatibilidade

**Método (honesto):** análise estática do código (breakpoints, larguras fixas, viewport, tap targets). **Não** houve renderização real em cada device — itens que só um pixel confirma estão marcados **Não comprovado**, a fechar com Playwright.

---

## Comprovadamente BOM

- **Tap targets ≥ 44px** nos botões de ação do bartender — `fila-pedidos.tsx` (`minHeight: 44`). Bate o piso do PRODUCT.md.
- **Responsividade real via Tailwind** — 128× `lg:`, 70× `md:`, 37× `max-lg:`, 33× `sm:`. Não é app desktop-fixo.
- **Bartender reflui entre orientações** — `mesas-grid.tsx`: `flex-col lg:flex-row`; as "mesas livres" ficam no trilho lateral (`hidden lg:flex`) em paisagem e migram pra coluna principal (`lg:hidden`) em retrato. Nada essencial some.
- **Loading states** nas rotas críticas — `loading.tsx` em bartender, caixa, garçom, dashboard.
- **Tema dark + alto contraste** — cobre "ambiente escuro / brilho reduzido".

---

## Achados por prioridade

### P2 — Zoom desabilitado globalmente — ✅ CORRIGIDO nesta rodada
- Tela: todas · `app/layout.tsx`.
- Evidência: viewport global tinha `maximumScale: 1, userScalable: false` → bloqueava pinch-zoom em todo o sistema (falha WCAG 1.4.4, contradiz "WCAG AA como piso").
- Correção aplicada: zoom **liberado no root** (menu do cliente, dashboard, landing) e **desabilitado só no grupo `(operacional)`** via `export const viewport` em `(operacional)/layout.tsx` (evita zoom acidental no toque rápido).

### P2 — Admin (CRM) quebra em telas pequenas
- Tela: Admin · `admin-bares-table.tsx` (tabela `minWidth: 960`) + painéis de lead `width: 520`/`440` fixos.
- Breakpoint: < 960px (tablet retrato, phone).
- Evidência: tabela força scroll horizontal; drawer fixo de 520px fica mais largo que a tela num phone (375px).
- Impacto: baixo — admin é de uso do dono, desktop. Só vaza se abrir o CRM no celular.
- Solução: `width: min(520px, 100vw)` nos drawers; wrapper `overflow-x: auto` contido nas tabelas.

### P3 — `useIsMobile` local a um componente
- Só `operacao-ao-vivo.tsx` tem hook JS de responsividade; o resto usa Tailwind. Inconsistência (não bug). Solução: extrair pra hook compartilhado.

### P1 — Bartender depende de paisagem — RETRATADO (era falso alarme)
- Reavaliação: o layout **reflui corretamente** em retrato (livres migram pra coluna principal). Não há perda de função. Rebaixado a não-issue.

---

## Não comprovado (precisa device/visual — fechar com Playwright)

- **Teclado virtual** cobrindo inputs no garçom (phone) e menu QR.
- **Overflow real** em 1366×768 / 4K com conteúdo dinâmico (nomes longos, muitos produtos).
- **Áreas de toque** de TODOS os botões (amostrei bartender; não varri caixa/garçom inteiros).
- **Luvas / tela molhada** — limitação de hardware (touch capacitivo), não de código.

**Como fechar:** rodar o Playwright (já instalado) contra as telas operacionais em iPad retrato/paisagem, iPhone SE e 1366×768, com screenshots — vira veredito, não hipótese.

---

## Veredito

A base responsiva é **sólida** (breakpoints reais, reflow correto no bartender, tap targets, dark). O único furo de código relevante era o zoom global — **já corrigido**. Os demais são de baixo impacto operacional (admin/desktop) ou dependem de teste visual em device. Para as telas do cliente (200 pessoas) o ponto mais provável a validar é o teclado virtual no menu QR.
