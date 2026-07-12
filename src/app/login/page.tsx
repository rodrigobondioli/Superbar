"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, use } from "react";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = use(searchParams);

  const [loading, setLoading] = useState(false);

  const linkStyle: React.CSSProperties = {
    color: "var(--fg-muted)",
    fontSize: 13,
    textDecoration: "none",
    fontFamily: "var(--font-sans)",
  };

  return (
    <>
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
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13, color: "var(--fg-muted)" }}>
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
              className="p-6 md:p-12"
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid #383839",
                borderRadius: 24,
              }}
            >
              <form
                action={signIn}
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
                onSubmit={() => setLoading(true)}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Email"
                    aria-label="Email"
                    required
                  />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Senha"
                    aria-label="Senha"
                    required
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

                <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
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
