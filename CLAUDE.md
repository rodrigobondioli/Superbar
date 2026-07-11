@AGENTS.md

# SUPERBAR — Contexto do projeto

Este arquivo é o ponto de entrada do repositório: ele amarra estratégia, regras técnicas e contrato visual num lugar só. O código nunca escapa da estratégia.

> **Fontes de verdade deste repo:**
> - **Negócio e estratégia:** `docs/negocio.md` (mestre) + o resumo abaixo.
> - **Contrato visual:** `DESIGN.md` — leia ANTES de criar ou alterar qualquer UI. Não improvise estilo.
> - **Regras desta versão do Next.js:** `AGENTS.md` (importado no topo).
>
> **Manutenção:** quando a estratégia mudar, edite `docs/negocio.md` — não este arquivo. Este `CLAUDE.md` é a mesma verdade que o oráculo de decisão no Cowork lê. Uma verdade só, nas duas ferramentas.

---

## O que é o SUPERBAR (a essência)

O SUPERBAR é o **cérebro do bar**: transforma cada pedido, comanda e noite em **decisão** — quanto se lucra, qual drink dá dinheiro, onde vaza. Pra ter esse cérebro, ele roda a operação inteira em tempo real (pedido → bartender → caixa → dono).

**A hierarquia que manda em todo o código:** a inteligência é o fim; a operação é o meio. Toda escolha de arquitetura, modelo de dados e feature se pergunta: *isso captura ou serve a inteligência?* Se a operação não vira dado útil, é peso morto.

Slogan da marca: **"Seu bar ficou super inteligente."**

---

## Os 12 princípios (guardrails de build)

1. **A inteligência é o fim.** O que aumenta a capacidade do dono de decidir dinheiro tem prioridade.
2. **A operação serve à inteligência.** Capture dado limpo em cada operação — é o combustível.
3. **Evoluir sempre, pela porta certa.** Feature entra pela inteligência, não pela moda.
4. **Nunca virar commodity.** Não gaste esforço no que só nos iguala a Goomer/Consumer/Zig.
5. **O dado é o moat.** Lock-in por valor (histórico acumulado), nunca por contrato.
6. **Premium, feito pra bar.** Qualidade de produto premium; não diluir.
7. **Tudo incluído.** Nunca implemente cobrança por módulo / paywall por feature operacional.
8. **Não tocar no dinheiro do bar.** O sistema **registra o método** (Pix/Dinheiro/Débito/Crédito/Cortesia) — **NÃO transaciona**. Não integre gateway, settlement, split. Regra dura.
9. **Não prometer o que não existe.** Não exponha em produção feature falsa/mock como se fosse real.
10. **Custo cadastrado = inteligência real.** O modelo de dados **precisa** de custo por produto (ficha técnica). Sem custo, margem e CMV são ficção. Custo é cidadão de primeira classe no schema e no onboarding.
11. **O bartender não pode sentir o sistema como inimigo.** A tela do Bartender é a peça mais importante do produto — prioridade máxima de usabilidade, velocidade e robustez (toque em iPad, tempo real, zero travamento no pico).
12. **Dado limpo desde o dia 1.** Schema disciplinado e persistência íntegra/auditável. Nenhuma gambiarra que perca pedido, comanda ou pagamento.

---

## Contexto técnico

- **Stack:** Next.js (App Router) + Tailwind CSS + Supabase + Vercel. **Atenção:** esta versão do Next.js pode ter breaking changes — consulte `AGENTS.md` e `node_modules/next/dist/docs/` antes de escrever código.
- **Estrutura do repo:** `src/` (código), `public/` (estáticos), `scripts/`, `supabase/` (migrations/schema), `docs/` (incl. `negocio.md`).
- **Comandos:** ver `package.json` (scripts). Dev típico: `npm run dev`.
- **Multi-tenant** por bar (isolamento por estabelecimento). **PWA** (sem instalar): iPad do bartender, celular do dono. Fila em tempo real via **Supabase Realtime**.
- **Três superfícies:** Bartender (iPad), Caixa, Dono (dashboard). **Admin:** cardápio (categorias, produtos, variantes), mesas, equipe.
- **Intake de pedido:** staff-side é o **núcleo**. Interação do cliente por **aproximação (NFC/tap)** é **hipótese opcional em teste** — não construa como core sem decisão explícita.
- **Pagamento:** registro de método apenas (Princípio 8). Fiscal (NFC-e/SAT) fica fora por enquanto.
- **Visual:** `DESIGN.md` é o contrato. Siga os tokens (cores, tipografia, raios, componentes). Não invente estilo.

---

## O que NÃO fazer (linhas duras)

- **Não** construir processamento de pagamento (gateway, adquirente, split, settlement). Só registro do método.
- **Não** criar paywall/cobrança por módulo operacional. Tudo incluído.
- **Não** deixar dado-semente (seed) se passar por dado real em telas de demo — separe seed de produção. **Regra dura:** dado mockado/fictício vive **só na rota `/demo`** (marcada com selo "DEMO"). Nenhuma tela do app real (`/dashboard`, `/mesas`, etc.) pode fabricar número. Se ainda não há query real, mostre estado honesto de **"aguardando dados"** — nunca invente valor (Princípio 9).
- **Não** perder dado: cada pedido, comanda e pagamento persistido de forma íntegra.
- **Não** subordinar a inteligência à operação. Se um atalho operacional sacrifica a captura de dado, está errado.
- **Não** improvisar UI fora do `DESIGN.md`.

---

## Em caso de dúvida

Decida pela hierarquia: **a inteligência manda, a operação serve.** Se não resolver, consulte `docs/negocio.md` (estratégia) ou `DESIGN.md` (visual). Se nem lá estiver, é decisão de produto — pare e pergunte, não improvise estratégia no código.
