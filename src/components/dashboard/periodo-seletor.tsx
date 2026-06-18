"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
      {allOptions.map((opcao) => {
        const isActive = opcao.isCustom ? isCustomAtivo : presetAtivo === opcao.value;
        return (
          <button
            key={opcao.value}
            type="button"
            onClick={() => opcao.isCustom ? setMostrarCustom(v => !v) : aplicarPreset(opcao.value)}
            style={{
              fontSize: "14px",
              fontWeight: isActive ? 500 : 400,
              padding: isActive ? "5px 14px" : "5px 14px",
              borderRadius: "99px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: isActive ? "#260078" : "transparent",
              color: isActive ? "white" : "rgba(255,255,255,0.38)",
            }}
          >
            {opcao.label}
          </button>
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
            background: "rgba(255,255,255,0.06)",
            borderRadius: "99px",
          }}
        >
          <input
            type="date"
            value={inicio}
            max={fim || undefined}
            onChange={(e) => setInicio(e.target.value)}
            style={{ fontSize: "13px", background: "transparent", border: "none", color: "white", outline: "none", colorScheme: "dark" }}
          />
          <span style={{ color: "rgba(255,255,255,0.30)", fontSize: "13px" }}>→</span>
          <input
            type="date"
            value={fim}
            min={inicio || undefined}
            onChange={(e) => setFim(e.target.value)}
            style={{ fontSize: "13px", background: "transparent", border: "none", color: "white", outline: "none", colorScheme: "dark" }}
          />
          <button
            type="submit"
            disabled={!inicio || !fim}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              padding: "3px 12px",
              borderRadius: "99px",
              border: "none",
              background: "#260078",
              color: "white",
              cursor: "pointer",
              opacity: (!inicio || !fim) ? 0.4 : 1,
            }}
          >
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}
