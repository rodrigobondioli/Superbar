"use client";

import Image from "next/image";
import { signIn } from "@/lib/auth/actions";
import { useState, use } from "react";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = use(searchParams);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <style>{`input::placeholder { color: var(--fg-subtle); }`}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {/* Version — top-right */}
        <div style={{ position: "absolute", top: 32, right: 32 }}>
          <span style={{ fontSize: 12, color: "var(--fg-subtle)", fontWeight: 500, letterSpacing: "0.04em" }}>
            Versão 1.0
          </span>
        </div>

        {/* Logo — top-left */}
        <div style={{ position: "absolute", top: 32, left: 32 }}>
          <Image src="/superbar-logo.svg" width={92} height={31} alt="Superbar" priority />
        </div>

        {/* Center content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px 64px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
            Seja bem-vindo ao Superbar
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "0 0 32px", textAlign: "center" }}>
            The operating system for premium bars.
          </p>

          {/* Card */}
          <div style={{
            width: "100%", maxWidth: "420px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "40px",
          }}>
            <form
              action={signIn}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
              onSubmit={() => setLoading(true)}
            >
              <input
                type="email"
                name="email"
                placeholder="E-mail"
                required
                style={inputStyle(emailFocused)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                required
                style={inputStyle(passwordFocused)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              {error && (
                <p style={{
                  fontSize: 13, borderRadius: 4,
                  border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                  background: "var(--danger-bg)",
                  padding: "8px 12px", color: "var(--danger)", margin: 0,
                }}>
                  {error}
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
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          <a href="#" style={{
            marginTop: "16px",
            color: "var(--fg-subtle)",
            fontSize: "13px",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            cursor: "pointer",
          }}>Esqueceu a senha?</a>
        </div>
      </div>
    </>
  );
}
