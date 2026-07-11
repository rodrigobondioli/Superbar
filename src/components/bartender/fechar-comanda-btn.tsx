"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fecharComanda } from "@/lib/bartender/actions";

export function FecharComandaBtn({ comandaId }: { comandaId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");

  const handleClick = () => {
    if (estado !== "idle") return;
    setEstado("enviando");
    startTransition(async () => {
      const result = await fecharComanda(comandaId);
      if (result && "error" in result) {
        setEstado("erro");
        setTimeout(() => setEstado("idle"), 2500);
        return;
      }
      setEstado("enviado");
      setTimeout(() => router.push("/garcom"), 1500);
    });
  };

  if (estado === "enviado") {
    return (
      <div style={{
        width: "100%", padding: "14px",
        background: "var(--ok-bg)",
        border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)",
        borderRadius: 16, textAlign: "center",
        color: "var(--ok)", fontSize: 15, fontWeight: 700,
      }}>
        ✓ Enviado para o caixa
      </div>
    );
  }

  if (estado === "erro") {
    return (
      <div style={{
        width: "100%", padding: "14px",
        background: "var(--danger-bg)",
        border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
        borderRadius: 16, textAlign: "center",
        color: "var(--danger)", fontSize: 14, fontWeight: 600,
      }}>
        Erro ao fechar. Tente novamente.
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={estado === "enviando"}
      style={{
        width: "100%", padding: "14px",
        background: estado === "enviando"
          ? "color-mix(in srgb, var(--accent) 60%, transparent)"
          : "var(--accent)",
        color: "var(--accent-fg)",
        border: "none", borderRadius: 999,
        fontSize: 15, fontWeight: 500,
        cursor: estado === "enviando" ? "not-allowed" : "pointer",
        opacity: estado === "enviando" ? 0.7 : 1,
        transition: "opacity 150ms, background 150ms",
      }}
    >
      {estado === "enviando" ? "Enviando..." : "Enviar conta → Caixa"}
    </button>
  );
}
