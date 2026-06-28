"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { traduzirErro } from "@/lib/utils";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [focos, setFocos] = useState({ email: false, senha: false, confirmar: false });

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#A1A1AA",
    display: "block",
    marginBottom: "6px",
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#111113",
    border: focused ? "1px solid rgba(245,158,11,0.5)" : "1px solid #2C2C2E",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "#FAFAFA",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
    fontFamily: "var(--font-sans)",
    transition: "border-color 0.15s",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    setLoading(false);
    if (error) { setErro(traduzirErro(error.message)); return; }
    if (data.user && data.session) { router.push("/onboarding"); } else { setSucesso(true); }
  }

  return (
    <>
      <style>{`input::placeholder { color: #71717A; }`}</style>

      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(to bottom, #0A0A0B 0%, #111113 100%)",
        }}
      >
        {/* Superbar Intelligence */}
        <div className="absolute right-4 md:right-8 lg:right-14" style={{ top: 32 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 12, color: "#ffffff" }}>
            Superbar Intelligence
          </span>
        </div>

        {/* Logo */}
        <div className="absolute left-4 md:left-8 lg:left-14" style={{ top: 32 }}>
          <Link href="/">
            <Image src="/img-lp/logo-superbar.svg" width={84} height={84} alt="Superbar" priority style={{ opacity: 0.9 }} />
          </Link>
        </div>

        {/* Center */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "120px 16px 48px",
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
            Crie sua conta
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
            {sucesso ? (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#FAFAFA", margin: 0, fontFamily: "var(--font-sans)" }}>
                  Verifique seu email
                </p>
                <p style={{ fontSize: 14, color: "#A1A1AA", margin: 0, fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
                  Enviamos um link de confirmação para <strong style={{ color: "#FAFAFA" }}>{email}</strong>. Clique no link para ativar sua conta.
                </p>
                <Link href="/login" style={{ fontSize: 13, color: "#A1A1AA", textDecoration: "none", marginTop: 8, fontFamily: "var(--font-sans)" }}>
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label htmlFor="email" style={labelStyle}>E-mail</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle(focos.email)}
                    onFocus={() => setFocos((f) => ({ ...f, email: true }))}
                    onBlur={() => setFocos((f) => ({ ...f, email: false }))}
                  />
                </div>
                <div>
                  <label htmlFor="senha" style={labelStyle}>Senha</label>
                  <input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    style={inputStyle(focos.senha)}
                    onFocus={() => setFocos((f) => ({ ...f, senha: true }))}
                    onBlur={() => setFocos((f) => ({ ...f, senha: false }))}
                  />
                </div>
                <div>
                  <label htmlFor="confirmar" style={labelStyle}>Confirmar senha</label>
                  <input
                    id="confirmar"
                    type="password"
                    placeholder="Repita a senha"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    style={inputStyle(focos.confirmar)}
                    onFocus={() => setFocos((f) => ({ ...f, confirmar: true }))}
                    onBlur={() => setFocos((f) => ({ ...f, confirmar: false }))}
                  />
                </div>

                {erro && (
                  <p style={{ fontSize: 13, borderRadius: 12, background: "rgba(239,68,68,0.10)", padding: "10px 14px", color: "#EF4444", margin: 0, fontFamily: "var(--font-sans)" }}>
                    {erro}
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
                  {loading ? "Criando conta…" : <>Criar conta <ArrowRight size={16} /></>}
                </button>
              </form>
            )}
          </div>

          <Link
            href="/login"
            style={{ marginTop: 20, color: "#A1A1AA", fontSize: "13px", textDecoration: "none", fontFamily: "var(--font-sans)" }}
          >
            Já tem conta? Entrar
          </Link>
        </div>
      </div>
    </>
  );
}
