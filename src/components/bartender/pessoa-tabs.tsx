"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { abrirComandasMesa } from "@/lib/bartender/actions";

export type PessoaTab = { id: string; nome_cliente: string | null; status: string };

/** Troca rápida de pessoa dentro da mesa, no topo da tela de pedido.
 *  Depois de pedir pra um, toca no outro e continua — sem sair da mesa. */
export function PessoaTabs({ comandas, atualId, mesaId, onSwitch, onAddPessoa }: {
  comandas: PessoaTab[];
  atualId: string;
  mesaId: string;
  /** Modo client (workspace): troca por estado em vez de navegar. */
  onSwitch?: (id: string) => void;
  onAddPessoa?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const addPessoa = () => {
    if (onAddPessoa) { onAddPessoa(); return; }
    startTransition(async () => {
      const r = await abrirComandasMesa(mesaId, [""]);
      if ("ids" in r && r.ids[0]) router.push(`/garcom/${r.ids[0]}`);
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0, WebkitOverflowScrolling: "touch" }}>
      {comandas.map((c, i) => {
        const active = c.id === atualId;
        const pagando = c.status === "aguardando_pagamento";
        const nome = c.nome_cliente ?? `Pessoa ${i + 1}`;
        const estilo: React.CSSProperties = {
          flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 600,
          textDecoration: "none", whiteSpace: "nowrap", cursor: "pointer",
          background: active ? "var(--accent)" : "var(--bg-card)",
          border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
          color: active ? "var(--accent-fg)" : pagando ? "var(--warn)" : "var(--fg-muted)",
          opacity: pagando ? 0.7 : 1,
        };
        const label = `${nome}${pagando ? " ·pago" : ""}`;
        return onSwitch
          ? <button key={c.id} type="button" onClick={() => onSwitch(c.id)} style={estilo}>{label}</button>
          : <Link key={c.id} href={`/garcom/${c.id}`} style={estilo}>{label}</Link>;
      })}
      <button
        onClick={addPessoa}
        disabled={pending}
        className="hover:!text-[var(--accent)]"
        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 600, background: "transparent", border: "1px dashed var(--border-strong)", color: "var(--fg-muted)", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {pending ? "…" : "+ pessoa"}
      </button>
    </div>
  );
}
