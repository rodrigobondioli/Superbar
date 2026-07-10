# SUPERBAR — Documento de Negócio
### A fonte de verdade do projeto

**Versão 1.1 · Julho 2026**
**Status:** decisões de espinha fechadas · preço travado (jul/2026: Fundador R$ 697 / Padrão R$ 1.297 / setup R$ 1.800) · números ainda em fase de validação (nenhum cliente fechado)

---

## Como ler este documento

Este é o documento que manda no projeto. Ele decide **pra quem** é o SUPERBAR, **que dor** resolve, **como ganha dinheiro** e **em que ordem** a gente constrói. Tudo o que vier depois — telas, código, roteiro de vídeo, pitch — tem que bater com o que está aqui. Se algo aqui mudar, muda aqui primeiro.

Ele **substitui** os documentos antigos (D1 a D12), que foram feitos para o produto anterior ("Bar Intelligence Platform"). O produto foi re-escopado para o SUPERBAR. O que era bom nos antigos (pesquisa de dor, unit economics, hipóteses) foi puxado pra cá e atualizado.

Foi montado com os métodos do Osterwalder (os três livros da Strategyzer), mas escrito em português de gente — sem jargão de consultoria. Onde uso uma ferramenta dele, falo o nome dela entre parênteses, pra você saber de onde veio, e pronto.

**Para que mais serve:** é a base do **agente de IA de decisão** que vou construir em cima dele — por isso traz, além da estratégia, os **princípios e critérios de decisão** (logo após a essência). É por eles que o agente (e eu) decide.

**O que este documento NÃO é:** não é o PRD. O PRD (telas, fluxo de dados, stack, specs) é o próximo arquivo e sai daqui.

---

## 1. O que o SUPERBAR é (a essência)

> O SUPERBAR é o **cérebro do bar**: transforma cada pedido, cada comanda e cada noite em **decisão** — quanto se lucra, qual drink dá dinheiro, onde vaza, o que fazer a seguir.

Pra ter esse cérebro, ele também roda a **operação inteira** em tempo real (pedido → bartender → caixa → dono, sem papel e sem grito). Mas não dá pra inverter: **a operação é o meio; a inteligência é o fim — e o diferencial.** Todo o resto existe pra alimentar e afiar essa inteligência.

O produto já está no ar e **nunca vai estar "pronto"** — a inteligência é uma fronteira que a gente empurra pra sempre. Este documento descreve a **visão macro que não muda**, não o estado de hoje (que muda toda semana).

---

## Princípios e critérios de decisão (a base do agente)

Esta é a parte que transforma o documento em cérebro de decisão — inclusive pro agente de IA que vai rodar em cima dele. Quando bater dúvida sobre uma feature, um preço, um cliente ou uma prioridade, decide-se por aqui.

**O norte**
1. **A inteligência é o fim.** Toda decisão de produto começa com uma pergunta: *isso aumenta a capacidade do dono de tomar decisão de dinheiro?* Se não, é operação ou enfeite — entra depois, ou não entra.
2. **A operação serve à inteligência.** A operação existe pra capturar dado limpo. Operação que não vira dado útil é peso morto.
3. **Evoluir sempre, pela porta certa.** Feature nova entra avaliada pela inteligência, não pela moda. O produto nunca está pronto; o foco é que não muda.

**O que protege**
4. **Nunca virar commodity.** Se uma feature só nos iguala a Goomer/Consumer/Zig, não é prioridade. Prioriza o que ninguém no bar faz.
5. **O dado é o moat.** Quanto mais o bar usa, mais o sistema sabe — e mais caro fica sair. Lock-in por valor, nunca por multa.
6. **Premium, feito pra bar.** Não diluir o produto pra atender bar médio antes de dominar o topo.

**As linhas que não se cruzam**
7. **Tudo incluído.** Nunca cobrar módulo à parte. O nickel-and-dime é a ferida do mercado — nossa arma é não fazer isso.
8. **Não tocar no dinheiro do bar.** Registra o método, não transaciona — até a gente decidir o contrário de propósito.
9. **Não prometer o que não existe.** Venda e copy só falam do que o produto faz hoje. Visão é visão; promessa é entrega.

**As verdades que sustentam tudo**
10. **Custo cadastrado = inteligência real.** Sem o custo de cada produto, margem e CMV viram ficção. Passo obrigatório do onboarding.
11. **O bartender não pode sentir o sistema como inimigo.** A adoção da equipe é a hipótese que mata o negócio se for falsa. A tela do bartender é a peça mais importante.
12. **Dado limpo desde o dia 1.** Cada pedido, comanda e pagamento guardado direito — combustível da inteligência e, depois, do benchmark de rede.

---

## Missão e filosofia do produto

### A missão

O SUPERBAR não existe para registrar comandas. Não existe para controlar estoque. Não existe para gerar relatórios. Essas são funções necessárias para coletar dados.

**A missão do SUPERBAR é simples: fazer o dono do bar saber o que precisa fazer hoje.**

Quando um dono abre o SUPERBAR pela manhã, ele não deveria precisar procurar problemas, abrir relatórios ou interpretar gráficos. O sistema deve identificar automaticamente problemas que exigem ação, oportunidades de aumento de lucro e destaques relevantes da operação — e apresentar essas informações de forma clara, objetiva e acionável.

### Princípio central

> O dono não deve procurar a informação. A informação deve encontrar o dono.

### Hierarquia do produto

Toda decisão de UX e de roadmap obedece esta ordem de prioridade:

1. **Atenção** — o que precisa ser resolvido; o que representa risco; o que exige ação.
2. **Negócio** — como foi o último turno; como está o mês; receita, margem, CMV e ticket.
3. **Operação** — estoque, equipe, produção e caixa.
4. **Exploração** — relatórios, consultas e Superbar AI.

O que está no topo da hierarquia é o que o dono vê primeiro. O que está no rodapé é destino — não ponto de partida.

### Regra de ouro

> Nenhum insight vale a pena se não gerar uma decisão. Toda funcionalidade nova deve responder: "Isso ajuda o dono a saber o que fazer hoje?" Se a resposta for não, a funcionalidade não é prioridade.

### Fechamento

> O objetivo do SUPERBAR não é mostrar dados. É transformar dados em decisões.

---

## 2. O problema (a dor real do bar)

A dor não é teórica. A pesquisa em Reclame Aqui, BevSpot, Scannabar e relatos de bartenders veteranos mostrou um padrão consistente e severo:

**O sistema falha exatamente quando o bar enche.** O dono mais precisa de controle no pico de sexta à noite — e é aí que o sistema trava, o pedido sai errado, o caixa não fecha. Um dono de restaurante resumiu: pede uma coisa, o sistema registra outra, trava no movimento, e não dá pra fechar a mesa direito.

**A comanda de papel some ou é adulterada.** E quando o sistema "integra" no papel mas não na prática, a equipe vira o quebra-galho: confere no app, manda manual, retrabalha. Erro humano em cima de erro humano.

**O caixa fecha no escuro.** Sem fechamento automático, o caixa não enxerga o que foi consumido antes de cobrar. O dono só descobre o faturamento do dia no dia seguinte, na planilha — quando descobre.

**O vazamento é grande e invisível.** Dados de indústria estimam que a maioria dos donos de bar perde cerca de um quinto do faturamento sem perceber, entre desperdício, erro e furto. Num negócio de margem apertada, isso é a diferença entre lucrar e fechar. E fecha: a maior parte dos bares novos não passa de três anos.

**A implantação dos concorrentes é traumática.** Esse é o ponto que mais aparece como dor pós-venda: empresa que cobra mensalidade cheia antes de entregar o sistema funcionando, técnico que some no meio da implantação, suporte que não existe no fim de semana — justamente quando o bar opera. Mais a cobrança opaca: mensalidade + taxa por cada ajuste + multa pra cancelar.

**Resumo:** os concorrentes falham em três frentes — o sistema quebra no momento crítico, a implantação é um inferno, e a cobrança é cheia de surpresa. É exatamente nesses três pontos que o SUPERBAR ataca.

---

## 3. Pra quem é (o cliente-alvo)

### Segmento de entrada (beachhead)
**Bares premium e casas de coquetelaria de São Paulo capital**, depois Rio. Operações com bartender, garçom e caixa separados — onde tem volume, comanda que fica aberta horas, cliente que adiciona item várias vezes, e o caos entre pista e caixa custa dinheiro todo fim de semana.

Por que começar estreito: é onde a dor é mais aguda (complexidade + volume + ticket alto), é um grupo que se conhece (bartender indica bartender), e é onde a falta de um sistema feito pra bar — e não adaptado de restaurante — mais aparece. Já existe uma lista de bares mapeados de SP/RJ pra atacar (planilha do projeto).

### Quem é quem (não confundir os papéis)
- **Quem paga:** o dono / gestor. É ele que assina o cheque e decide.
- **Quem usa e pode sabotar:** bartender, garçom e caixa. Se a equipe não adota, o dono cancela. Ponto crítico — volto nisso na seção de hipóteses.
- **Quem consome:** o cliente do bar. Pode pedir pelo QR (a testar) ou ser atendido pelo garçom.

Um insight que veio da pesquisa e vale ouro pra vender: **os melhores donos de bar são ex-bartenders.** Eles entendem os dois lados. São os primeiros que vão comprar a ideia — e os melhores indicadores.

---

## 4. O que cada um ganha (a proposta de valor, papel por papel)

*(Ferramenta: Value Proposition Canvas — pra cada pessoa, a dor que ela tem hoje e como o SUPERBAR resolve.)*

### Dono / Gestor (quem paga)
- **Dor hoje:** descobre o faturamento tarde demais; desconfia que vaza dinheiro e não sabe onde; depende da cabeça do bartender pra saber o que rola na operação.
- **O SUPERBAR dá:** faturamento do turno em tempo real, ticket médio, métodos de pagamento e equipe ativa num painel — do celular, de qualquer lugar. Visibilidade que ele nunca teve.
- **Ganho que ele sente:** dorme tranquilo. Sabe o número do dia no dia. Para de operar no escuro.

### Bartender (quem produz e entrega)
- **Dor hoje:** recebe pedido gritado no meio do barulho, erra, refaz; acumula comanda na cabeça; é cobrado por erro que não foi dele.
- **O SUPERBAR dá:** uma fila de pedidos clara no iPad, comanda por mesa organizada, variantes de drink (Caipirinha de morango vs. tradicional) sem confusão. Otimizado pra toque, pro ritmo do balcão.
- **Ganho que ele sente:** menos erro, menos briga, menos retrabalho. O sistema trabalha a favor dele — não contra. (Isso é vital: bartender que sente o sistema como ameaça, sabota.)

### Garçom (quem leva o pedido)
- **Dor hoje:** vai e volta da pista ao balcão, anota errado, perde pedido no caminho.
- **O SUPERBAR dá:** lança o pedido no aparelho na mesa, cai direto na fila do bartender. Sem corrida, sem papel.
- **Ganho que ele sente:** mais mesas atendidas, menos perna, menos erro.

### Caixa (quem fecha)
- **Dor hoje:** não sabe o que a mesa consumiu até alguém contar; fecha conta no susto; lida com comanda de papel rasurada.
- **O SUPERBAR dá:** recebe o alerta quando a mesa pede a conta, vê tudo o que foi consumido, registra o pagamento (Pix, dinheiro, débito, crédito ou cortesia) sem precisar chamar ninguém.
- **Ganho que ele sente:** fecha rápido, certo, sem fila de gente irritada esperando a conta.

### Cliente (quem consome) — *valor a validar*
- **Dor hoje:** espera pra ser atendido, espera pra pagar.
- **O SUPERBAR pode dar:** aproximar o celular (NFC/tap) pra se identificar e pedir. Mas — atenção — em bar premium o atendimento é parte do luxo. Isso é uma aposta a testar, não uma certeza (seção 9).

---

## 5. Como o SUPERBAR ganha dinheiro

**Modelo fechado: mensalidade (assinatura) por plano. O SUPERBAR NÃO toca no dinheiro do bar.**

O sistema **anota** como o cliente pagou (Pix, cartão, dinheiro, cortesia), mas a grana continua indo direto pro bar, na maquininha e no Pix que ele já tem. A gente não vira fintech, não lida com adquirente, estorno nem chargeback. Isso é o jeito mais simples e o mais usado no mercado (Goomer, Saipos, Consumer e cia. começam todos assim). Processar pagamento de verdade, se um dia fizer sentido, é jogada pra muito mais na frente — e é opcional.

### Onde o mercado cobra (estudo, jun/2026)

Régua dos concorrentes que cobram mensalidade (modelo igual ao nosso):

| Concorrente | O que é | Preço de referência |
|---|---|---|
| Goomer | Cardápio digital / QR / delivery | ~R$ 100–300/mês |
| SisFood | Gestão / PDV | R$ 190–250/mês (transparente) |
| Saipos | Gestão completa | a partir de R$ 240/mês + módulos |
| Consumer | Gestão (15+ anos) | grátis + módulos cobrados à parte |
| Abrahão | Cardápio/QR pra bar | sob consulta + taxa de instalação, com multa e reajuste INPC |
| Zig | Bares/baladas premium | sob consulta — modelo cashless (processa o pagamento, fica com fatia) |

**Três fatos do estudo que mandam no nosso preço:**
1. **O preço de etiqueta mente.** Plano anunciado a R$ 89,90 vira R$ 200–250 reais depois dos módulos essenciais. A faixa "completa" do mercado mora em **R$ 500–1.000+/mês**.
2. **A dor nº1 do cliente é o que a gente decidiu não fazer:** módulo escondido, contrato com multa, reajuste forçado, sistema instalado que trava com o PC.
3. **Cobrar setup é norma** (R$ 200–800 no mercado). Não assusta — é esperado.

### O modelo do SUPERBAR

Premium, feito pra bar, na nuvem, **tudo incluído**. Senta com folga no topo da faixa — e ainda parece justo, porque o concorrente "barato" vira caro depois das pegadinhas.

**Agora (Estágio 1) — UM plano só.** Nada de três tabelas pra vender uma coisa só. (Decisão reforçada jul/2026: o Tagme vende 8 planos picados — Menu R$150, Fila R$350, Comanda R$400, Delivery R$400, Full R$800 — que é exatamente o nickel-and-dime que a gente ataca. Plano novo só pra multi-unidade/rede no Estágio 3; nunca por feature.)

| | Oferta |
|---|---|
| **Fundador (10 primeiros bares)** | **R$ 697/mês travado por 12 meses · implantação incluída · sem multa.** Após 12 meses, migra para o Padrão. |
| **Padrão (do 11º em diante)** | **R$ 1.297/mês** + setup transparente (**R$ 1.800**), cobrado **só depois do go-live** |

> **Racional do preço (fechado jul/2026):** o teto do mercado de **taxa fixa visível** é o Tagme Full a R$ 800/mês; acima disso só existe o modelo cashless do Zig (percentual do consumo — que efetivamente custa R$ 4.000–6.000/mês num bar premium movimentado). Existe **espaço em branco entre R$ 800 e o take-rate do Zig** que ninguém ocupa com preço fixo — e ninguém ali é bar-especializado com inteligência. O R$ 1.297 ancora contra **valor e contra o Zig**, não contra o Tagme, e cria distância clara do mercado "barato". O salto Fundador→Padrão (697→1.297) torna a oferta de fundador um roubo óbvio (urgência real pros 10 primeiros). Trava sujeita a pressão real nas primeiras conversas de discovery (H3).

**A inteligência já entra no lançamento.** Não existe "plano operação" e "plano inteligência" separados — é **um produto premium com tudo dentro** (operação + CMV + margem por drink + assistente de IA). Reforça o "tudo incluído" e torna o R$ 997 ainda mais fácil de justificar: você inclui a inteligência que o concorrente nem tem. Planos adicionais só fazem sentido lá na frente, pra **multi-unidade / rede** (Estágio 3).

**O que é o setup:** taxa única de implantação — cadastrar o cardápio, configurar mesas, treinar a equipe e acompanhar o primeiro fim de semana. Incluído pros 10 primeiros (o compromisso de 1 ano já é o filtro de gente séria); cobrado do 11º em diante, sempre só depois do sistema rodando.

**Sem extras. Tudo incluído.** Operação inteira no preço — sem cobrar à parte por relatório, QR ou garçom. A ferida nº1 do mercado é o módulo escondido; "tudo incluído" é arma nossa, não limitação. As únicas formas de faturar mais (e nenhuma é pegadinha): a subida natural de preço (fundador → padrão) e **multi-unidade** (Estágio 3).

**Três regras de cobrança que viram diferencial** (é onde o concorrente machuca):
1. **Tudo incluído.** Suporte e atualização na mensalidade. Sem taxa por cada ajuste.
2. **Só cobra depois do go-live.** A mensalidade começa quando o sistema está rodando no bar.
3. **Sem multa pra cancelar.** A gente prende pelo valor, não pelo contrato — no Estágio 2, o histórico acumulado é o que o cliente não vai querer perder.

> **Lembrete honesto:** R$ 997 é preço premium — fica no topo do mercado visível. É defensável pro beachhead (bar premium, ticket alto), mas exige **venda consultiva, ancorada no valor e no custo *real* do concorrente** — não no número solto.

---

## 6. A inteligência é o núcleo (visão macro) + roadmap de profundidade

O SUPERBAR roda a operação e tem a inteligência na veia — e **a inteligência é, e sempre será, o foco e o grande diferencial.** Operação muita gente faz; transformar a noite do bar em decisão de dinheiro é o que ninguém no segmento faz bem. É aí que a gente mora.

Em vez de "fases de construção", o roadmap é de **profundidade da inteligência** — porque as bases já existem e o produto evolui pra sempre. O que muda de um estágio pro outro é **o quão fundo o sistema pensa pelo dono.**

- **Estágio 1 — Decidir o turno.** Ler a noite que está acontecendo: faturamento, ticket, CMV, margem por drink, o que vende e o que dá lucro. Tudo incluído, pros primeiros bares pagantes.
- **Estágio 2 — Decidir o negócio.** Com histórico e custo cadastrados, a inteligência ganha precisão e memória: menu engineering de verdade, CRM de cliente recorrente, previsão de demanda, alertas de vazamento.
- **Estágio 3 — Decidir contra o mercado.** Rede: benchmark entre bares ("seu ticket está 12% abaixo de bares parecidos"), multi-unidade e a inteligência agregada que só quem tem muitos bares na plataforma consegue oferecer.

**Regra de ouro:** dado limpo desde o dia 1 — combustível de tudo acima.

### Evolução da inteligência

A inteligência do SUPERBAR não é um estado binário (tem ou não tem). É uma capacidade que evolui em quatro estágios, cada um exigindo mais dado e mais sofisticação que o anterior.

**Pré-requisito de qualidade:** toda a inteligência depende de dados confiáveis. A qualidade dos alertas, previsões e recomendações é diretamente proporcional à qualidade dos dados registrados no sistema. Sem custos cadastrados, CMV é estimativa. Sem histórico suficiente, tendências são ruído. O SUPERBAR deve sempre preferir silêncio a um alerta incorreto.

> **Falsos positivos são piores que ausência de alertas.** Um alerta errado que o dono abre e descarta como ruído destrói a credibilidade de todos os alertas seguintes. Um sistema que grita muito ensina o dono a ignorar. Um sistema que fala pouco, mas sempre certo, é o que o dono consulta primeiro.

---

**Estágio 1 — Regras**

Alertas determinísticos e confiáveis. A regra é verdade ou é silêncio — sem zona cinzenta.

Exemplos:
- Estoque crítico (abaixo do mínimo configurado)
- CMV acima da meta do turno
- Meta mensal em risco (projeção abaixo do target)
- Lista de compra calculada automaticamente (quantidade sugerida = 2× mínimo − atual)

---

**Estágio 2 — Anomalias**

Detecção automática de comportamentos incomuns em relação ao padrão histórico do próprio bar. Exige histórico mínimo (≥ 30 turnos) para estabelecer linha de base.

Exemplos:
- Produto caiu 40% em relação à média dos últimos 14 dias
- Ticket médio abaixo da tendência semanal
- Categoria em desaceleração por 3 semanas consecutivas

**Regra de validação:** toda anomalia deve eliminar causas conhecidas antes de gerar alerta — mudança de preço, ruptura de estoque, padrão de dia da semana. Anomalia sem validação é ruído.

---

**Estágio 3 — Causalidade**

O sistema não apenas detecta. O sistema explica. A causa provável é apresentada junto com o alerta.

Exemplos:
- "Vendas de Gin Tônica caíram 43% desde sexta. Não identificamos mudança de preço ou estoque."
- "Margem caiu 8 pontos em relação ao mês passado. Custo do limão aumentou 22% no último registro de compra."
- "Ticket médio caiu. Drinks premium representam apenas 9% das vendas neste turno, contra 18% no padrão."

---

**Estágio 4 — Recomendações**

O sistema sugere ações. A recomendação exige inferência — cruzamento de múltiplos sinais — e deve ser acionável de imediato.

Exemplos:
- "Negroni tem margem de 68% e crescimento de vendas de 22% nas últimas 3 semanas. Considere destacá-lo no cardápio esta semana."
- "Drinks premium representam 12% das suas vendas. Carlos tem a maior taxa de conversão da equipe para essa categoria. Considere replicar a abordagem dele no treinamento."
- "Sexta-feira entre 22h e 23h é seu pico de faturamento. Nos últimos dois turnos, o preparo médio ficou acima de 8 minutos nesse horário. Revise a escala ou a fila de produção para esse período."

---

A operação (bartender, caixa, dono) e a administração (cardápio, mesas, equipe) são o **corpo que alimenta esse cérebro**. Importam muito — mas como meio. O PRD detalha cada tela; aqui o que fica registrado é a hierarquia: **a inteligência manda, a operação serve.**

---

## 7. O modelo de negócio completo (visão de cima)

*(Ferramenta: Business Model Canvas — os 9 blocos, em português.)*

- **Pra quem (clientes):** bares premium e casas de coquetelaria, SP capital primeiro. Quem paga é o dono/gestor; quem usa é a equipe (bartender, garçom, caixa).
- **O que oferece (proposta de valor):** operação de bar digitalizada e em tempo real, feita pra bar (não adaptada de restaurante); depois, inteligência em cima do dado. Implantação sem trauma e cobrança sem surpresa.
- **Como chega no cliente (canais):** venda founder-led (você na frente), eventos do setor (Cocktail Week, ABRASEL, IBA), e indicação de bartender pra bartender.
- **Relação com o cliente:** próxima e consultiva no começo (white-glove); depois, sustentada pelo valor da inteligência acumulada.
- **De onde vem a receita:** mensalidade por plano + setup único. (Sem take rate, sem tocar no dinheiro do bar.)
- **Recursos-chave:** o produto (Next.js + Supabase), o dado acumulado (o ativo que vira moat), e sua reputação/rede no setor.
- **Atividades-chave:** construir o produto, rodar onboarding impecável, e vender de forma consultiva.
- **Parcerias-chave:** parceiro fiscal (NFC-e/SAT) lá na frente; comunidades e eventos do setor; e, se um dia processar pagamento, um gateway/adquirente.
- **Estrutura de custo:** infra (Supabase/hosting), seu tempo de build (enxuto), e o custo deliberado do onboarding white-glove (é aquisição, não desperdício).

---

## 8. Por que a gente ganha (o diferencial e o moat)

Tem dois níveis de diferença, e é importante separar o que protege pouco do que protege muito.

**Diferença de produto (protege no começo, mas é copiável):** o SUPERBAR é desenhado de dentro pra fora pra realidade do bar. A maioria dos sistemas foi feita pra restaurante — fluxo linear, mesa → pedido → cozinha → entrega. Bar é outra coisa: o bartender produz e entrega ao mesmo tempo, a comanda fica aberta horas, o cliente adiciona item várias vezes, e o pagamento é um caos. A tela do bartender, a fila em tempo real, as variantes de produto e o sinal visual de "a mesa quer pagar" nascem dessa realidade. Isso ganha cliente — mas um concorrente pode copiar com tempo.

**Diferença de moat (protege de verdade, e cresce):** o dado acumulado e a inteligência em cima dele. Cada noite no SUPERBAR vira histórico de drinks, padrão de venda, cliente recorrente. Isso já vira decisão que o dono não acha em outro lugar desde o lançamento; no Estágio 2 fica mais fundo; no Estágio 3 vira benchmark de rede. **Quanto mais o bar usa, mais o sistema sabe, e mais caro fica sair.** É um lock-in por valor — o oposto do lock-in por multa contratual que o mercado atual pratica (e que os clientes odeiam).

**O onboarding também é moat.** A pesquisa foi clara: a barreira número um não é o produto, é o terror de implantar. Concorrente que cobra antes de entregar e some no fim de semana deixou o mercado inteiro magoado. Um onboarding white-glove, rápido, com a cobrança começando só no go-live, é diferencial real — não cosmético.

---

## 9. As apostas que a gente PRECISA testar (hipóteses críticas)

*(Ferramenta: Test Cards — antes de apostar caro, testar barato. Ordenadas por "se isto for falso, dói mais".)*

| # | A aposta | O que já sabemos | Como testar barato |
|---|---|---|---|
| **H1** | A dor existe e é severa | ✅ Forte. 18 evidências de mercado batem. | Confirmar com 10 conversas com donos de bar premium SP: ≥7 relatam um perrengue específico recente. |
| **H2** | O bartender adota (não sabota) | ⚠️ **A mais perigosa.** Pouco dado direto. | Colocar em 1–2 bares e medir se a equipe usa sozinha depois de 1 semana, sem ninguém cobrando. |
| **H3** | O dono paga a mensalidade proposta | ⚠️ Parcial. Já pagam caro em sistema ruim. | Apresentar o preço nas conversas de discovery e medir reação real (não "achei legal" — "quando começa?"). |
| **H4** | O onboarding white-glove derruba a barreira | ✅ Forte indício. | Implantar os 2 primeiros e medir dias até o go-live e se a cobrança só-depois reduz objeção. |
| **H5** | A interação por aproximação (NFC/tap) serve a bar premium | ❓ Em aberto. Risco de "clima de lanchonete". | Testar a aproximação (NFC) em 1 bar e medir se o cliente premium usa, sem virar clima de autoatendimento. |

**A mais importante é a H2 (adoção do bartender).** Os números de negócio mostram que, se a equipe não adota e o cliente cancela cedo, o modelo todo não fecha. Tudo o mais depende disso. Por isso a tela do bartender é a peça mais importante do produto — ela tem que trabalhar a favor dele.

---

## 10. Os números (o que importa, sem fingir certeza)

> **Aviso honesto:** nenhum cliente foi fechado ainda. Os números abaixo são estimativas pra orientar decisão — atualizar a cada marco (1º, 5º, 10º, 20º cliente). Eles vieram do estudo anterior e foram ajustados pro modelo faseado e pro fato de você construir enxuto.

**A métrica que manda (North Star):** **bares ativos que fecham a noite inteira no SUPERBAR e renovam.** Não é cadastro, não é download — é bar que vive no sistema e paga de novo no mês seguinte.

**Economia por cliente (estimativa):**
- Receita média por bar: ~R$ 1.200/mês (mix de fundadores a R$ 697 + padrão a R$ 1.297) + setup R$ 1.800 uma vez (cobrado do 11º em diante).
- **Meta de referência (jul/2026): R$ 50.000 de MRR** = ~35–40 bares ativos pagando (10 fundadores a R$ 697 + ~29 padrão a R$ 1.297). Quanto mais alto o preço, menos bar você precisa afogar de white-glove pra chegar lá.
- Margem por cliente alta (~75–80%), porque o custo variável é baixo (infra + suporte + o custo de IA, que existe desde o lançamento mas é baixo por bar).
- Conta de retorno saudável no papel: cada cliente vale, ao longo da vida, várias vezes o que custa pra conquistar (alvo: valor do cliente ≥ 3× o custo de aquisição), com o custo se pagando em torno de 6 meses.

**O ponto de equilíbrio muda a seu favor.** O estudo anterior assumia um desenvolvedor contratado a R$8–12k/mês, o que empurrava o break-even pra ~17 clientes. **Como você constrói enxuto (sem essa folha), o break-even cai bastante** — a operação se paga com muito menos bar. Isso é uma vantagem real do seu modo de operar, e deve ser recalculado assim que o custo de infra estiver claro.

**A variável mais crítica é o churn dos primeiros 6 meses** — e churn nessa fase é, na prática, a adoção do bartender (H2). É o número pra vigiar acima de todos.

---

## 11. Como a gente vende (go-to-market resumido)

- **Founder-led.** Você na frente, vendendo de forma consultiva, até uns 30 bares. Sem vendedor dedicado no começo.
- **Beachhead apertado.** Bares premium de SP capital, da lista já mapeada. Ganhar essa praça antes de espalhar.
- **Indicação como motor.** Bartender indica bartender; ex-bartender que virou dono é o melhor primeiro cliente e o melhor indicador. Programa de indicação ativo derruba o custo de aquisição.
- **Presença no setor.** Eventos (Cocktail Week, ABRASEL, IBA) pra estar onde o público-alvo se encontra.
- **A venda é a dor, não a feature.** Não vender "sistema de comanda". Vender "para de perder dinheiro no escuro toda sexta".

---

## 12. Riscos e como a gente segura

- **Bartender não adota (o maior).** Mitigação: a tela do bartender é prioridade de design e tem que reduzir o trabalho dele desde o primeiro uso. Testar cedo, em bar real (H2).
- **Mercado lotado de sistema de comanda.** Mitigação: não competir só na operação (vira commodity). Puxar pra inteligência (já no lançamento) e pra "feito pra bar". O dado é a defesa.
- **QR não cola em bar premium.** Mitigação: já está tratado como opcional e a testar — o produto funciona 100% com garçom no tablet, sem depender do QR.
- **Onboarding vira gargalo conforme escala.** Mitigação: padronizar o white-glove desde o 1º cliente pra ele virar processo replicável, não heroísmo.
- **Fiscal e pagamento são complexos.** Mitigação: ficam fora do MVP. NFC-e via parceiro no Estágio 3; pagamento de verdade só se e quando fizer sentido.

---

## Marca — narrativa, tom e slogan

A marca é arma estratégica, não enfeite. O **Princípio 4 (nunca virar commodity)** vale também pra identidade: os concorrentes (Goomer, Consumer, Zig) têm cara de banco — dashboard cinza, tom de imposto de renda, feitos por quem nunca passou uma sexta atrás do balcão. Se o produto é anti-commodity, a marca é anti-commodity.

**A síntese:** cara de desenho, cabeça de estrategista. Por fora, o personagem mais divertido do balcão; por dentro, a coisa mais esperta que já entrou no bar. **Esse contraste é a marca.**

**A regra de ouro da marca (não escorregar):** o descolado vive na **personalidade** (mascote, voz, copy); o premium vive na **execução** (tipografia afiada, espaço pra respirar, acabamento caprichado). Cool na atitude, impecável no craft. O mascote pode brincar — o produto nunca pode parecer barato. É essa divisão que faz o dono de bar premium pensar "que massa" em vez de "que infantil".

### Slogan oficial

> **Seu bar ficou super inteligente.**

A sacada: o slogan decompõe o próprio nome. **SUPER** (a marca) + **inteligente** (o núcleo do produto, Princípio 1) na mesma respiração. O "ficou" carrega a transformação — antes não era, agora é. Diz o nome e o diferencial de uma vez só.

### Narrativa (manifesto)

> Todo sistema de bar parece a mesma coisa. Tela de banco, planilha cinza, cara de imposto de renda. Feito por gente que nunca passou uma sexta atrás do balcão.
>
> O SUPERBAR é o oposto disso.
>
> É o herói que faltava no seu bar — com cara de desenho e cabeça de estrategista. Por fora, o personagem mais divertido do balcão. Por dentro, a coisa mais esperta que já entrou na sua operação.
>
> Porque bar não é planilha. Bar é cultura, é noite, é gente. E quem vive isso não merece mais um software chato pra preencher — merece um parceiro que joga junto.
>
> O SUPERBAR organiza a pista, lê a noite e te diz onde está o dinheiro: qual drink dá lucro, onde vaza, o que fazer agora. Tempo real, sem papel, sem grito entre a pista e o caixa. Ele pega a sua sexta mais caótica e transforma na sua melhor noite — e te mostra como repetir isso toda semana.
>
> Não é pra qualquer bar. É pra quem leva o próprio bar a sério o bastante pra querer o melhor — e tem atitude pra fugir do careta.
>
> **Seu bar ficou super inteligente.**

### Tom de voz

Jovem, direto, com atitude — fala como gente de bar, não como manual de software. Bem-humorado sem ser bobo; confiante sem ser arrogante. Frases curtas. Zero corporativês ("solução", "otimizar", "plataforma robusta"). Quando o assunto vira dinheiro e decisão, fica afiado e sério — é onde o premium aparece. Boteco na atitude, precisão no que importa.

### Mascote

O copo de drink com capa de herói e o brasão "SB" — o super do balcão. Direção retrô/cartoon premium, renderizado **plano/duotone dentro da paleta do sistema** (preto sobre claro, no máximo um toque de #260078) — o personagem encaixa no visual limpo, não destoa. A personalidade descolada do site vem dele, da voz e da composição, não de cor extra. Merece um nome próprio (a definir).

---

## 13. Próximo passo

Com este documento fechado, o próximo arquivo é o **PRD** (Documento de Produto): as telas, o fluxo de dados, o modelo multi-bar, a stack (Next.js + Supabase, PWA, tempo real) e as specs de cada tela — tudo derivado das decisões daqui, começando pela **Estágio 1**.

Antes de partir pro PRD, vale fechar comigo:
1. As **faixas de preço** dos planos (seção 5) — confirma o esboço ou ajusta?
2. Topa eu já estruturar o PRD inteiro só com a **Estágio 1**, deixando Estágios 2 e 3 mapeados mas não detalhadas? (É o jeito de não te afogar e sair construindo.)

---

*Documento vivo. Atualizar a cada marco de cliente e sempre que uma hipótese da seção 9 for testada.*
