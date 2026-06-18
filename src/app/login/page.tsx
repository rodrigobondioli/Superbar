"use client";

import Image from "next/image";
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
  const [btnHovered, setBtnHovered] = useState(false);

  const inputStyle = (focused: boolean) => ({
    width: "100%",
    background: "rgba(255, 255, 255, 0.06)",
    border: `1px solid ${focused ? "rgba(255,255,255,0.7)" : "rgba(255, 255, 255, 0.1)"}`,
    borderRadius: "12px",
    padding: "14px 16px",
    color: "white",
    fontSize: "14px",
    outline: "none",
  });

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(80px, -60px) scale(1.1); }
          66% { transform: translate(-40px, 40px) scale(0.95); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-70px, 50px) scale(0.9); }
          66% { transform: translate(60px, -30px) scale(1.05); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(50px, 60px) scale(1.1); }
        }
        @keyframes orb4 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40% { transform: translate(-60px, -50px) scale(0.95); }
          80% { transform: translate(30px, 20px) scale(1.05); }
        }
        input::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>

      <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: "#0d0018" }}>
        {/* Orb 1 - purple/violet */}
        <div style={{
          position: "absolute", width: "900px", height: "900px",
          borderRadius: "50%", filter: "blur(160px)", opacity: 0.55,
          background: "#7c3aed",
          top: "-200px", left: "-150px",
          animation: "orb1 28s ease-in-out infinite",
        }} />
        {/* Orb 2 - pink/rose */}
        <div style={{
          position: "absolute", width: "800px", height: "800px",
          borderRadius: "50%", filter: "blur(140px)", opacity: 0.45,
          background: "#f43f5e",
          bottom: "-150px", right: "-100px",
          animation: "orb2 35s ease-in-out infinite",
        }} />
        {/* Orb 3 - green/emerald */}
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          borderRadius: "50%", filter: "blur(130px)", opacity: 0.38,
          background: "#10b981",
          top: "30%", right: "10%",
          animation: "orb3 22s ease-in-out infinite",
        }} />
        {/* Orb 4 - amber/yellow */}
        <div style={{
          position: "absolute", width: "650px", height: "650px",
          borderRadius: "50%", filter: "blur(120px)", opacity: 0.35,
          background: "#f59e0b",
          bottom: "10%", left: "15%",
          animation: "orb4 30s ease-in-out infinite",
        }} />
        {/* Orb 5 - deep indigo, fills center */}
        <div style={{
          position: 'absolute', width: '800px', height: '800px',
          borderRadius: '50%', filter: 'blur(180px)', opacity: 0.4,
          background: '#4c1d95',
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          animation: 'orb2 40s ease-in-out infinite',
        }} />

        {/* Logo — top-left */}
        <div className="absolute top-8 left-8">
          <Image
            src="/superbar-logo.svg"
            width={80}
            height={27}
            alt="Superbar"
            priority
          />
        </div>

        {/* Center content */}
        <div style={{ position: "relative", zIndex: 10 }} className="flex flex-col items-center justify-center flex-1 px-4 pb-16">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Seja bem-vindo ao Superbar
          </h1>
          <p className="text-sm text-white/50 mb-8">
            The operating system for premium bars.
          </p>

          {/* Card */}
          <div style={{
            width: "100%", maxWidth: "420px",
            background: "rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(60px) saturate(180%)",
            WebkitBackdropFilter: "blur(60px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            padding: "40px",
          }}>
            <form action={signIn} className="flex flex-col gap-4">
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
                <p className="text-sm rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white">
                  {error}
                </p>
              )}
              <button
                type="submit"
                style={{
                  width: "100%",
                  background: btnHovered ? "#3a00a8" : "#260078",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  padding: "14px",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  transition: "background 0.2s",
                }}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
              >
                Entrar
              </button>
            </form>
          </div>
          <a href="#" style={{
            marginTop: '16px',
            color: 'rgba(255,255,255,0.45)',
            fontSize: '13px',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
          }}>Esqueceu a senha?</a>
        </div>
      </div>
    </>
  );
}
