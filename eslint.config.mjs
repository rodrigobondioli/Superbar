import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts Node (seed) usam CJS/require — não são código do app Next.
    "scripts/**",
  ]),
  // React Compiler (eslint-plugin-react-hooks v6): duas regras novas são
  // conservadoras demais para este app e sinalizam padrões CORRETOS —
  //  · set-state-in-effect: subscribe do Supabase Realtime e detecção
  //    client-only (navigator.onLine, BarcodeDetector) fazem setState no effect.
  //  · purity: contadores de tempo com Date.now() no render (caixa/turno) são
  //    intencionais.
  // Rebaixadas a "warn". As que pegam BUG real seguem "error":
  //  · static-components (componente recriado no render → remonta filhos)
  //  · refs (ref lido/escrito no render → não dispara re-render)
  // rules-of-hooks e exhaustive-deps continuam como error (default do Next).
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      // Args/vars prefixados com _ são intencionalmente não usados (placeholder
      // de assinatura de action, destructure parcial). Convenção padrão.
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // ── Guarda-corpo do DS (ARMADO) ─────────────────────────────────────
      // Bloqueia (error) a volta dos padrões que causaram inconsistência
      // crônica: pílula na mão (borderRadius literal) e var(--font-mono).
      // Migração em lote zerou os existentes (jul/2026); agora barra novos.
      // Ver docs/auditoria-app.md.
      "no-restricted-syntax": ["error",
        {
          selector: "Property[key.name='borderRadius'][value.value=999]",
          message: "Pílula na mão (borderRadius: 999): use o componente <Button> do DS para AÇÃO, ou borderRadius: 'var(--r-pill)' para container. Foi o que causou botões de altura diferente (DESIGN.md § Botões).",
        },
        {
          selector: "Property[key.name='borderRadius'][value.value=9999]",
          message: "Pílula na mão (borderRadius: 9999): use <Button> do DS ou borderRadius: 'var(--r-pill)'.",
        },
        {
          selector: "Property[key.name='fontFamily'][value.value=/font-mono/]",
          message: "Não use var(--font-mono). Para números, fontVariantNumeric: 'tabular-nums' com a fonte padrão (Inter).",
        },
      ],
    },
  },
]);

export default eslintConfig;
