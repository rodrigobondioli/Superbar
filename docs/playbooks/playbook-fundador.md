# Playbook do Fundador — "Fechei um cliente. E agora?"

> Uso interno (Rodrigo). Passo a passo replicável de implantação white-glove.
> A régua: a venda foi a dor, não a feature. A partir daqui, o que decide o
> negócio é a **H2 — o bartender adota** (doc de negócio, seção 9). Todo o
> processo abaixo existe pra provar essa aposta num bar real.

---

## Fase 0 — No mesmo dia que fechar (30 min)

1. **Envie o Playbook do Cliente** (o outro arquivo). É o "bem-vindo + o que preparar".
2. **Agende a noite de implantação.** Uma **sexta ou sábado** em que o dono vai estar no bar. É nessa noite que tudo é configurado e a equipe é treinada ao vivo.
3. **Peça o material** (o cliente já recebe a lista no playbook dele):
   - Cardápio de drinks **com preço de venda**.
   - **Últimas notas fiscais (NF-e, arquivo XML)** das compras de bebida/insumo — é o que puxa o custo automático.
   - Quantas mesas e como são numeradas/nomeadas.
   - Nomes e função de cada um da equipe (garçom, bartender, caixa).

---

## Fase 1 — Montar o bar (antes da noite · 1–2h, pode ser remoto)

Ordem importa — é a hierarquia da inteligência: cardápio → **custo** → mesas → equipe → turno.

1. **Criar o bar.** Cadastro → onboarding. Cria a conta do dono como `dono`.
2. **Cardápio.** Categorias → produtos → variantes, sempre com **preço de venda**. (Caipirinha tradicional vs. de morango = variantes.)
3. **Custo — o passo que não pode falhar (Princípio 10).**
   - Suba as **NF-e** (Estoque → importar NF-e). Isso cria os insumos com custo real.
   - Monte a **ficha técnica** de cada drink: quanto de cada insumo entra numa dose.
   - 🚨 **Regra de ouro: custo POR DOSE, não por garrafa.** Gin custa R$120 a garrafa, mas a dose de 50ml custa ~R$8. Se lançar R$120 no drink, o CMV explode e a margem fica negativa. Esse é o erro nº1 de onboarding de bar.
4. **Mesas.** Cadastra a planta (número/nome).
5. **Equipe.** Cadastra cada pessoa com o **papel certo** (garçom, bartender, caixa). O papel define o que cada tela mostra.
6. **Checagem de sanidade (2 min):** abra o dashboard. A **margem e o CMV estão plausíveis**? Se aparecer margem negativa ou CMV acima de ~50%, o custo está por garrafa em algum produto — **corrija antes da noite.** O dono não pode ver ficção na primeira olhada.

---

## Fase 2 — A noite white-glove (a sexta, você presente)

Aqui você prova a H2. Sua função é fazer o sistema **sumir** no ritmo do bar.

1. **iPad do bartender configurado** (login compartilhado do bar). Essa é a tela mais importante do produto — se ela travar ou atrapalhar no pico, o bartender sabota (Princípio 11).
2. **Treino de 10 minutos:** garçom lança o pedido na mesa → cai na fila do bartender → caixa fecha registrando o método. Só isso. É desenhado pra ser óbvio.
3. **Fique de olho no pico.** Qualquer atrito que o bartender sentir, resolva **na hora**. Anote o que travou — é a sua lista de melhorias real (não a que a auditoria imagina).
4. **Mostre o dono o painel do celular** durante a noite: faturamento subindo em tempo real. Esse é o "dorme tranquilo" — o momento em que ele sente o valor.

---

## Fase 3 — A semana seguinte (o teste que vale tudo)

1. **Não cobre ainda.** White-glove cobra **depois** que o valor foi provado (H4 derruba a objeção). Setup só é cobrado do 11º cliente em diante.
2. **Meça a H2:** a equipe usou o sistema **sozinha, a semana inteira, sem você cobrando**? Essa é a pergunta que decide o negócio. Se sim, você tem um cliente que renova. Se não, descubra o atrito antes de escalar.
3. **Ligue pro dono** com o número do fim de semana na mão. Traduz em decisão: "seu drink X dá 74% de margem e vende pouco — empurra ele."
4. **Feche a cobrança** quando H2 ✅ e o dono viu valor.

---

## O que vigiar (as métricas que importam)

- **North Star:** bar que **fecha a noite inteira no SUPERBAR e renova** no mês seguinte. Não é cadastro, não é login.
- **A métrica crítica dos 6 primeiros meses é o churn** — e nessa fase churn = adoção do bartender (H2). Vigie acima de tudo.

## Linhas que não se cruzam (na venda e no setup)

- **Não prometa QR/NFC** (interação por aproximação) — está em teste (H5). O produto funciona 100% com garçom no tablet. Venda o que existe (Princípio 9).
- **Custo por dose, sempre.** Sem isso a inteligência é ficção (Princípio 10).
- **O sistema não toca no dinheiro do bar** — só registra o método (Pix/dinheiro/débito/crédito/cortesia). Não é máquina de cartão (Princípio 8).
- **Tudo incluído** — nunca ofereça "módulo à parte" (Princípio 7).

## Perfil do primeiro cliente ideal

Um **ex-bartender que virou dono** (doc, seção 3). Entende os dois lados, compra a ideia rápido e é o seu melhor indicador. Bar premium de SP capital, da lista mapeada.
