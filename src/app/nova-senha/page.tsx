"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { traduzirErro } from "@/lib/utils";
import { londrina } from "@/app/fonts";

export default function NovaSenhaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [pronta, setPronta] = useState(false);
  const [expirado, setExpirado] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Supabase processa o fragment da URL (#access_token=...) automaticamente
    // e dispara PASSWORD_RECOVERY quando o link de recuperação é válido
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPronta(true);
      }
    });

    // Se após 5s nenhum evento chegar, o link é inválido ou expirado
    const timer = setTimeout(() => {
      setPronta((atual) => {
        if (!atual) setExpirado(true);
        return atual;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase.auth]);

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
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);

    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className={londrina.variable} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {/* Logo */}
        <div style={{ position: "absolute", top: 32, left: 32 }}>
          <Image src="/superbar-logo.svg" width={92} height={31} alt="Superbar" priority />
        </div>

        {/* Center */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 16px 64px" }}>
          <h1 style={{ fontSize: 40, fontWeight: 400, color: "var(--fg)", margin: "0 0 8px", fontFamily: "var(--font-londrina)", letterSpacing: "0.01em", lineHeight: 1, textTransform: "uppercase", textAlign: "center" }}>
            Nova senha
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "0 0 32px", textAlign: "center" }}>
            Escolha uma senha para sua conta.
          </p>

          <div
            className="p-6 sm:p-10"
            style={{ width: "100%", maxWidth: "420px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px" }}
          >

            {expirado ? (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--danger)", margin: 0 }}>
                  Link inválido ou expirado
                </p>
                <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
                  Solicite um novo link de recuperação.
                </p>
                <a href="/recuperar-senha" style={{ fontSize: 13, color: "var(--fg-subtle)", textDecoration: "underline", textUnderlineOffset: "3px", marginTop: 8 }}>
                  Solicitar novo link
                </a>
              </div>
            ) : !pronta ? (
              <div style={{ textAlign: "center", color: "var(--fg-subtle)", fontSize: 14 }}>
                Validando link...
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input
                  type="password"
                  placeholder="Nova senha"
                  aria-label="Nova senha"
                  aria-invalid={!!erro}
                  aria-describedby={erro ? "nova-senha-erro" : undefined}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirmar nova senha"
                  aria-label="Confirmar nova senha"
                  aria-invalid={!!erro}
                  aria-describedby={erro ? "nova-senha-erro" : undefined}
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />

                {erro && (
                  <p id="nova-senha-erro" role="alert" style={{ fontSize: 13, borderRadius: 8, border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", background: "var(--danger-bg)", padding: "8px 12px", color: "var(--danger)", margin: 0 }}>
                    {erro}
                  </p>
                )}

                <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                  {loading && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                      <circle cx="8" cy="8" r="6" stroke="var(--fg-subtle)" strokeWidth="2" />
                      <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
