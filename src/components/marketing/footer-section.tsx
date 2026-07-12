"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   FOOTER — grade com células de borda tracejada (referência: buckssauce.com).
   [logo] [navegação] [newsletter] [sociais empilhados] + barra de copyright.
   Newsletter sem backend ainda: abre o e-mail do visitante com pedido de
   assinatura pré-preenchido (sem prometer sistema que não existe).
   ──────────────────────────────────────────────────────────────────────── */

const DASH = "1px dashed rgba(255,255,255,0.25)";
const ACCENT = "#FF3500";

const LINKS = [
  { label: "Produto", href: "#produto" },
  { label: "Processo", href: "#processo" },
  { label: "Na tela", href: "#tela" },
  { label: "Perguntas", href: "#faq" },
  { label: "Contato", href: "#contato" },
];

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/usesuperbar",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/falabondioli",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export function FooterSection() {
  const [email, setEmail] = useState("");

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const body = encodeURIComponent(
      `Quero receber as novidades do SUPERBAR neste e-mail: ${email}`,
    );
    window.location.href = `mailto:oi@superbar.com.br?subject=${encodeURIComponent("Assinar newsletter")}&body=${body}`;
  }

  return (
    <footer id="contato-footer" style={{ background: "#111113" }}>
      <style>{`
        .sb-foot-link { transition: color 0.25s ease, padding-left 0.25s ease; }
        .sb-foot-link:hover { color: ${ACCENT} !important; padding-left: 6px; }
        .sb-social-cell { transition: background 0.3s ease, color 0.3s ease; }
        .sb-social-cell:hover { background: ${ACCENT}; color: #000 !important; }
        .sb-news-btn { transition: background 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .sb-news-btn:hover { background: ${ACCENT}; transform: scale(1.06); }
        @media (prefers-reduced-motion: reduce) {
          .sb-foot-link, .sb-social-cell, .sb-news-btn { transition: none !important; }
        }
      `}</style>

      <div className="page-x pb-6 pt-16 md:pt-24">
        <div className="mx-auto max-w-[1440px]">
          {/* Grade principal */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr_1.3fr_200px]">
            {/* Logo */}
            <div
              className="flex items-center justify-center p-10"
              style={{ border: DASH, borderRadius: 16 }}
            >
              <Image
                src="/img-lp/logo-superbar.svg"
                alt="Superbar"
                width={140}
                height={140}
              />
            </div>

            {/* Navegação */}
            <nav className="flex flex-col justify-center px-8 py-4" style={{ border: DASH, borderRadius: 16 }}>
              {LINKS.map((l, i) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="sb-foot-link py-3"
                  style={{
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                    fontSize: "clamp(1.1rem, 1.6vw, 1.4rem)",
                    letterSpacing: "0.02em",
                    color: "#ffffff",
                    textDecoration: "none",
                    borderBottom: i < LINKS.length - 1 ? DASH : "none",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Newsletter */}
            <div className="flex flex-col justify-center gap-4 p-8 md:p-10" style={{ border: DASH, borderRadius: 16 }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)",
                  letterSpacing: "0.01em",
                  lineHeight: 0.85,
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                Inteligência no seu{" "}
                <span style={{ color: ACCENT }}>e-mail</span>
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14.5,
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Novidades do produto e ideias pra fazer seu bar lucrar mais.
                Sem spam.
              </p>
              <form onSubmit={subscribe} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail..."
                  aria-label="Seu e-mail"
                  className="min-w-0 flex-1"
                  style={{
                    background: "transparent",
                    border: DASH,
                    borderRadius: 999,
                    padding: "14px 22px",
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    color: "#ffffff",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  aria-label="Assinar newsletter"
                  className="sb-news-btn flex items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    border: DASH,
                    background: "transparent",
                    color: "#ffffff",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Sociais empilhados */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="sb-social-cell flex items-center justify-center py-8 md:py-0"
                  style={{
                    border: DASH,
                    borderRadius: 16,
                    color: "#ffffff",
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Barra de copyright */}
          <div className="mt-8 flex flex-col items-center gap-2 md:flex-row md:justify-between">
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              © 2026. Superbar. Todos os direitos reservados.
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Seu bar ficou super inteligente.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
