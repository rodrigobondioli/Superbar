# Jornada do dono — do zero ao bar operando com margem real

> Referência de UX do onboarding do SUPERBAR. A régua: **menor fricção possível,
> um passo por vez, zero conta de cabeça.** A evolução acontece, mas natural.

## Quem é o dono

Dono de bar (muitas vezes ex-bartender), ocupado, não-técnico. Quer valor rápido.
Não quer aprender sistema — quer que o sistema suma no ritmo dele.

## Os 5 princípios de experiência

1. **Um passo por vez.** Nunca "6 tarefas gritando juntas". A home mostra só o próximo passo aceso ("Comece por aqui"); o resto fica apagado.
2. **Zero conta de cabeça.** O sistema converte garrafa→ml. Se o dono digitar custo, digita a **embalagem** (preço + tamanho) — nunca "custo por ml".
3. **NF-e é a estrela do custo.** Vem na frente: traz o custo real dos insumos, já convertido, e faz os drinks nascerem com margem.
4. **Nenhum caminho joga trabalho fora.** Nada de montar ficha na mão e depois descobrir que a nota faria.
5. **Sempre dá pra pular e voltar.** O painel reconduz. Nada bloqueia a operação.

## O conceito que destrava tudo: vender ≠ comprar

- **Cardápio** = o que você **vende** (Caipirinha, R$ 25).
- **Insumos / Estoque** = o que você **compra** (cachaça, R$ 15/garrafa).
- **Ficha** = a ponte (Caipirinha usa 60ml de cachaça + limão + açúcar).
- **Margem** = preço de venda − custo dos insumos da ficha.

São dados diferentes. A NF-e traz os insumos (comprar); o cardápio traz os drinks (vender). Por isso a ordem importa: **NF-e primeiro → o cardápio já nasce com custo.**

## O fluxo

**0. Entrada.** Do marketing → "Criar conta". (bar novo não cai no login)

**1. Criar o bar (30 segundos).** Nome do bar + seu nome + mascote. Cai direto na home. Sem wizard.

**2. Home — checklist guiado, um passo por vez, nesta ordem:**

| # | Passo | O que o dono vê | Feito quando |
|---|---|---|---|
| 1 | **Custo dos insumos (NF-e)** | *"Comece pela nota. Suba a NF-e da sua compra — o custo entra pronto, já convertido. Aí, quando montar os drinks, a ficha JÁ VEM com custo. Sem digitar."* | Tem ≥ 1 insumo com custo |
| 2 | **Cardápio** | *"O que você vende. Monte pelos clássicos ou suba o PDF — a ficha já vem com o custo da nota."* | Tem ≥ 1 produto |
| 3 | **Mesas** | Cadastrar a planta | Tem ≥ 1 mesa |
| 4 | **Equipe** | Convidar garçom/bartender/caixa | Tem ≥ 1 membro |
| 5 | **Abrir o primeiro turno** | Ver Caixa | Já abriu 1 turno |

**O "PIMBA!":** se o dono sobe a NF-e no passo 1, no passo 2 (cardápio) a IA sugere a ficha **e o custo já vem preenchido** — margem na hora, sem digitar nada. Esse é o argumento que faz a nota valer a pena.

## Plano B (sem NF-e)

Se o dono não tem a nota à mão, ele pula o passo 1 e monta o cardápio. Aí a ficha fica sem custo. A tela de precificação manual pergunta **"quanto custou a embalagem e qual o tamanho"** (ex: garrafa, 750ml, R$ 34) e **o sistema converte** para R$/ml. Nunca pede "custo por ml". Insumo é precificado **uma vez** e vale pra todos os drinks que o usam.

## O que NÃO fazer (fricção proibida)

- Não pedir conta de cabeça (custo por ml).
- Não oferecer dois caminhos que se anulam (montar na mão + depois a nota).
- Não empilhar todos os passos acesos ao mesmo tempo.
- Não bloquear a operação por falta de custo — mostra estado honesto e segue.
