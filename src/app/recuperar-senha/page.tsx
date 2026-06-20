"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    background: "var(--bg-inset)",
    border: `1px solid ${focused ? "var(--fg)" : "var(--border)"}`,
    borderRadius: "4px",
    padding: "14px 16px",
    color: "var(--fg)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/nova-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(true);
  }

  return (
    <>
      <style>{`input::placeholder { color: var(--fg-subtle); }`}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {/* Logo */}
        <div style={{ position: "absolute", top: 32, left: 32 }}>
          <Image src="/superbar-logo.svg" width={92} height={31} alt="Superbar" priority />
        </div>

        {/* Center */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px 64px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
            Recuperar senha
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "0 0 32px", textAlign: "center" }}>
            Enviaremos um link para redefinir sua senha.
          </p>

          <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "4px", padding: "40px" }}>

            {sucesso ? (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                  Email enviado
                </p>
                <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
                  Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.
                </p>
                <a href="/login" style={{ fontSize: 13, color: "var(--fg-subtle)", textDecoration: "underline", textUnderlineOffset: "3px", marginTop: 8 }}>
                  Voltar para o login
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input
                  type="email"
                  placeholder="E-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle(emailFocused)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />

                {erro && (
                  <p style={{ fontSize: 13, borderRadius: 4, border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", background: "var(--danger-bg)", padding: "8px 12px", color: "var(--danger)", margin: 0 }}>
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: loading ? "color-mix(in srgb, var(--accent) 50%, transparent)" : "var(--accent)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "14px",
                    color: loading ? "color-mix(in srgb, var(--accent-fg) 50%, transparent)" : "var(--accent-fg)",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: loading ? "default" : "pointer",
                    letterSpacing: "0.01em",
                    transition: "background 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                      <circle cx="8" cy="8" r="6" stroke="var(--fg-subtle)" strokeWidth="2" />
                      <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  {loading ? "Enviando..." : "Enviar link"}
                </button>
              </form>
            )}
          </div>

          <a href="/login" style={{ marginTop: "16px", color: "var(--fg-subtle)", fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Lembrou a senha? Entrar
          </a>
        </div>
      </div>
    </>
  );
}
