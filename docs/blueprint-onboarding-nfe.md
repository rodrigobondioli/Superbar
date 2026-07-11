# SUPERBAR — Blueprint Fase 1: Onboarding de custo por NF-e

**Decisão de origem:** oráculo (jul/2026) — a entrada de custo é o roadmap, não uma feature. Fase 1 = importar custo da NF-e por XML. Régua: Princípios 10 (custo = inteligência real), 1 (inteligência é o fim), 11 (equipe não alimenta o sistema), 5/12 (dado limpo vira moat).

**Timing:** pós-inauguração. Não é bloqueador de go-live. É o próximo tijolo depois de estabilizar a operação.

**Promessa honesta que a Fase 1 já entrega (Princípio 9):** *"seu custo real por drink, sem digitar nada"* — **não** "inteligência que decide por você" (isso é Fase 2+).

---

## Por que NF-e é vantagem estrutural, não paridade

O Backbar depende de **OCR de foto** de nota (lá fora não há padrão). No Brasil a **NF-e tem XML estruturado da SEFAZ**: produto, valor unitário, unidade e o CNPJ/nome do fornecedor vêm limpos. Parse **determinístico, sem IA**. Dá pra fazer a importação de custo mais confiável que o líder gringo — e o bartender não digita nada (Princípio 11).

---

## Anatomia do XML da NF-e (o que interessa)

```
infNFe
 ├─ emit                → FORNECEDOR: CNPJ, xNome, xFant
 └─ det (array, 1 por item)
     └─ prod            → cProd (cód. interno do fornecedor)
                          cEAN (GTIN/código de barras — chave de ouro do match)
                          xProd (descrição — ex.: "VODKA ABSOLUT 1L")
                          NCM, uCom (unidade comercial), qCom (qtd), vUnCom (custo unit.), vProd
```

O `cEAN` (GTIN) é o pulo do gato: quando a nota traz, o match com o insumo é perfeito. Nem toda nota traz — por isso o match precisa de fallback.

---

## Fluxo (com etapa de preview, como o `importar-cardapio` já faz)

1. **Upload do XML** → parse server-side.
2. **Extrai** fornecedor (`emit`) + itens (`det`).
3. **Casamento item → insumo** (o ponto difícil): para cada item da nota, tenta casar com um `ingredientes` existente do bar, nesta ordem:
   - por **GTIN** (`cEAN`) se houver mapeamento salvo;
   - por **cProd do fornecedor** já mapeado antes;
   - por **nome normalizado** (fuzzy);
   - senão → **sugere criar novo insumo** (o usuário confirma nome + unidade base).
4. **Conversão de unidade**: `uCom` da nota ("CX", "UN", "L") → unidade base do insumo (`un/ml/l/g/kg`) + cálculo do custo por unidade base (ex.: caixa de 12 → custo unitário).
5. **Preview de confirmação**: mostra fornecedor + itens casados + **custo novo vs. custo atual** por insumo. O usuário ajusta o match e confirma. (Mesmo padrão de tela do import de cardápio — nada entra sem revisão.)
6. **Persistência TRANSACIONAL** (a lição das auditorias — nada de import parcial): numa função Postgres `SECURITY DEFINER`, dentro de UMA transação:
   - upsert **fornecedor** (por CNPJ);
   - para cada item: `UPDATE ingredientes SET custo_atual = <vUnCom convertido>, estoque_atual = estoque_atual + qtd`;
   - `INSERT ingrediente_movimentos` (tipo `'compra'`, `custo_unitario`, ref. fornecedor + chave da NF-e);
   - salva o **mapeamento** (GTIN/cProd/nome → ingrediente_id) pro próximo import casar sozinho.

---

## O cadastro-mãe cresce das próprias notas (o moat, Princípio 5)

Não se compra uma base de 300k SKUs do zero. Cada mapeamento confirmado (GTIN/cProd → insumo, com custo e fornecedor) **acumula**. A 2ª nota do mesmo fornecedor casa sozinha; com o tempo, um bar novo importa e já reconhece a maioria dos insumos do dicionário compartilhado. Dado limpo acumulado = vantagem que não se copia.

---

## O que REUSA vs. o que FALTA

**Reusa (já existe no schema):**
- `ingredientes` — alvo do custo (`custo_atual`) e do estoque (`estoque_atual`).
- `ingrediente_movimentos` — audit trail imutável com `custo_unitario` (loga a compra).
- Padrão de **preview → confirmação** do `/api/importar-cardapio`.

**Falta (construir):**
- **Confirmar/definir a tabela `fornecedores`** — a RLS existe mas não há `CREATE TABLE` nas migrations (drift). Definir colunas: `id, bar_id, cnpj, nome, criado_em` + `UNIQUE(bar_id, cnpj)`.
- **Tabela de mapeamento** NF-e-item → insumo (`nfe_item_map`: bar_id, gtin, cprod, fornecedor_id, ingrediente_id) — o aprendizado.
- **Vínculo** `ingrediente_movimentos → fornecedor_id + chave_nfe` (colunas novas) pra rastreabilidade.
- **Parser de XML da NF-e** — o repo não tem lib de XML (só `exceljs`); adicionar `fast-xml-parser`.
- **Conversão de unidade** (uCom → unidade base) — mapa + regra por embalagem.
- **Dedup de nota** — não importar a mesma NF-e 2x (guarda a `chNFe`, chave de 44 dígitos, `UNIQUE`).

---

## MVP honesto da Fase 1 (o que entrega valor sem esperar tudo)

Menor fatia que já cumpre a promessa "custo real sem digitar":

1. Upload XML → parser → extrai fornecedor + itens.
2. Preview com match manual (sem IA, sem cadastro-mãe pronto): o usuário liga cada item da nota a um insumo (ou cria).
3. Confirma → grava custo real + entrada de estoque + movimento, transacional.
4. Salva o mapeamento → o próximo import fica mais automático.

IA (sugestão de match) e o dicionário compartilhado entram **depois**, reduzindo o toque — não são pré-requisito do dia 1.

---

## Fora de escopo (Balde 3 — não construir)

PO/pedido de compra, recebimento, contagem física, hardware, emissão fiscal. É território de PDV/ERP. A promessa do SUPERBAR é **decisão**, não operação (Princípio 2).

---

## Ganchos para as próximas fases

- **Fase 2 (fechar o loop):** cruzar custo (NF-e) com venda (PDV) → variância CMV real vs. teórico + ranking de rentabilidade. Depende de responder: **qual PDV os bares premium-alvo usam?** (pergunta aberta do oráculo). Estratégia: integrar, nunca substituir.
- **Fase 3 (parqueia):** previsão por evento/clima (precisa de histórico limpo), notas de bebida/cultura de equipe.
