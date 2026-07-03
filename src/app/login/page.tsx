"use client";

import Image from "next/image";
import Link from "next/link";
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
    background: "#1C1C1E",
    border: focused ? "1px solid rgba(255,53,0,0.6)" : "1px solid transparent",
    borderRadius: 8,
    padding: "20px 16px",
    color: "#FAFAFA",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
    fontFamily: "var(--font-sans)",
    transition: "border-color 0.15s",
  });

  const linkStyle: React.CSSProperties = {
    color: "#898989",
    fontSize: 13,
    textDecoration: "none",
    fontFamily: "var(--font-sans)",
  };

  return (
    <>
      <style>{`input::placeholder { color: #898989; }`}</style>

      <div
        style={{
          minHeight: "100dvh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: "#111113",
        }}
      >
        {/* Superbar Intelligence — topo direito */}
        <div className="absolute right-4 md:right-8 lg:right-14" style={{ top: 30 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13, color: "#898989" }}>
            Superbar Intelligence
          </span>
        </div>

        {/* Conteúdo central */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "48px 16px",
            gap: 48,
          }}
        >
          {/* Logo + título */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <Link href="/" aria-label="Superbar">
              <Image
                src="/favicon.svg"
                width={91}
                height={91}
                alt="Superbar"
                priority
                style={{ borderRadius: "50%", display: "block" }}
              />
            </Link>
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 24,
                fontWeight: 500,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                margin: 0,
                textAlign: "center",
              }}
            >
              Bem-vindo ao Superbar
            </h1>
          </div>

          {/* Bloco do formulário */}
          <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            {/* Card */}
            <div
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid #383839",
                borderRadius: 24,
                padding: 48,
              }}
            >
              <form
                action={signIn}
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
                onSubmit={() => setLoading(true)}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Email"
                    aria-label="Email"
                    required
                    style={inputStyle(emailFocused)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Senha"
                    aria-label="Senha"
                    required
                    style={inputStyle(passwordFocused)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </div>

                {error && (
                  <p
                    style={{
                      fontSize: 13,
                      borderRadius: 8,
                      background: "rgba(239,68,68,0.10)",
                      padding: "10px 14px",
                      color: "#EF4444",
                      margin: 0,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: loading ? "rgba(255,53,0,0.55)" : "#FF3500",
                    border: "none",
                    borderRadius: 9999,
                    padding: "13px 24px",
                    color: "#111113",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: loading ? "default" : "pointer",
                    transition: "background 0.15s, opacity 0.15s",
                    minHeight: 44,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Entrando…" : "Entrar"}
                </button>
              </form>
            </div>

            {/* Links auxiliares */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/recuperar-senha" style={linkStyle}>Esqueceu a senha?</Link>
              <span style={{ color: "#383839", fontSize: 13 }}>|</span>
              <Link href="/cadastro" style={linkStyle}>Criar conta</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
