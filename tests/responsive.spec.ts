import { test, expect } from "@playwright/test";
import fs from "fs";

// Credenciais de teste — usa o seed dev por padrão. Sobrescreva com E2E_EMAIL / E2E_PASSWORD.
const EMAIL = process.env.E2E_EMAIL || "dono@aurorabar.dev";
const PASSWORD = process.env.E2E_PASSWORD || "SenhaForte123!";

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
    await page.screenshot({ path: `screenshots/${info.project.name}--${p.nome}.png`, fullPage: true });

    // Mede o overflow E identifica QUEM vaza (os elementos que passam da viewport).
    const diag = await page.evaluate(() => {
      const de = document.documentElement;
      const vw = de.clientWidth;
      const culprits = [...document.querySelectorAll("*")]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter((x) => x.r.right > vw + 1)
        .sort((a, b) => b.r.right - a.r.right)
        .slice(0, 8)
        .map((x) => ({
          tag: x.el.tagName,
          cls: (typeof x.el.className === "string" ? x.el.className : "").slice(0, 70),
          id: x.el.id || "",
          w: Math.round(x.r.width),
          right: Math.round(x.r.right),
          txt: (x.el.textContent || "").trim().slice(0, 30),
        }));
      return { scrollW: de.scrollWidth, vw, culprits };
    });

    // Grava relatório do culpado (só quando vaza) pra a gente ler o elemento exato.
    if (diag.scrollW > diag.vw + 1) {
      fs.mkdirSync("screenshots", { recursive: true });
      const linhas = diag.culprits
        .map((c) => `  <${c.tag}> w=${c.w} right=${c.right} class="${c.cls}" ${c.id ? "id=" + c.id : ""} "${c.txt}"`)
        .join("\n");
      fs.writeFileSync(
        `screenshots/_overflow--${info.project.name}--${p.nome}.txt`,
        `${p.nome} [${info.project.name}] vaza ${diag.scrollW - diag.vw}px (scrollW ${diag.scrollW} > vw ${diag.vw})\nCulpados (mais à direita primeiro):\n${linhas}\n`,
      );
    }

    expect(diag.scrollW, `${p.nome} vaza ${diag.scrollW - diag.vw}px`).toBeLessThanOrEqual(diag.vw + 1);
  });
}
