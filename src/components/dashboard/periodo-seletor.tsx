"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import type { PeriodoSearchParams } from "@/lib/dashboard/periodo";

const presets = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

export function PeriodoSeletor({ current }: { current: PeriodoSearchParams }) {
  const router = useRouter();
  const isCustomAtivo = Boolean(current.inicio && current.fim);
  const presetAtivo = isCustomAtivo ? null : current.preset ?? "7d";

  const [mostrarCustom, setMostrarCustom] = useState(isCustomAtivo);
  const [inicio, setInicio] = useState(current.inicio ?? "");
  const [fim, setFim] = useState(current.fim ?? "");

  function aplicarPreset(preset: string) {
    setMostrarCustom(false);
    router.push(`/dashboard/relatorios?preset=${preset}`);
  }

  function aplicarCustom(event: FormEvent) {
    event.preventDefault();
    if (!inicio || !fim) return;
    router.push(`/dashboard/relatorios?inicio=${inicio}&fim=${fim}`);
  }

  const allOptions = [
    ...presets.map(p => ({ value: p.value, label: p.label, isCustom: false })),
    { value: "custom", label: "Personalizado", isCustom: true },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {allOptions.map((opcao) => {
        const isActive = opcao.isCustom ? isCustomAtivo : presetAtivo === opcao.value;
        return (
          <Chip
            key={opcao.value}
            active={isActive}
            onClick={() => opcao.isCustom ? setMostrarCustom(v => !v) : aplicarPreset(opcao.value)}
          >
            {opcao.label}
          </Chip>
        );
      })}

      {mostrarCustom && (
        <form
          onSubmit={aplicarCustom}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "8px",
            padding: "5px 14px",
            background: "var(--bg-hover)",
            borderRadius: "8px",
          }}
        >
          <input
            type="date"
            value={inicio}
            max={fim || undefined}
            onChange={(e) => setInicio(e.target.value)}
            style={{ fontSize: "13px", background: "transparent", border: "none", color: "var(--fg)", outline: "none", colorScheme: "dark" }}
          />
          <span style={{ color: "var(--fg-subtle)", fontSize: "13px" }}>→</span>
          <input
            type="date"
            value={fim}
            min={inicio || undefined}
            onChange={(e) => setFim(e.target.value)}
            style={{ fontSize: "13px", background: "transparent", border: "none", color: "var(--fg)", outline: "none", colorScheme: "dark" }}
          />
          <Button type="submit" variant="primary" size="sm" disabled={!inicio || !fim}>
            Aplicar
          </Button>
        </form>
      )}
    </div>
  );
}
