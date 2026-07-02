"use client";

import { ArrowRight } from "lucide-react";
import { useComandaModal } from "@/components/comanda-modal";

interface CTAButtonProps {
  label?: string;
  className?: string;
}

export function CTAButton({ label = "Começar agora", className = "" }: CTAButtonProps) {
  const { open } = useComandaModal();

  return (
    <button
      onClick={open}
      className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-black transition hover:opacity-90 ${className}`}
      style={{
        background: "#FF3500",
        fontFamily: "var(--font-roboto-mono)",
        border: "none",
      }}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
