# Referência de DASHBOARD (produto por dentro) — Backbar × WISK

**O que é:** notas da navegação real do Backbar (conta Pro trial, "Aurora Bar"), jul/2026 — onboarding, navegação, filtros, usabilidade e o catálogo de inteligência. **Não é pra copiar tela; é pra roubar o que é bom e traduzir pro registro premium/BR do SUPERBAR.** Régua: os 12 princípios. Implementação vem depois.

---

## 1. Arquitetura de informação (navegação)

Sidebar fixa, 7 itens, ícone + label:
`Dashboard · Inventory · Orders · Menu · Sales · Reports · Support`
- Inventory / Orders / Sales têm **submenu expansível** (chevron).
- Rodapé da sidebar: **banner de trial persistente** ("Pro trial · 30 days left · Explore trial & discounts") — CTA de upgrade sempre à vista.
- Header central: **nome do bar**; canto: sino de notificação (com badge) + avatar.
- Moeda já aparece localizada (`R$`) — eles têm i18n de moeda.

**Insight:** navegação por **domínio de tarefa** (inventário, compras, menu, vendas, relatórios), não por tela solta. O banner de trial no rodapé é venda passiva constante.

---

## 2. Onboarding (o achado principal)

### 2a. Checklist "primeiros passos" fixo no Dashboard — com % de progresso
Widget "**Welcome to Backbar! 29%**" com barra de progresso e tarefas marcáveis:
- ✓ Create your account
- ○ Set up your inventory
- ○ Complete an inventory session
- ○ Invite your team
- ✓ Add a vendor
- ○ Assign sizes to inventory items
- ○ Place an order
- Link: "Need help getting started? →"

Fica no dashboard até completar. É onboarding **guiado, persistente e mensurável** — puxa o dono pelos passos certos na ordem certa.

### 2b. Import Wizard em 3 passos (`/inventory/import-wizard/1..3`)
1. **Upload da planilha** — "Upload your Excel spreadsheet in the correct format" + **Download template** + drag & drop/browse.
2. **Map & review** — "Map your spreadsheet columns to the matching data type. Skip any column and edit fields. Selecting Overwrite data will update current data." (mapeamento **manual** de coluna→campo).
3. Confirmar/importar.

> **SUPERBAR já está à frente:** o teu import de cardápio usa **IA** pra mapear as colunas; o Backbar faz na mão.

### 2c. Empty-state de inventário (`/inventory/manage`)
Modal "**Add Your Inventory Items to Begin!**" com escolha binária:
- **Import Existing spreadsheet (recommended)**
- **Build from scratch**

> Mesmo padrão que já implementei no teu Estoque (NF-e vs cardápio). Confirmado como boa prática.

---

## 3. Inventário

- **Modelo do item:** Bin · Name · Type · Subtype · Tag · Size · **Vendor** · **Cost** · **Par** · Quantity.
- Barra superior: **Search/Filter** (nome, atributo ou tag), **Actions**, **Filters**, **Import**, **Export**, **Add item**.
- Paginação: 25/50/100/250 por página.
- Conceitos-chave: **Par** (nível de reposição), **Bin** (localização física), **Tag** (livre, pra filtrar/agrupar), **Size** (tamanho/embalagem — passo explícito no onboarding "assign sizes").

**Insight:** eles tratam **Vendor, Cost, Par e Size** como cidadãos de primeira classe do item. Tag livre + filtro é usabilidade forte pra bar com muitos SKUs.

---

## 4. Compras / Nota (Orders) — *das páginas de feature (tela direta não abriu)*

- **Upload de nota** → OCR entra contagem, custo e **produtos novos** automaticamente (é o Balde 1 deles; lá é foto/OCR, tu tem **NF-e XML** = mais confiável).
- **1-Click Purchasing** — cria e envia pedido pra **vários fornecedores** de uma vez.
- **Order reminders** — lembrete pra não perder o prazo de pedido.
- **Cost variance alerts / tracker** — avisa quando o custo de um produto sobe → "pra informar quando mudar o preço do menu".
- **FIFO** — custo se ajusta conforme vende (primeiro que entra, primeiro que sai).
- **Product Connect** — pré-carrega produtos que tu provavelmente usa (nome, custo, tamanho, fornecedor) via parceria com distribuidoras (o "cadastro-mãe").

---

## 5. Menu / Cardápio digital (`/menu/manage`)

- **Toggles de categoria** pra exibir: Wine, Beer, Spirits, Others, Cocktails, Food.
- **Embed no site** (iframe copiável).
- **QR code** — download pra table topper / poster / estação de pedido.
- **URL customizável** do menu (`menu.backbar.app/<slug>`) — feature paga.

> Primo do teu menu QR. Detalhe bom: **toggle de categoria por menu** + **URL custom** + embed.

---

## 6. Reports / Inteligência (o coração — 3 abas, ~25 relatórios)

Topo: **Inventory value** + **Order amount this month** (KPIs) + gráfico por período. Banner "Premium reports unlocked with Pro trial".

**Inventory reports**
- Inventory overview (resumo por tipo de produto) · Inventory details (nível produto)
- Session overview / Session details (valor por local)
- Inventory trends overview / trends comparison (ao longo do tempo)
- Comparison overview / details (compara sessões entre 2 datas)
- **Excess inventory** — produtos com estoque muito acima do uso típico → *libera caixa*
- Usage details / Usage trends (consumo, médias)
- **Cost of goods sold overview** — COGS (pour cost) % por tipo de drink
- **Pricing, pour costs & profits** — preço, pour cost % e lucro de todos os itens do menu
- Transfers (histórico entre locais)

**Order reports**
- Spend overview · Spend by vendor · Order item details · Itemized order items (com as notas)
- Spending trends · Order trends comparison
- **Cost variance tracker** — mudanças de custo ao longo do tempo → quando mudar preço

**Sales reports** *(exige POS conectado)*
- Sales overview / trends / comparison
- **COGS details** — pour cost % por produto e categoria
- **Profit details** — venda, custo e lucro por produto/categoria
- **Variance details** — **variância entre venda e consumo real** (teórico × real — o matador; pega furo/roubo/erro de dose)

**Insight (Princípio 1):** todo relatório responde a uma **decisão de dinheiro** — pour cost, margem, excesso de caixa, variância. É exatamente o registro do SUPERBAR, só que em linguagem de gestor. Tradução premium: mesmo cálculo, enquadrado como **orgulho/curadoria/decisão**, não planilha.

---

## 7. Padrões de usabilidade notáveis (roubar)

1. **Checklist de onboarding com % no dashboard** — guia persistente.
2. **Empty-state que ensina** — "recommended" no caminho certo, alternativa ao lado.
3. **Import wizard em passos numerados** (upload → mapear → confirmar) com **template pra baixar**.
4. **Filtro por Tag livre + Search** no inventário — escala pra muitos SKUs.
5. **Par level** como conceito central (reposição sugerida).
6. **Cost variance** como alerta *e* relatório — o custo é o herói.
7. **QR menu com URL custom + toggle de categoria**.
8. **Banner de trial/upgrade sempre visível** (venda passiva) — *cuidado: no SUPERBAR é tudo incluído (Princípio 7), então isso vira "primeiros passos", não upsell*.

---

## 8. O QUE TRAZER PRO SUPERBAR (priorizado, com a régua)

| Prioridade | Ideia do Backbar | Como fica no SUPERBAR (registro premium) | Princípio | Estado hoje |
|---|---|---|---|---|
| **Alta** | Checklist de onboarding com % no dashboard | "Primeiros passos" guiado: cardápio → NF-e → ficha → equipe, com progresso | 10, 12, 11 | Backend `getPrimeirosPassos` existe; falta o checklist visível |
| **Alta** | Cost variance alert | Alerta "o custo do gin subiu 18% — revê o preço do Negroni" (via NF-e) | 1 | Não existe — NF-e já dá a base |
| **Alta** | Excess inventory (caixa parado) | "Você tem R$ X parado em estoque acima do giro" | 1 | Não existe |
| Média | Par level / reposição sugerida | Já tens "Comprar X" — evoluir pra par por consumo real | 1, 2 | Parcial |
| Média | Variância venda × consumo (teórico×real) | O matador — mas depende de PDV (Fase 2) | 1, 4 | Depende de PDV |
| Média | Product Connect (cadastro-mãe) | Base PT-BR de insumos crescendo das NF-e | 5 | Começando via `nfe_item_map` |
| Baixa | Tag livre + filtro no estoque | Filtro por tag pra bar com muitos SKUs | 11 | Não existe |
| Baixa | URL custom do menu QR | Slug custom + toggle de categoria | 6 | Menu QR existe; sem custom URL |

**Não trazer (Balde 3 / anti-princípio):**
- Banner de upsell por feature → fere Princípio 7 (tudo incluído).
- PO/recebimento/contagem física/hardware → vira sisteminha (Princípio 2/4).

**Sequência sugerida (a decidir com o oráculo):** checklist de onboarding → cost variance alert → excess inventory. Os três são inteligência pura (Princípio 1) e independem de PDV.

---

# WISK.ai — captura (página pública; produto é demo-gated)

**Nota:** o WISK **não tem self-serve free** (entrada no produto exige demo com vendedor), então aqui é a página de produto + a jornada que eles publicam. Posicionamento **mais premium** que o Backbar — o mais perto do recorte do SUPERBAR.

## Como o WISK funciona (onboarding em 4 passos, linear)
1. **Setup & First Inventory** — cria áreas de estoque, **scaneia código de barras** pra adicionar itens, submete contagem.
2. **Adding Invoices & Second Inventory** — insere custo, **vincula item ao distribuidor**.
3. **Placing / Receiving Orders** — gera PO, anexa nota a partir dele.
4. **Sales & Variance** — importa venda do PDV, adiciona receita, entende **variância**.

> Mesma espinha: inventário → nota/custo → pedido → venda/variância. Reforça a jornada guiada.

## Features (da página)
- **Base de 200.000 garrafas** → "primeiro inventário imediato, sem setup". O cadastro-mãe como **headline de venda**.
- **Barcode scanner + balança Bluetooth de precisão** (pesa garrafa parcial → nível exato). *Hardware — Balde 3 pra nós.*
- **POS integration (60+ sistemas)** — sync real-time de venda + variância.
- **Invoice Management** — scaneia nota, **auto-casa com PO + comprovante de entrega, sinaliza divergências**.
- **Liquor Cost Calculator** — identifica itens de venda **sem custo**, auto-casa com receita, calcula pour cost com **preço da última nota**, **sinaliza receita faltando**; ordena por **impacto de custo/venda**.
- **Recipe & Batching** — receitas, **sub-receitas**, batch, custo + mão de obra.
- **Actual vs Theoretical** — variância venda × consumo real (o matador).
- **Reports & Alerts** — tempo real + **alertas instantâneos** de estoque e variância.
- **Mobile-first + offline**.
- **Full-service vs self-service** — eles fazem o setup por ti, ou DIY.

## O que as reviews revelam do dashboard (G2/Capterra — sem login, demo-gated)
- Nota **4,4/5** (380+ avaliações). Elogio recorrente: **"melhor interface e UX"** entre os apps de inventário testados; "user-friendly pra qualquer um".
- Núcleo do produto: **contagem mobile** (câmera/scanner + escala Bluetooth), **invoice OCR**, **recipe costing**, **depleção sincronizada com o PDV** (perpetual inventory).
- Destaques de UI citados: **PAR levels auto-gerados**, **e-mails de pedido automáticos**, alertas/notificações, reporting/analytics, search/filter.
- Fraquezas citadas: **sem trial** (só demo), **preço alto** ($199–$799/mês), mudanças de design que incomodaram parte dos usuários.
- **Limite honesto:** não naveguei o app logado (demo-gated). Isto é reconstrução de fontes públicas — pra telas reais, só com a demo agendada.

## Posicionamento (roubar a linguagem, não a operação)
- "*Because you're serious about your beverage program.*"
- Venues: upscale cocktail bars, luxury hotel bars, high-end wine bars, exclusive clubs, fine-dining, speakeasies.
- Papéis: Beverage Director, Sommelier, Head Bartender.
- Prova social: "de 2h pra 20min de inventário", "economiza 4,5h/semana", "previne roubo".

---

# Síntese cruzada (Backbar × WISK) — o que trazer pro SUPERBAR

Onde os dois concordam = aposta segura. Priorizado pela régua (Princípio 1 primeiro):

| # | Ideia (nos dois) | Tradução SUPERBAR | Princípio | Depende de |
|---|---|---|---|---|
| 1 | **Onboarding guiado** (checklist %/passos lineares) | "Primeiros passos": cardápio → NF-e → ficha → equipe, com progresso | 10,11,12 | nada (backend já tem base) |
| 2 | **Cadastro-mãe / setup instantâneo** (200k garrafas / Product Connect) | Base PT-BR crescendo das NF-e → "seu estoque quase pronto" | 5 | NF-e (já começou) |
| 3 | **"O que falta" priorizado** (Liquor Cost Calculator) | "Esses 5 drinks não têm ficha — e são teus mais vendidos" | 1,10 | ficha + venda |
| 4 | **Cost variance alert** | "Custo do gin subiu 18% — revê o Negroni" | 1 | NF-e (já tem base) |
| 5 | **Excess inventory** (caixa parado) | "R$ X parado acima do giro" | 1 | estoque |
| 6 | **Actual vs Theoretical** (variância) | O matador — venda × consumo real | 1,4 | **PDV (Fase 2)** |

**Não trazer:** hardware/balança, contagem física, PO/recebimento fiscal (Balde 3); upsell por feature (fere Princípio 7).

**Diferencial que só o SUPERBAR tem:** NF-e XML (custo mais confiável que OCR/foto dos dois) + BR/PIX + premium/coquetelaria + tudo incluído. Não é paridade — é vantagem estrutural.

*Próximo: transformar o item 1 (onboarding guiado) e o 4 (cost variance) em decisão de roadmap com o oráculo, e depois implementar.*
