"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { traduzirErro } from "@/lib/utils";

export default function RecuperarSenhaPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#1C1C1E",
    border: focused ? "1px solid rgba(255,53,0,0.6)" : "1px solid transparent",
    borderRadius: 8,
    padding: "16px",
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const redirectTo = `${window.location.origin}/nova-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { setErro(traduzirErro(error.message)); return; }
    setSucesso(true);
  }

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
              Recuperar senha
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
              {sucesso ? (
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#FAFAFA", margin: 0, fontFamily: "var(--font-sans)" }}>
                    Email enviado
                  </p>
                  <p style={{ fontSize: 14, color: "#898989", margin: 0, fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
                    Verifique sua caixa de entrada em <strong style={{ color: "#FAFAFA" }}>{email}</strong> e clique no link para redefinir sua senha.
                  </p>
                  <Link href="/login" style={{ ...linkStyle, marginTop: 8 }}>
                    Voltar para o login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle(emailFocused)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />

                  {erro && (
                    <p style={{ fontSize: 13, borderRadius: 8, background: "rgba(239,68,68,0.10)", padding: "10px 14px", color: "#EF4444", margin: 0, fontFamily: "var(--font-sans)" }}>
                      {erro}
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
                    {loading ? "Enviando…" : "Enviar link"}
                  </button>
                </form>
              )}
            </div>

            {/* Links auxiliares */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={linkStyle}>Lembrou a senha?</span>
              <span style={{ color: "#383839", fontSize: 13 }}>|</span>
              <Link href="/login" style={linkStyle}>Entrar</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
