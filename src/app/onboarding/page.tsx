"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarBarOnboarding } from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Onboarding = SÓ o fundamental: criar o bar. Cardápio, custo, mesas, equipe e
// turno viram itens do checklist na home (Guia de configuração) — cada um um
// clique pra sua tela. Fricção mínima na largada; o painel guia o resto.
// Componentes do DS: <Button> (pill) e <Input> (rounded-xl) — nada de inline.
// Inputs sem label visível: o rótulo vive no placeholder + aria-label (igual login).

export default function OnboardingPage() {
  const router = useRouter();

  const [nomeBar, setNomeBar] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [criarLoading, setCriarLoading] = useState(false);
  const [criarError, setCriarError] = useState<string | null>(null);

  async function handleCriarBar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCriarLoading(true);
    setCriarError(null);
    const fd = new FormData(e.currentTarget);
    const result = await criarBarOnboarding(fd);
    if ("error" in result) {
      setCriarError(result.error);
      setCriarLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <style>{`input::placeholder { color: var(--fg-subtle); }`}</style>

      {/* Conteúdo central */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "80px 16px 64px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Image
            src="/favicon.svg"
            width={91}
            height={91}
            alt="Superbar"
            priority
            style={{ display: "block", margin: "0 auto 20px" }}
          />
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "var(--fg)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "-0.01em",
              margin: "0 0 8px",
            }}
          >
            Vamos criar seu bar
          </h1>
          <p style={{ fontSize: "14px", color: "var(--fg-subtle)", margin: 0 }}>
            Leva 30 segundos. O resto você monta no seu ritmo, direto no painel.
          </p>
        </div>

        <form
          onSubmit={handleCriarBar}
          className="p-5 sm:p-8"
          style={{
            width: "100%",
            maxWidth: "520px",
            background: "transparent",
            border: "1px solid var(--border-strong)",
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <Input
            id="nome"
            name="nome"
            placeholder="Nome do bar"
            aria-label="Nome do bar"
            value={nomeBar}
            onChange={(e) => setNomeBar(e.target.value)}
            required
            autoFocus
          />

          <Input
            id="nome_usuario"
            name="nome_usuario"
            placeholder="Seu nome"
            aria-label="Seu nome"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
          />

          {criarError && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--danger)",
                background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                borderRadius: "8px",
                padding: "10px 14px",
                margin: 0,
              }}
            >
              {criarError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={criarLoading} className="w-full">
            {criarLoading ? "Criando..." : "Criar meu bar →"}
          </Button>
        </form>

      </div>
    </div>
  );
}
