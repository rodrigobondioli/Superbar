"use client";

import Image from "next/image";
import { useState } from "react";
import { criarBar } from "@/lib/onboarding/actions";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [nomeBar, setNomeBar]         = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  const lbl: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--fg-subtle)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: "6px",
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-inset)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "12px 14px",
    color: "var(--fg)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await criarBar(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // Se sucesso, criarBar faz redirect — não precisa tratar aqui
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <style>{`input::placeholder { color: var(--fg-subtle); }`}</style>

      {/* Logo */}
      <div style={{ position: "absolute", top: 32, left: 32 }}>
        <Image src="/superbar-logo.svg" width={92} height={31} alt="Superbar" priority />
      </div>

      {/* Conteúdo central */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", flex: 1, padding: "80px 16px 64px",
      }}>

        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{
            fontSize: "26px", fontWeight: 600, color: "var(--fg)",
            fontFamily: "var(--font-mono)", letterSpacing: "-0.01em", margin: "0 0 8px",
          }}>
            Vamos configurar seu bar
          </h1>
          <p style={{ fontSize: "14px", color: "var(--fg-subtle)", margin: 0 }}>
            Leva menos de 1 minuto. Você completa o resto nas configurações.
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%", maxWidth: "440px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "32px",
            display: "flex", flexDirection: "column", gap: "20px",
          }}
        >
          {/* Nome do bar */}
          <div>
            <label htmlFor="nome" style={lbl}>Nome do bar</label>
            <input
              id="nome"
              name="nome"
              placeholder="Ex: Aurora Bar"
              value={nomeBar}
              onChange={e => setNomeBar(e.target.value)}
              required
              autoFocus
              style={input}
            />
          </div>

          {/* Nome do usuário */}
          <div>
            <label htmlFor="nome_usuario" style={lbl}>Seu nome</label>
            <input
              id="nome_usuario"
              name="nome_usuario"
              placeholder="Como você quer ser chamado"
              value={nomeUsuario}
              onChange={e => setNomeUsuario(e.target.value)}
              style={input}
            />
          </div>

          {/* Erro */}
          {error && (
            <p style={{
              fontSize: "13px", color: "var(--danger)",
              background: "color-mix(in srgb, var(--danger) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
              borderRadius: "4px", padding: "10px 14px", margin: 0,
            }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !nomeBar.trim()}
            style={{
              background: "var(--accent)",
              color: "var(--accent-fg)",
              border: "none",
              borderRadius: "4px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading || !nomeBar.trim() ? "not-allowed" : "pointer",
              opacity: loading || !nomeBar.trim() ? 0.6 : 1,
              transition: "opacity 150ms",
            }}
          >
            {loading ? "Criando..." : "Criar meu bar →"}
          </button>
        </form>

        <p style={{ marginTop: "24px", fontSize: "12px", color: "var(--fg-subtle)", textAlign: "center" }}>
          Logo, endereço e equipe você adiciona depois nas Configurações.
        </p>
      </div>
    </div>
  );
}
