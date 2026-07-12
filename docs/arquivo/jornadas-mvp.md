# SUPERBAR — Jornadas do MVP

> Documento de validação. Leia, corrija o que estiver errado, aprove pra gente construir.

---

## O sistema em uma linha

Cliente escaneia o QR na mesa, digita o nome, a comanda abre. Bartender gerencia no iPad. Caixa fecha e imprime por pessoa.

---

## Premissas que guiam tudo

- **Uma comanda por pessoa.** Quatro pessoas na Mesa 4 = quatro comandas separadas.
- **QR e NFC fazem a mesma coisa:** abrem a mesma URL no celular. NFC é mais elegante, dispensa câmera.
- **Dois modos de pedido:** cliente pede pelo celular OU pede para o garçom/bartender. O bar decide qual modo ativa.
- **Pagamento fica no caixa.** O cliente não paga pelo celular no MVP. Isso protege o produto de complexidade desnecessária agora.
- **Nome é obrigatório para abrir comanda.** Sem nome, sem comanda. Mas o fluxo é simples: um campo, um botão.

---

## Jornada 1 — Cliente

### Chegada

1. Senta na mesa.
2. Vê o QR code (adesivo na mesa) ou toca o celular no NFC (tag embutida na mesa).
3. O celular abre a página do bar: **`superbar.app/mesa/4`**
4. Vê: nome do bar, número da mesa.

### Identificação

5. Tela pede: **"Qual o seu nome?"** — campo único, sem senha, sem cadastro.
6. Campo de telefone aparece logo abaixo: *"Quer ser reconhecido na próxima visita? (opcional)"*
7. Toca **"Abrir minha comanda"**.
8. Sistema cria a comanda: Mesa 4 / Nome / Hora de abertura.

> **Segunda visita (mesmo bar ou qualquer bar com SUPERBAR):** nome e telefone já aparecem preenchidos. O cliente só confirma. Zero digitação.

### No bar

9. Vê o cardápio digital: fotos, preços, categorias.
10. Aba **"Minha conta"** mostra o que já consumiu e o total atual — em tempo real.

#### Modo A — Bar com auto-pedido ativo
11. Adiciona itens direto pelo celular.
12. Pedido vai para a tela do bartender em tempo real.
13. Bartender prepara e confirma entrega.

#### Modo B — Bar sem auto-pedido (padrão)
11. Vê o cardápio mas não pede pelo celular.
12. Tela mostra: *"Peça ao garçom ou no balcão."*
13. O garçom anota e registra no iPad.

### No grupo

- Cada pessoa da mesa escaneia o **mesmo QR**.
- Cada uma digita **seu próprio nome**.
- Cada uma abre **sua própria comanda** na Mesa 4.
- Mesa 4 pode ter João, Ana e Carlos — três comandas, três contas separadas no final.

### Saída

14. Cliente vai ao caixa (ou o caixa vai até a mesa).
15. Caixa imprime a nota com nome, itens e total.
16. Cliente confere e paga.

---

## Jornada 2 — Bartender / Garçom

### Início do turno

1. Acessa `/bartender` no iPad.
2. Seleciona seu nome na lista da equipe.
3. Turno já foi aberto pelo dono ou gerente no dashboard.

### Durante o serviço

#### Quando o cliente pediu pelo celular (auto-pedido ativo)
1. Pedido aparece na fila do bartender em tempo real.
2. Bartender vê: **Mesa 4 — João — 1× Negroni**.
3. Prepara e marca como entregue.

#### Quando o cliente pediu pessoalmente
1. Bartender abre a tela de mesas no iPad.
2. Vê Mesa 4 ocupada: João, Ana, Carlos.
3. Toca no nome da pessoa.
4. Adiciona os itens do pedido.

#### Quando o cliente não escaneou o QR
1. Bartender abre Mesa 4 no iPad.
2. Toca **"+ Nova comanda"**.
3. Digita o nome manualmente.
4. Adiciona os itens.

### Fechamento da comanda

5. Quando o cliente quer pagar, bartender (ou o próprio cliente via celular) toca **"Fechar comanda"**.
6. Status muda para **"Aguardando pagamento"**.
7. Caixa recebe a notificação.

---

## Jornada 3 — Caixa

### Abertura de turno
1. Acessa `/caixa` no iPad ou computador.
2. Se o turno ainda não foi aberto, abre pela aba Turno.

### Durante o serviço — visão geral
3. Aba **"Comandas"**: lista todas as comandas abertas em tempo real.
4. Aba **"Mesas"**: visão por mesa — quantas pessoas, total acumulado, quem quer pagar.

### Fechamento de conta — por pessoa

5. Na aba Mesas, toca em **Mesa 4**.
6. Vê a lista: João (R$ 180), Ana (R$ 140), Carlos (R$ 100).
7. Toca em **João**.
8. Vê todos os itens da comanda do João detalhados.
9. Toggle de serviço **10%** — on ou off, o caixa decide na hora.
10. Toca **"Imprimir conta"** — abre janela de impressão.
    - Impressora térmica 80mm.
    - Nota sai com: nome do bar, mesa, nome do cliente, itens, subtotal, serviço (se incluído), total.
11. Cliente confere a nota.
12. Caixa registra o método de pagamento: **Pix / Dinheiro / Crédito / Débito / Cortesia**.
13. Comanda fecha. Some da lista da Mesa 4.
14. Repete para Ana e Carlos.

### Fim do turno
15. Todas as comandas fechadas.
16. Caixa encerra o turno na aba Turno.
17. Dashboard registra: total de vendas, total de comandas, métodos de pagamento.

---

## Configurações por bar (admin)

| Config | O que faz |
|---|---|
| `auto_pedido` | Liga/desliga pedido pelo celular do cliente |
| QR por mesa | Gera e permite imprimir o QR de cada mesa |
| Nome e logo do bar | Aparecem na página do cliente quando escaneia |

---

## O que está fora do MVP

- Pagamento no celular do cliente (exigiria gateway — fora de escopo)
- Programa de fidelidade / histórico entre visitas
- Notificação por WhatsApp
- Integração com delivery
- Fiscal (NFC-e, SAT)

---

## O que já está construído e continua válido

- Tela do bartender no iPad (mesas, comandas, itens em tempo real) ✅
- Tela do caixa (mesa → pessoa → itens → impressão → pagamento) ✅
- Cardápio digital no admin ✅
- Sistema de turnos ✅

## O que falta construir

- `/mesa/[mesaId]` — página do cliente (nome, menu, minha conta)
- QR code gerado por mesa no admin
- Toggle `auto_pedido` nas configurações do bar
- "Lembrar de mim" via localStorage

---

*Valide este documento. Corrija o que estiver errado. Só depois a gente constrói.*
