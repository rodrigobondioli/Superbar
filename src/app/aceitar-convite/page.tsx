"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { processarConvite } from "./actions";

type Fase = "aguardando" | "definir_senha" | "processando" | "erro";

export default function AceitarConvitePage() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("aguardando");
  const [erro, setErro] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [focos, setFocos] = useState({ senha: false, confirmar: false });

  useEffect(() => {
    const supabase = createClient();

    // SIGNED_IN dispara quando o usuário autentica via link de convite
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setFase("definir_senha");
      }
    });

    // Timeout: se o link for inválido/expirado, nenhum evento chega
    const timer = setTimeout(() => {
      setFase(atual => {
        if (atual === "aguardando") {
          setErro("Link inválido ou expirado. Solicite um novo convite ao dono do bar.");
          return "erro";
        }
        return atual;
      });
    }, 6000);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

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

    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }

    setFase("processando");

    const supabase = createClient();

    // Define a senha da nova conta
    const { error: pwError } = await supabase.auth.updateUser({ password: senha });
    if (pwError) {
      setErro(pwError.message);
      setFase("definir_senha");
      return;
    }

    // Ativa o registro em bar_members (usa admin client no servidor)
    const result = await processarConvite();
    if ("error" in result) {
      setErro(result.error);
      setFase("erro");
      return;
    }

    // Redireciona pelo cargo
    const role = result.role;
    if (role === "bartender" || role === "garcom") router.push("/bartender");
    else if (role === "caixa") router.push("/caixa");
    else router.push("/dashboard");
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

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px 64px" }}>

          {/* Aguardando validação do link */}
          {fase === "aguardando" && (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px", fontFamily: "var(--font-mono)" }}>
                Validando convite…
              </h1>
              <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: 0 }}>
                Aguarde enquanto verificamos seu link.
              </p>
            </div>
          )}

          {/* Formulário de senha */}
          {(fase === "definir_senha" || fase === "processando") && (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--fg)", margin: "0 0 8px", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                Definir senha
              </h1>
              <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "0 0 32px", textAlign: "center" }}>
                Escolha uma senha para acessar o SUPERBAR.
              </p>

              <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "4px", padding: "40px" }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input
                    type="password"
                    placeholder="Nova senha"
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    style={inputStyle(focos.senha)}
                    onFocus={() => setFocos(f => ({ ...f, senha: true }))}
                    onBlur={() => setFocos(f => ({ ...f, senha: false }))}
                  />
                  <input
                    type="password"
                    placeholder="Confirmar senha"
                    required
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    style={inputStyle(focos.confirmar)}
                    onFocus={() => setFocos(f => ({ ...f, confirmar: true }))}
                    onBlur={() => setFocos(f => ({ ...f, confirmar: false }))}
                  />

                  {erro && (
                    <p style={{ fontSize: 13, borderRadius: 4, border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", background: "var(--danger-bg)", padding: "8px 12px", color: "var(--danger)", margin: 0 }}>
                      {erro}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={fase === "processando"}
                    style={{
                      width: "100%",
                      background: fase === "processando"
                        ? "color-mix(in srgb, var(--accent) 50%, transparent)"
                        : "var(--accent)",
                      border: "none", borderRadius: "4px", padding: "14px",
                      color: fase === "processando"
                        ? "color-mix(in srgb, var(--accent-fg) 50%, transparent)"
                        : "var(--accent-fg)",
                      fontWeight: "700", fontSize: "14px",
                      cursor: fase === "processando" ? "default" : "pointer",
                      letterSpacing: "0.01em", transition: "background 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                  >
                    {fase === "processando" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                        <circle cx="8" cy="8" r="6" stroke="var(--fg-subtle)" strokeWidth="2" />
                        <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    {fase === "processando" ? "Configurando acesso…" : "Confirmar e entrar"}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Erro */}
          {fase === "erro" && (
            <div style={{ textAlign: "center", maxWidth: 380 }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--danger)", margin: "0 0 12px", fontFamily: "var(--font-mono)" }}>
                Não foi possível aceitar o convite
              </h1>
              <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
                {erro}
              </p>
              <a href="/login" style={{ fontSize: 13, color: "var(--fg-subtle)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                Ir para o login
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
