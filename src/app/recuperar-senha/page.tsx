"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/nova-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }

    setSucesso(true);
  }

  return (
    <>
      <style>{`input::placeholder { color: var(--fg-subtle); }`}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {/* Logo — same position as site-nav */}
        <div className="absolute top-6 left-4 md:left-8 lg:left-14">
          <Image src="/img-lp/logo-superbar.svg" width={48} height={48} alt="Superbar" priority style={{ opacity: 0.9 }} />
        </div>

        {/* Center */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px 64px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 400, color: "var(--fg)", margin: "0 0 20px", fontFamily: "var(--font-display)", textAlign: "center" }}>
            Recuperar senha
          </h1>

          <div
            className="p-6 sm:p-10"
            style={{ width: "100%", maxWidth: "420px", background: "var(--bg-elevated)", border: "none", borderRadius: "16px" }}
          >
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
                  <p style={{ fontSize: 13, borderRadius: 12, border: "none", background: "var(--danger-bg)", padding: "8px 12px", color: "var(--danger)", margin: 0 }}>
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "14px 32px",
                    color: "#000000",
                    fontFamily: "var(--font-mono)",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: loading ? "default" : "pointer",
                    letterSpacing: "0.04em",
                    transition: "opacity 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Enviando..." : <>Enviar link <ArrowRight size={16} /></>}
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
