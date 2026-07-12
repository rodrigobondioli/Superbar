# Princípios de Dashboard — destilado do Stephen Few (adaptado ao SUPERBAR)

> **O que é este doc:** os princípios atemporais de *Information Dashboard Design*
> (Stephen Few, 2006) traduzidos para a régua do SUPERBAR. **Consulte sempre que
> for criar ou revisar qualquer tela de monitoramento** (Operação ao Vivo,
> Central de Inteligência, Relatórios, telas de KPI).
>
> **Aviso de uso:** o livro é de 2006. Alguns *display media* envelheceram (ele
> ainda combatia gauges 3D e Excel da época). **Use os princípios de percepção e
> de simplicidade — não a estética literal.** Onde o princípio conflitar com o
> `DESIGN.md`, o `DESIGN.md` (contrato visual do SUPERBAR) manda; este doc informa
> a decisão, não a substitui.

---

## A essência (a definição do Few)

> "Exibição visual da informação mais importante para atingir um ou mais
> objetivos, consolidada numa **única tela**, para ser **monitorada num relance**."

Três palavras que decidem tudo: **relance**, **única tela**, **objetivo**. Se
alguém precisa rolar, caçar ou pensar pra entender, o dashboard falhou. O desafio
central é **espremer muita informação num espaço pequeno de forma imediatamente
compreensível.**

O dashboard **não** dá o diagnóstico completo — ele dá o panorama que faz você
perceber, na hora, **o que precisa da sua atenção**. O detalhe pra agir mora um
clique adiante (isso valida o modelo "resumo no ao-vivo → profundidade na
Central de Inteligência").

---

## A técnica-mãe: condensar por RESUMO e EXCEÇÃO

A única forma de caber muita coisa numa tela sem virar ruído:

- **Resumo (summarization):** representar um conjunto de números por um só — soma,
  média, %. (Ex: "CMV do turno 28%", não a lista de 200 itens.)
- **Exceção (exception):** mostrar o detalhe **só quando algo foge do normal**.
  Boa parte da informação só importa quando está fora da faixa esperada.

> Aplicação SUPERBAR: **Operação ao Vivo = resumo** (o estado agora, em números
> de relance). **Central de Inteligência = exceção** (só sobe o que fugiu do
> normal, com o impacto em R$ e a ação). É o Few descrevendo o teu produto.

---

## Os 13 erros comuns (o checklist anti-lixo)

Rode toda tela de dashboard contra esta lista antes de mostrar:

1. **Passar dos limites de uma tela** — se rola ou esprema em abas, não é
   dashboard, é relatório. Corte ou consolide.
2. **Contexto insuficiente pro número** — número solto não decide nada. Todo KPI
   precisa de comparação: vs meta, vs período anterior, vs média. (R$ 5.188 → +12%
   vs ontem? acima ou abaixo da meta?)
3. **Detalhe ou precisão em excesso** — "R$ 5.188,47" onde "R$ 5,2 mil" basta.
   Precisão que ninguém usa é ruído.
4. **Escolher a métrica errada** — medir o que é fácil em vez do que decide
   dinheiro. (Faturamento sem margem engana; margem é a verdade.)
5. **Display media inadequado** — gráfico errado pro dado. Pizza pra comparar
   valores, linha pra categorias sem ordem, etc.
6. **Variedade sem sentido** — usar 5 tipos de gráfico por estética. Consistência
   > variedade. Mesmo tipo de dado, mesmo tipo de exibição.
7. **Display media mal desenhado** — o gráfico certo, mas poluído (legenda
   redundante, eixo desnecessário, 3D).
8. **Codificar quantidade de forma imprecisa** — o olho compara **posição e
   comprimento** com precisão; **área, ângulo e cor**, mal. Prefira barra/posição
   a pizza/bolha. (Por isso barra de progresso > medidor circular.)
9. **Organizar mal os dados** — o mais importante vai pro **canto superior
   esquerdo** (onde o olho ocidental pousa). Agrupe por significado, não por acaso.
10. **Destacar mal (ou não destacar) o que importa** — se tudo tem o mesmo peso
    visual, nada se destaca. O olho precisa ser puxado pro que exige ação.
11. **Poluir com decoração inútil** — chartjunk: bordas, sombras, gradientes,
    ícones enfeite, fundos. Cada pixel não-dado compete com o dado.
12. **Abusar ou usar mal a cor** — cor é **semântica**, não enfeite. Guarde a cor
    forte (o laranja, o vermelho) pra exceção/alerta. Se tudo é colorido, a cor
    perde o poder de sinalizar.
13. **Visual feio / desalinhado** — desalinho e inconsistência custam legibilidade
    e confiança. Feio não é só estética: atrapalha o relance.

---

## Os dois objetivos que guiam cada decisão

Todo design de dashboard gira em torno de duas metas, nesta ordem:

1. **Reduzir os pixels não-dado.** Elimine todo pixel que não é informação
   (grade, borda, fundo, sombra, decoração). O que sobrar de não-dado (rótulos,
   divisórias), **de-enfatize** (cinza, fino) e **regularize** (consistente).
2. **Realçar os pixels-dado.** Depois de limpar, dê clareza e peso ao dado — e
   faça **o mais importante saltar acima do resto**.

Ordem importa: primeiro tira o ruído, depois valoriza o sinal. (Herança do
data-ink ratio do Tufte.)

---

## Codificação: o que o olho lê rápido (percepção)

- **Posição e comprimento** → leitura precisa. Use pra comparar quantidade
  (barras, rankings, posição num eixo).
- **Cor (matiz)** → ótima pra **categorizar e alertar**, péssima pra quantificar.
- **Área, ângulo, volume** → o olho erra. Evite pizza, donut, bolha, 3D.
- **Pré-atenção:** o cérebro detecta em <½ segundo diferenças de cor, tamanho,
  posição e orientação **antes** de "ler". Use isso pra que a exceção salte sem
  esforço (um único item vermelho numa lista cinza grita).

---

## Organização e consistência (usabilidade)

- **Organize por significado e uso** — agrupe por função de negócio / entidade,
  não por tipo de widget. O que se olha junto, fica junto.
- **Importância = posição + tamanho + destaque.** Topo-esquerda e maior = mais
  importante.
- **Whitespace separa melhor que borda.** Prefira espaço a linha/caixa pra
  agrupar (menos pixels não-dado).
- **Consistência** — mesma métrica, mesmo formato, cor e posição em toda tela.
  Interpretação vira reflexo, não decifração.

---

## Como isso amarra no SUPERBAR

- **Princípio 1 (a inteligência é o fim):** o Few dá o método pra que a
  inteligência seja *lida num relance* — resumo + exceção + destaque da ação.
- **Operação ao Vivo:** é o painel de **estado** (resumo, relance). Cada KPI com
  contexto (vs meta/ontem). Sem chartjunk. Cor só pra sinalizar.
- **Central de Inteligência:** é o painel de **exceção + ação**. Só sobe o que
  fugiu do normal, com impacto em R$ e o "faça Y". Nada de "tudo certo" ocupando
  espaço nobre — exceção é o conteúdo.
- **Relatórios:** é onde o Few **permite** ir além da tela única — é o diagnóstico
  de profundidade (evolução, menu engineering). Não precisa caber num relance;
  precisa aprofundar o que o dashboard sinalizou.

> Regra de bolso pra qualquer tela nova: *"Dá pra entender o que exige minha ação
> em 5 segundos, sem rolar e sem decorar legenda?"* Se não, volte aos 13 erros.
