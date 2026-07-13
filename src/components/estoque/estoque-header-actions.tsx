"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ImportarNfePanel } from "@/components/estoque/importar-nfe-panel";

/** Ações do cabeçalho de Estoque: contagem (secundário) + importar NF-e (primário).
 *  Usam o Button padrão (mesma altura/raio) — sem estilo inline solto. */
export function EstoqueHeaderActions() {
  const router = useRouter();
  const [nfeAberto, setNfeAberto] = useState(false);

  return (
    <>
      <div style={{ marginLeft: "auto", alignSelf: "center", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={() => router.push("/contagem")}>
          Fazer contagem
        </Button>
        <Button variant="primary" onClick={() => setNfeAberto(true)}>
          Importar nota fiscal (NF-e)
        </Button>
      </div>
      <ImportarNfePanel open={nfeAberto} onClose={() => setNfeAberto(false)} />
    </>
  );
}
