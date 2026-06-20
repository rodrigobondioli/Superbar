"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function traduzirErro(msg: string): string {
  if (msg.includes("already registered") || msg.includes("User already registered"))
    return "Este email já está em uso.";
  if (msg.includes("Password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("valid email"))
    return "Insira um email válido.";
  return msg;
}

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nomeBar, setNomeBar] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [focos, setFocos] = useState({ nomeBar: false, email: false, senha: false, confirmar: false });

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

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_bar: nomeBar.trim() } },
    });
    setLoading(false);

    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }

    if (data.user && data.session) {
      // Confirmação de email desabilitada — já tem sessão
      router.push("/onboarding");
    } else {
      setSucesso(true);
    }
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
            Crie sua conta
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "0 0 32px", textAlign: "center" }}>
            Seu bar fica super inteligente.
          </p>

          <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "4px", padding: "40px" }}>

            {sucesso ? (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                  Verifique seu email
                </p>
                <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
                  Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta.
                </p>
                <a href="/login" style={{ fontSize: 13, color: "var(--fg-subtle)", textDecoration: "underline", textUnderlineOffset: "3px", marginTop: 8 }}>
                  Voltar para o login
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input
                  type="text"
                  placeholder="Nome do bar"
                  required
                  value={nomeBar}
                  onChange={(e) => setNomeBar(e.target.value)}
                  style={inputStyle(focos.nomeBar)}
                  onFocus={() => setFocos((f) => ({ ...f, nomeBar: true }))}
                  onBlur={() => setFocos((f) => ({ ...f, nomeBar: false }))}
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle(focos.email)}
                  onFocus={() => setFocos((f) => ({ ...f, email: true }))}
                  onBlur={() => setFocos((f) => ({ ...f, email: false }))}
                />
                <input
                  type="password"
                  placeholder="Senha"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  style={inputStyle(focos.senha)}
                  onFocus={() => setFocos((f) => ({ ...f, senha: true }))}
                  onBlur={() => setFocos((f) => ({ ...f, senha: false }))}
                />
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  style={inputStyle(focos.confirmar)}
                  onFocus={() => setFocos((f) => ({ ...f, confirmar: true }))}
                  onBlur={() => setFocos((f) => ({ ...f, confirmar: false }))}
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
                  {loading ? "Criando conta..." : "Criar conta"}
                </button>
              </form>
            )}
          </div>

          <a href="/login" style={{ marginTop: "16px", color: "var(--fg-subtle)", fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Já tem conta? Entrar
          </a>
        </div>
      </div>
    </>
  );
}
