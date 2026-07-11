# SUPERBAR — Regras de papéis (quem vê o quê)

> **Fonte de verdade** do controle de acesso por papel. O código implementa isto em
> `src/lib/auth/roles.ts` (política central). Se a regra mudar, edita aqui **e** lá.

## Princípio

O papel decide **onde a pessoa cai ao logar** e **o que ela acessa**. Papel não é
enfeite — é autorização. Duas linhas duras:

- **Só o Dono vê o financeiro** (faturamento, margem, CMV, custo como dinheiro, inteligência).
- **Cada papel operacional só entra na própria tela** — não vê o dashboard.

## Os papéis (5)

`gerente` foi **consolidado em `bar_manager`** (eram duplicados). Rótulo: **"Bar Manager"**.

| Papel | Casa (ao logar) | Acessa | Bloqueado |
|---|---|---|---|
| **Dono** | Dashboard | **Tudo**: inteligência, financeiro, relatórios, admin (cardápio, mesas, estoque, equipe, clientes, config) + qualquer tela operacional | — |
| **Bar Manager** | Estoque | Admin operacional: Cardápio, Mesas, Estoque + **Contagem**, Equipe; e as telas operacionais (bartender/caixa/garçom) | **Financeiro:** Operação ao vivo, Inteligência, Relatórios, Turnos ($), Clientes (CRM); **config de dono** (plano/cobrança, excluir bar, transferir posse, criar/rebaixar dono) |
| **Bartender** | Tela do bartender (iPad) | Produção + **Contagem de insumos** | Dashboard, financeiro |
| **Garçom** | Tela do garçom | Pedido / mesas | Dashboard, financeiro |
| **Caixa** | Tela do caixa | Fechar comanda, registrar método de pagamento, abrir/fechar turno | Inteligência/financeiro do dono |

## Detalhes que valem registrar

- **Contagem de insumos** é tarefa operacional que vira inteligência: acessível a
  **Dono, Bar Manager e Bartender**. Alcançável tanto do Estoque quanto da operação.
- **Clientes (CRM)** mostra gasto por cliente → é financeiro → **dono-only**.
- **Equipe**: Bar Manager gerencia a equipe, mas **criar ou rebaixar um Dono é dono-only**.
- **Dono pode entrar em qualquer tela operacional** (cobrir um turno, testar).
- Um Bar Manager/Dono pode **operar como garçom/caixa** (aparece no seletor de operador
  por PIN) — isso é cobertura de operação, não quebra de regra.

## Como o código aplica (resumo)

- `homePath(role)` — pra onde o login manda.
- `isOperacional(role)` — bartender/garçom/caixa; barrados do `/dashboard`.
- `podeVerFinanceiro(role)` — só `dono`; guarda as páginas financeiras.
- `podeVerAdminDashboard(role)` — `dono` + `bar_manager`.
- `normalizarRole(role)` — trata `gerente` legado como `bar_manager`.

## Estado antes desta regra (o que estava errado)

Registrado pra não repetir: antes, **login mandava todo mundo pra `/dashboard`**, o
dashboard **não barrava papel** (garçom via faturamento), a sidebar mostrava tudo pra
todos, e as telas operacionais não barravam papel — o papel era só rótulo. Um Bar Manager
caía no shell de garçom com rótulo fixo "Garçom". Esta regra fecha isso.
