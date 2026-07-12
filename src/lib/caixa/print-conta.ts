/**
 * print-conta.ts — Gerador de cupom para impressora térmica 80mm.
 * Abre uma nova janela com HTML formatado e dispara window.print().
 * Não requer driver especial — o operador seleciona a impressora
 * térmica no diálogo padrão do browser (funciona em iPad e PC).
 */

import { currency as fmt } from "@/lib/format";

export interface ItemCupom {
  nome: string;
  quantidade: number;
  preco_total: number;
}

export interface DadosCupom {
  barNome: string;
  mesa: string;
  abertaEm: string;       // ISO string
  itens: ItemCupom[];
  subtotal: number;
  incluirServico: boolean;
  servicoPct: number;     // ex: 10
  servicoValor: number;   // calculado
  totalFinal: number;
}

export function imprimirConta(dados: DadosCupom) {
  const {
    barNome, mesa, abertaEm, itens,
    subtotal, incluirServico, servicoPct, servicoValor, totalFinal,
  } = dados;

  const abertura = new Date(abertaEm).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const fechamento = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const linhasItens = itens.map(it =>
    `<tr>
      <td>${it.quantidade}× ${it.nome}</td>
      <td class="r">${fmt.format(it.preco_total)}</td>
    </tr>`
  ).join("\n");

  const linhaServico = incluirServico
    ? `<tr><td>Serviço ${servicoPct}%</td><td class="r">${fmt.format(servicoValor)}</td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Cupom — ${mesa}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      width: 74mm;
    }
    .center { text-align: center; }
    .bar-nome {
      font-size: 15px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .meta {
      font-size: 9px;
      text-align: center;
      color: #444;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; vertical-align: top; line-height: 1.4; }
    .r { text-align: right; white-space: nowrap; padding-left: 4px; }
    .sep td { padding-top: 5px; }
    .total-label { font-weight: bold; font-size: 13px; }
    .total-valor { font-weight: bold; font-size: 13px; text-align: right; }
    .footer { text-align: center; font-size: 9px; margin-top: 10px; color: #555; }
  </style>
</head>
<body>
  <p class="bar-nome">${barNome.toUpperCase()}</p>
  <div class="meta">
    <span>${mesa}</span><br>
    <span>Abertura: ${abertura}</span><br>
    <span>Fechamento: ${fechamento}</span>
  </div>

  <hr>

  <table>
    ${linhasItens}
  </table>

  <hr>

  <table>
    <tr>
      <td>Subtotal</td>
      <td class="r">${fmt.format(subtotal)}</td>
    </tr>
    ${linhaServico}
    <tr class="sep">
      <td class="total-label">TOTAL</td>
      <td class="total-valor">${fmt.format(totalFinal)}</td>
    </tr>
  </table>

  <p class="footer">Obrigado pela preferência!</p>
</body>
</html>`;

  const w = window.open("", "_blank", "width=340,height=620,toolbar=0,menubar=0,status=0");
  if (!w) {
    // Popup bloqueado — fallback: tenta abrir mesmo sem as flags
    const w2 = window.open("about:blank");
    if (!w2) { alert("Habilite popups para imprimir."); return; }
    w2.document.write(html);
    w2.document.close();
    setTimeout(() => w2.print(), 400);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Aguarda layout e dispara print
  const doPrint = () => { try { w.print(); } catch { /* ignore */ } };
  if (w.document.readyState === "complete") {
    setTimeout(doPrint, 100);
  } else {
    w.addEventListener("load", () => setTimeout(doPrint, 100));
    setTimeout(doPrint, 500); // fallback
  }
}
