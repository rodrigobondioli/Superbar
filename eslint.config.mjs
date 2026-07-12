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
    },
  },
]);

export default eslintConfig;
