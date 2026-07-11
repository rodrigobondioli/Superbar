import { XMLParser } from "fast-xml-parser";

export interface NfeItem {
  cprod: string | null;
  gtin: string | null;       // só quando válido (8–14 dígitos); "SEM GTIN" vira null
  nome: string;              // xProd
  unidadeNota: string;       // uCom bruto (UN, CX, L, GF…)
  quantidade: number;        // qCom
  custoUnitario: number;     // vUnCom
}

export interface NfeParsed {
  chaveNfe: string | null;   // chNFe (44 dígitos) ou null
  fornecedor: { cnpj: string | null; nome: string | null };
  itens: NfeItem[];
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false });

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function num(v: unknown): number {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function gtinValido(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s || /sem\s*gtin/i.test(s) || !/^\d{8,14}$/.test(s)) return null;
  return s;
}

/** Mapeia a unidade comercial da nota para a unidade-base do insumo. */
export function unidadeBase(uCom: string): "un" | "ml" | "l" | "g" | "kg" {
  const u = uCom.trim().toLowerCase();
  if (u === "l" || u === "lt" || u === "litro") return "l";
  if (u === "ml") return "ml";
  if (u === "kg") return "kg";
  if (u === "g" || u === "gr") return "g";
  return "un"; // UN, CX, GF, PC, FD… caem em unidade (o usuário ajusta se quiser)
}

/** Parseia o XML de uma NF-e (nfeProc ou NFe cru) e extrai fornecedor + itens. */
export function parseNfe(xml: string): NfeParsed {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    throw new Error("Não consegui ler o XML. Confira se é o arquivo da NF-e.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = doc as any;
  const infNFe = d?.nfeProc?.NFe?.infNFe ?? d?.NFe?.infNFe;
  if (!infNFe) throw new Error("O arquivo não parece ser uma NF-e válida.");

  const idAttr = String(infNFe["@_Id"] ?? "");
  const chaveDigits = idAttr.replace(/^NFe/i, "").replace(/\D/g, "");
  const chaveNfe = chaveDigits.length === 44 ? chaveDigits : null;

  const emit = infNFe.emit ?? {};
  const fornecedor = {
    cnpj: emit.CNPJ ? String(emit.CNPJ).replace(/\D/g, "") : null,
    nome: emit.xNome ? String(emit.xNome).trim() : (emit.xFant ? String(emit.xFant).trim() : null),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: NfeItem[] = asArray<any>(infNFe.det).map((det) => {
    const prod = det?.prod ?? {};
    return {
      cprod: prod.cProd != null ? String(prod.cProd).trim() : null,
      gtin: gtinValido(prod.cEAN ?? prod.cEANTrib),
      nome: String(prod.xProd ?? "").trim() || "Item sem nome",
      unidadeNota: String(prod.uCom ?? "").trim(),
      quantidade: num(prod.qCom),
      custoUnitario: num(prod.vUnCom),
    };
  });

  return { chaveNfe, fornecedor, itens };
}
