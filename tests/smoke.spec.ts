import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Smoke test — abre CADA rota do dono e falha se a página quebrar: exceção JS
// não capturada, erro de servidor (5xx), redirect pro /login (auth/rota morta)
// ou tela vazia. É a rede que pega "rota quebrada" ANTES de você clicar.
//
// Rodar contra o dev local: `npm run dev` e depois
//   npx playwright test tests/smoke.spec.ts --project=desktop-1440
// (ou E2E_BASE_URL=<deploy> pra rodar contra produção).
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL = process.env.E2E_EMAIL || "dono@aurorabar.dev";
const PASSWORD = process.env.E2E_PASSWORD || "SenhaForte123!";

const ROTAS = [
  "/dashboard",
  "/dashboard/cardapio",
  "/dashboard/cardapio/fichas",
  "/dashboard/clientes",
  "/dashboard/equipe",
  "/dashboard/estoque",
  "/dashboard/estoque/contagem",
  "/dashboard/inteligencia",
  "/dashboard/mesas",
  "/dashboard/relatorios",
  "/dashboard/turnos",
  "/dashboard/caixa",
  "/contagem",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email], input[name=email]", EMAIL);
  await page.fill("input[type=password], input[name=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard**", { timeout: 30_000 }).catch(() => {});
});

for (const rota of ROTAS) {
  test(`smoke: ${rota} carrega sem erro`, async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") erros.push(`console.error: ${msg.text()}`);
    });

    const resp = await page.goto(rota, { waitUntil: "domcontentloaded" });
    // 1) servidor não devolveu erro
    expect(resp, `${rota}: sem resposta`).not.toBeNull();
    expect(resp!.status(), `${rota}: status ${resp!.status()}`).toBeLessThan(400);

    await page.waitForTimeout(1200); // deixa o RSC/stream terminar

    // 2) não caiu pro login (rota morta / auth quebrada / redirect inesperado)
    expect(page.url(), `${rota} redirecionou pro login`).not.toContain("/login");

    // 3) tem conteúdo de verdade (não é tela branca / só o shell)
    const texto = (await page.locator("body").innerText()).trim();
    expect(texto.length, `${rota}: página vazia`).toBeGreaterThan(20);

    // 4) nenhuma exceção JS / erro de console durante o carregamento
    expect(erros, `${rota} logou erros:\n${erros.join("\n")}`).toEqual([]);
  });
}
