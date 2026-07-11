import { test, expect } from "@playwright/test";

// Credenciais de teste — usa o seed dev por padrão (dono@aurorabar.dev, publicado
// em scripts/seed.mjs). Sobrescreva com E2E_EMAIL / E2E_PASSWORD se quiser.
const EMAIL = process.env.E2E_EMAIL || "dono@aurorabar.dev";
const PASSWORD = process.env.E2E_PASSWORD || "SenhaForte123!";

// Telas que a gente quer garantir sem vazamento horizontal.
const PAGINAS = [
  { nome: "dashboard", path: "/dashboard" },
  { nome: "cardapio",  path: "/dashboard/cardapio" },
  { nome: "estoque",   path: "/dashboard/estoque" },
  { nome: "relatorios", path: "/dashboard/relatorios" },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email], input[name=email]", EMAIL);
  await page.fill("input[type=password], input[name=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard**", { timeout: 30_000 }).catch(() => {});
});

for (const p of PAGINAS) {
  test(`${p.nome} — sem overflow horizontal`, async ({ page }, info) => {
    await page.goto(p.path);
    await page.waitForTimeout(1500);

    // Print pro olho humano (screenshots/<tamanho>--<pagina>.png).
    await page.screenshot({ path: `screenshots/${info.project.name}--${p.nome}.png`, fullPage: true });

    // Regra: NADA pode ser mais largo que a viewport (isso é o "samba"/vazamento).
    const { scrollW, innerW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    }));
    expect(scrollW, `${p.nome} vaza ${scrollW - innerW}px além da tela`).toBeLessThanOrEqual(innerW + 1);
  });
}
