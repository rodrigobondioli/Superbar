"use client";

import Image from "next/image";
import Link from "next/link";
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
    background: "#1C1C1E",
    border: focused ? "1px solid rgba(245,158,11,0.5)" : "1px solid #2C2C2E",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "#FAFAFA",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
    fontFamily: "var(--font-sans)",
    transition: "border-color 0.15s",
  });

  return (
    <>
      <style>{`input::placeholder { color: #52525B; }`}</style>

      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(to bottom, #0A0A0B 0%, #111113 100%)",
        }}
      >
        {/* Logo */}
        <div className="absolute left-4 md:left-8 lg:left-14" style={{ top: 32 }}>
          <Link href="/">
            <Image
              src="/img-lp/logo-superbar.svg"
              width={84}
              height={84}
              alt="Superbar"
              priority
              style={{ opacity: 0.9 }}
            />
          </Link>
        </div>

        {/* Center content */}
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
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1.375rem, 5.5vw, 2rem)",
              fontWeight: 600,
              color: "#FAFAFA",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              margin: "0 0 28px",
              textAlign: "center",
            }}
          >
            Bem-vindo ao Superbar
          </h1>

          {/* Card */}
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#1C1C1E",
              border: "1px solid #2C2C2E",
              borderRadius: "20px",
              padding: "32px",
            }}
          >
            <form
              action={signIn}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
                <p
                  style={{
                    fontSize: 13,
                    borderRadius: 12,
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
                  marginTop: 8,
                  width: "100%",
                  background: loading ? "rgba(245,158,11,0.55)" : "#F59E0B",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "14px 32px",
                  color: "#000000",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: loading ? "default" : "pointer",
                  letterSpacing: "0.01em",
                  transition: "background 0.15s, opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minHeight: "44px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Entrando…" : <>Entrar <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>

          {/* Links auxiliares */}
          <div style={{ marginTop: 20, display: "flex", gap: 28 }}>
            <Link
              href="/recuperar-senha"
              style={{
                color: "#A1A1AA",
                fontSize: "13px",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Esqueceu a senha?
            </Link>
            <Link
              href="/cadastro"
              style={{
                color: "#A1A1AA",
                fontSize: "13px",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
