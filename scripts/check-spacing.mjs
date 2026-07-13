#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-spacing — relatório (não-bloqueante) de espaçamento fora da escala base-4.
// NÃO é um lint que quebra o build: é uma lente pra você ver a dívida e consertar
// COM O OLHO NA TELA, arquivo por arquivo. Escala base-4 do DESIGN.md:
// 0,2,4,8,12,16,20,24,28,32,40,48,56,64 (2 = hairline). Roda: npm run check:spacing
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const OK = new Set([0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96]);
const PROPS = "gap|rowGap|columnGap|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|margin|marginTop|marginBottom|marginLeft|marginRight";
// pega só valores NUMÉRICOS diretos (ex: gap: 10). Ignora strings tipo "10px 24px".
const RE = new RegExp(`\\b(${PROPS}):\\s*(\\d+)\\b`, "g");

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const porArquivo = [];
let total = 0;
for (const f of walk("src")) {
  const txt = fs.readFileSync(f, "utf8");
  let n = 0, m;
  RE.lastIndex = 0;
  while ((m = RE.exec(txt))) {
    const val = Number(m[2]);
    if (!OK.has(val)) n++;
  }
  if (n > 0) { porArquivo.push([f.replace(/^src\//, ""), n]); total += n; }
}

porArquivo.sort((a, b) => b[1] - a[1]);
console.log(`\nEspaçamento fora da base-4 (numérico): ${total} ocorrências em ${porArquivo.length} arquivos.\n`);
for (const [f, n] of porArquivo.slice(0, 25)) console.log(`  ${String(n).padStart(3)}  ${f}`);
if (porArquivo.length > 25) console.log(`  … e mais ${porArquivo.length - 25} arquivos.`);
console.log(`\nConserte com o olho na tela (base-4: 4/8/12/16/20/24/32/48). Informativo — não quebra o build.\n`);
