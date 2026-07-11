"use client";

import { useEffect, useState } from "react";

interface BarraProgressoProps {
  /** Progresso de 0 a 1. Valores fora do intervalo são clampados. */
  valor: number;
  /** Altura da barra em px. */
  altura?: number;
  /** Raio das bordas (px). */
  raio?: number;
  /** Cor do trilho de fundo. */
  corTrilho?: string;
  /** Cor (ou gradiente) da barra preenchida. */
  corBarra?: string;
  /** Duração da transição em ms. */
  duracaoMs?: number;
  /** Atraso em ms — usado para efeito escadinha em listas. */
  delayMs?: number;
}

/**
 * Barra de progresso que cresce da esquerda (scaleX) uma vez ao montar
 * e depois transiciona suave quando o `valor` muda. Anima só `transform`
 * (GPU, 60fps, sem layout-thrash).
 */
export function BarraProgresso({
  valor,
  altura = 2,
  raio = 999,
  corTrilho = "var(--border-strong)",
  corBarra = "rgba(255,255,255,0.5)",
  duracaoMs = 850,
  delayMs = 0,
}: BarraProgressoProps) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const escala = visivel ? Math.max(0, Math.min(valor, 1)) : 0;

  return (
    <div style={{ height: altura, background: corTrilho, borderRadius: raio, overflow: "hidden" }}>
      <div
        style={{
          height: altura,
          width: "100%",
          background: corBarra,
          borderRadius: raio,
          transformOrigin: "left",
          transform: `scaleX(${escala})`,
          transition: `transform ${duracaoMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          transitionDelay: `${delayMs}ms`,
        }}
      />
    </div>
  );
}
