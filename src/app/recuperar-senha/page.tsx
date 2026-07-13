"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { traduzirErro } from "@/lib/utils";
import { londrina } from "@/app/fonts";

export default function RecuperarSenhaPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const linkStyle: React.CSSProperties = {
    color: "var(--fg-muted)",
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
      <div
        className={londrina.variable}
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
            gap: 32,
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
                fontFamily: "var(--font-londrina)",
                fontSize: 40,
                fontWeight: 400,
                color: "#FFFFFF",
                letterSpacing: "0.01em",
                lineHeight: 1,
                textTransform: "uppercase",
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
                  <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0, fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
                    Verifique sua caixa de entrada em <strong style={{ color: "#FAFAFA" }}>{email}</strong> e clique no link para redefinir sua senha.
                  </p>
                  <Link href="/login" style={{ ...linkStyle, marginTop: 8 }}>
                    Voltar para o login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    aria-invalid={!!erro}
                    aria-describedby={erro ? "recuperar-erro" : undefined}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {erro && (
                    <p id="recuperar-erro" role="alert" style={{ fontSize: 13, borderRadius: 8, background: "rgba(239,68,68,0.10)", padding: "10px 14px", color: "#EF4444", margin: 0, fontFamily: "var(--font-sans)" }}>
                      {erro}
                    </p>
                  )}

                  <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                    {loading ? "Enviando…" : "Enviar link"}
                  </Button>
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
