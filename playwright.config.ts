import { defineConfig } from "@playwright/test";

// Teste de responsivo — renderiza em tamanhos reais, tira print e falha se
// algo vazar da largura. Roda contra o dev local por padrão (npm run dev),
// ou aponte pro deploy: E2E_BASE_URL=https://app.superbar.com.br
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  outputDir: "test-results",
  timeout: 60_000,
  use: { baseURL, colorScheme: "dark" },
  projects: [
    { name: "celular-390",   use: { viewport: { width: 390,  height: 844 } } },
    { name: "celular-375",   use: { viewport: { width: 375,  height: 667 } } },
    { name: "ipad-retrato",  use: { viewport: { width: 820,  height: 1180 } } },
    { name: "ipad-paisagem", use: { viewport: { width: 1194, height: 834 } } },
    { name: "desktop-1440",  use: { viewport: { width: 1440, height: 900 } } },
  ],
});
