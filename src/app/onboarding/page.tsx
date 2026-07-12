"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarBarOnboarding } from "@/lib/onboarding/actions";

// Onboarding = SÓ o fundamental: criar o bar. Cardápio, custo, mesas, equipe e
// turno viram itens do checklist na home (Guia de configuração) — cada um um
// clique pra sua tela. Fricção mínima na largada; o painel guia o resto.

const lbl: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--fg-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "6px",
};

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "12px 14px",
  color: "var(--fg)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  colorScheme: "dark",
};

const btnPrimary: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-fg)",
  border: "none",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 150ms",
};

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
            width={76}
            height={76}
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
            maxWidth: "440px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <label htmlFor="nome" style={lbl}>
              Nome do bar
            </label>
            <input
              id="nome"
              name="nome"
              placeholder="Ex: Aurora Bar"
              value={nomeBar}
              onChange={(e) => setNomeBar(e.target.value)}
              required
              autoFocus
              style={inp}
            />
          </div>

          <div>
            <label htmlFor="nome_usuario" style={lbl}>
              Seu nome
            </label>
            <input
              id="nome_usuario"
              name="nome_usuario"
              placeholder="Como você quer ser chamado"
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              style={inp}
            />
          </div>

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

          <button
            type="submit"
            disabled={criarLoading || !nomeBar.trim()}
            style={{
              ...btnPrimary,
              opacity: criarLoading || !nomeBar.trim() ? 0.6 : 1,
              cursor: criarLoading || !nomeBar.trim() ? "not-allowed" : "pointer",
            }}
          >
            {criarLoading ? "Criando..." : "Criar meu bar →"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            fontSize: "12px",
            color: "var(--fg-subtle)",
            textAlign: "center",
            maxWidth: 380,
          }}
        >
          Cardápio, custo, mesas e equipe você adiciona depois — o painel te guia passo a passo.
        </p>
      </div>
    </div>
  );
}
