"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
    background: focused ? "color-mix(in srgb, var(--bg-inset) 80%, var(--bg))" : "var(--bg-inset)",
    border: "none",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "var(--fg)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
    transition: "background 0.15s",
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

        {/* Logo — same position as site-nav (px-4 md:px-8 lg:px-14 / py-6) */}
        <div className="absolute top-6 left-4 md:left-8 lg:left-14">
          <Image src="/img-lp/logo-superbar.svg" width={48} height={48} alt="Superbar" priority style={{ opacity: 0.9 }} />
        </div>

        {/* Center content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px 64px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 400, color: "var(--fg)", margin: "0 0 20px", fontFamily: "var(--font-display)", textAlign: "center" }}>
            Bem-vindo ao Superbar
          </h1>

          {/* Card */}
          <div
            className="p-6 sm:p-10"
            style={{
              width: "100%", maxWidth: "420px",
              background: "var(--bg-elevated)",
              border: "none",
              borderRadius: "16px",
            }}
          >
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
                  fontSize: 13, borderRadius: 12,
                  border: "none",
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
                  background: loading ? "color-mix(in srgb, var(--accent) 55%, transparent)" : "var(--accent)",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "14px 32px",
                  color: "#000000",
                  fontFamily: "var(--font-mono)",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: loading ? "default" : "pointer",
                  letterSpacing: "0.04em",
                  transition: "background 0.15s, opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Entrando..." : <>Entrar <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: 24 }}>
            <a href="/recuperar-senha" style={{ color: "var(--fg-subtle)", fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Esqueceu a senha?
            </a>
            <a href="/cadastro" style={{ color: "var(--fg-subtle)", fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Criar conta
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
