"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/*
  SUPERBAR — Avatar (Figma DS · Components/Base → Avatar)
  ──────────────────────────────────────────────────────
  Círculo · bg/surface-raised (bg-hover) · border/default · iniciais em text/primary
  Tamanho base 48px (Figma). Mostra a foto quando houver; senão, as iniciais do nome.
*/

export interface AvatarProps extends React.ComponentPropsWithoutRef<"span"> {
  /** Nome usado pra derivar as iniciais quando não há foto. */
  name?: string | null;
  /** URL da foto; se ausente ou falhar ao carregar, mostra as iniciais. */
  src?: string | null;
  /** Diâmetro em px (Figma DS = 48). */
  size?: number;
}

function iniciais(nome?: string | null): string {
  if (!nome) return "";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase();
}

export function Avatar({ name, src, size = 48, className, style, ...props }: AvatarProps) {
  const [erro, setErro] = React.useState(false);
  const mostrarFoto = Boolean(src) && !erro;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full " +
          "border border-border-strong bg-bg-hover font-semibold text-fg",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.27)), ...style }}
      {...props}
    >
      {mostrarFoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={name ?? ""}
          onError={() => setErro(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        iniciais(name)
      )}
    </span>
  );
}
