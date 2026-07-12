"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { submitLead } from "@/lib/leads/actions";

// ── Context ───────────────────────────────────────────────────────────────────

interface ModalCtx { open: () => void }
const Ctx = createContext<ModalCtx | null>(null);

export function useComandaModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useComandaModal: missing ComandaModalProvider");
  return ctx;
}

export function ComandaModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <ComandaModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </Ctx.Provider>
  );
}

// ── SVG zigzag (64 teeth × 10px = 640px viewBox) ────────────────────────────

const ZIGZAG_TOP =
  "M 0,12 L 10,0 L 20,12 L 30,0 L 40,12 L 50,0 L 60,12 L 70,0 L 80,12 L 90,0 L 100,12 L 110,0 L 120,12 L 130,0 L 140,12 L 150,0 L 160,12 L 170,0 L 180,12 L 190,0 L 200,12 L 210,0 L 220,12 L 230,0 L 240,12 L 250,0 L 260,12 L 270,0 L 280,12 L 290,0 L 300,12 L 310,0 L 320,12 L 330,0 L 340,12 L 350,0 L 360,12 L 370,0 L 380,12 L 390,0 L 400,12 L 410,0 L 420,12 L 430,0 L 440,12 L 450,0 L 460,12 L 470,0 L 480,12 L 490,0 L 500,12 L 510,0 L 520,12 L 530,0 L 540,12 L 550,0 L 560,12 L 570,0 L 580,12 L 590,0 L 600,12 L 610,0 L 620,12 L 630,0 L 640,12 Z";

const ZIGZAG_BOT =
  "M 0,0 L 640,0 L 630,12 L 620,0 L 610,12 L 600,0 L 590,12 L 580,0 L 570,12 L 560,0 L 550,12 L 540,0 L 530,12 L 520,0 L 510,12 L 500,0 L 490,12 L 480,0 L 470,12 L 460,0 L 450,12 L 440,0 L 430,12 L 420,0 L 410,12 L 400,0 L 390,12 L 380,0 L 370,12 L 360,0 L 350,12 L 340,0 L 330,12 L 320,0 L 310,12 L 300,0 L 290,12 L 280,0 L 270,12 L 260,0 L 250,12 L 240,0 L 230,12 L 220,0 L 210,12 L 200,0 L 190,12 L 180,0 L 170,12 L 160,0 L 150,12 L 140,0 L 130,12 L 120,0 L 110,12 L 100,0 L 90,12 L 80,0 L 70,12 L 60,0 L 50,12 L 40,0 L 30,12 L 20,0 L 10,12 L 0,0 Z";

// ── Color tokens ──────────────────────────────────────────────────────────────

const MODAL_BG   = "#FF3500";
const TEXT_MAIN  = "#000000";
const TEXT_SEC   = "#000000";
const INPUT_BG   = "#FFFFFF";

// ── Utilities ─────────────────────────────────────────────────────────────────

function maskWhatsApp(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ── Modal ─────────────────────────────────────────────────────────────────────

function ComandaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nome_bar: "", cidade: "São Paulo", tipo_bar: "Coquetelaria",
    whatsapp: "", instagram: "", website: "",
  });
  const modalRef = useRef<HTMLDivElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleWhatsApp(e: React.ChangeEvent<HTMLInputElement>) {
    e.currentTarget.setCustomValidity("");
    setForm(f => ({ ...f, whatsapp: maskWhatsApp(e.target.value) }));
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSuccess(false);
      setForm({ nome_bar: "", cidade: "São Paulo", tipo_bar: "Coquetelaria", whatsapp: "", instagram: "", website: "" });
    }, 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitLead(form);
      if ("error" in result) alert(result.error);
      else setSuccess(true);
    });
  }

  // ESC + focus trap
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const els = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    // Move focus in on open
    setTimeout(() => modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0]?.focus(), 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-roboto-mono)",
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: TEXT_SEC,
    display: "block",
    marginBottom: "4px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: INPUT_BG,
    border: "none",
    borderRadius: "8px",
    color: TEXT_MAIN,
    fontFamily: "var(--font-roboto-mono)",
    fontSize: "0.9375rem",
    padding: "10px 12px",
    minHeight: "44px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scoped placeholder + focus styles */}
          <style>{`
            .sb-field::placeholder { color: #555555; opacity: 1; }
            .sb-field:focus { outline: 2px solid ${TEXT_MAIN}; outline-offset: 0; border-color: transparent; }
            .sb-submit:active { transform: scale(0.98); }
            .sb-submit:hover:not(:disabled) { opacity: 0.88; }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 40 }}
          />

          {/* Centering wrapper */}
          <div style={{
            position: "fixed", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, pointerEvents: "none",
            padding: "16px",
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="comanda-title"
              ref={modalRef}
              style={{
                width: "100%", maxWidth: 520,
                pointerEvents: "auto", position: "relative",
              }}
            >
              {/* Top zigzag */}
              <div style={{ position: "absolute", top: -12, left: 0, right: 0, lineHeight: 0, pointerEvents: "none" }}>
                <svg viewBox="0 0 640 12" preserveAspectRatio="none" style={{ width: "100%", height: 12, display: "block" }}>
                  <path d={ZIGZAG_TOP} fill={MODAL_BG} />
                </svg>
              </div>

              {/* Card */}
              <div style={{ background: MODAL_BG, maxHeight: "85dvh", overflowY: "auto", display: "flex", flexDirection: "column" }}>

                {/* ── Header (só no form) ── */}
                {!success && (
                  <div style={{
                    padding: "20px 20px 24px",
                    borderBottom: `1px solid rgba(0,0,0,0.14)`,
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px",
                  }}>
                    <div>
                      <h2
                        id="comanda-title"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontWeight: 700,
                          fontSize: "1.375rem",
                          color: TEXT_MAIN,
                          lineHeight: 1.15,
                          letterSpacing: "-0.01em",
                          margin: "0 0 10px",
                        }}
                      >
                        Seu bar ficou super inteligente.
                      </h2>
                      <p style={{
                        fontFamily: "var(--font-roboto-mono)",
                        fontSize: "0.75rem",
                        color: TEXT_SEC,
                        margin: 0, lineHeight: 1.5,
                      }}>
                        Preencha o form. A gente entra em contato pra começar.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      aria-label="Fechar"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: TEXT_MAIN,
                        width: 44, height: 44, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "8px",
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {/* ── Body ── */}
                {success ? (
                  <div style={{ padding: "48px 28px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative" }}>
                    {/* X no canto */}
                    <button
                      onClick={handleClose}
                      aria-label="Fechar"
                      style={{
                        position: "absolute", top: 16, right: 16,
                        background: "none", border: "none", cursor: "pointer",
                        color: TEXT_MAIN, width: 44, height: 44,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "8px",
                      }}
                    >
                      <X size={18} />
                    </button>

                    {/* Check */}
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      border: `2px solid ${TEXT_MAIN}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 28, flexShrink: 0,
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEXT_MAIN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>

                    <p style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      color: TEXT_MAIN,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      margin: "0 0 12px",
                      textAlign: "center",
                    }}>
                      Recebemos.
                    </p>
                    <p style={{
                      fontFamily: "var(--font-roboto-mono)",
                      fontSize: "1rem",
                      color: TEXT_SEC,
                      lineHeight: 1.6,
                      margin: 0,
                      textAlign: "center",
                      maxWidth: 340,
                    }}>
                      A gente entra em contato pelo WhatsApp em até 24 horas.
                    </p>
                  </div>
                ) : (
                  <form
                    id="comanda-form"
                    onSubmit={handleSubmit}
                    style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}
                  >
                    {/* Honeypot anti-bot — escondido do humano, preenchido por bots */}
                    <input
                      type="text" name="website" tabIndex={-1} autoComplete="off"
                      value={form.website} onChange={handleChange}
                      aria-hidden="true"
                      style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                    />
                    {/* ESTABELECIMENTO */}
                    <div>
                      <label htmlFor="nome_bar" style={labelStyle}>Estabelecimento</label>
                      <input
                        id="nome_bar" name="nome_bar" type="text"
                        value={form.nome_bar}
                        onChange={(e) => { e.currentTarget.setCustomValidity(""); handleChange(e); }}
                        onInvalid={(e) => e.currentTarget.setCustomValidity("Preencha este campo.")}
                        placeholder="Nome do seu bar"
                        required
                        className="sb-field"
                        style={inputStyle}
                      />
                    </div>

                    {/* CIDADE */}
                    <div style={{ position: "relative" }}>
                      <label htmlFor="cidade" style={labelStyle}>Cidade</label>
                      <select
                        id="cidade" name="cidade"
                        value={form.cidade} onChange={handleChange}
                        className="sb-field"
                        style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "32px" }}
                      >
                        <option value="São Paulo">São Paulo</option>
                        <option value="Rio de Janeiro">Rio de Janeiro</option>
                        <option value="Outra">Outra</option>
                      </select>
                      <span style={{ position: "absolute", right: 12, bottom: 12, color: TEXT_SEC, fontSize: "0.75rem", pointerEvents: "none" }}>▾</span>
                    </div>

                    {/* TIPO DO BAR */}
                    <div style={{ position: "relative" }}>
                      <label htmlFor="tipo_bar" style={labelStyle}>Tipo do Bar</label>
                      <select
                        id="tipo_bar" name="tipo_bar"
                        value={form.tipo_bar} onChange={handleChange}
                        className="sb-field"
                        style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "32px" }}
                      >
                        <option value="Coquetelaria">Coquetelaria</option>
                        <option value="Wine Bar">Wine Bar</option>
                        <option value="Speakeasy">Speakeasy</option>
                        <option value="Gastrobar">Gastrobar</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <span style={{ position: "absolute", right: 12, bottom: 12, color: TEXT_SEC, fontSize: "0.75rem", pointerEvents: "none" }}>▾</span>
                    </div>

                    {/* WHATSAPP */}
                    <div>
                      <label htmlFor="whatsapp" style={labelStyle}>WhatsApp</label>
                      <input
                        id="whatsapp" name="whatsapp" type="tel"
                        value={form.whatsapp}
                        onChange={handleWhatsApp}
                        onInvalid={(e) => e.currentTarget.setCustomValidity("Preencha este campo.")}
                        placeholder="(11) 99999-9999"
                        required
                        className="sb-field"
                        style={inputStyle}
                      />
                    </div>

                    {/* INSTAGRAM (opcional) */}
                    <div>
                      <label htmlFor="instagram" style={labelStyle}>
                        Instagram{" "}
                        <span style={{ fontWeight: 400, opacity: 0.65, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
                      </label>
                      <input
                        id="instagram" name="instagram" type="text"
                        value={form.instagram}
                        onChange={handleChange}
                        placeholder="@seubar"
                        className="sb-field"
                        style={inputStyle}
                      />
                    </div>

                    {/* SUBMIT */}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="sb-submit"
                      style={{
                        width: "100%",
                        background: isPending ? "#444" : "#0B0B0B",
                        color: "#FFFFFF",
                        fontFamily: "var(--font-roboto-mono)",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        padding: "14px 32px",
                        minHeight: "44px",
                        border: "none",
                        borderRadius: "9999px",
                        cursor: isPending ? "wait" : "pointer",
                        transition: "opacity 0.15s, transform 0.1s",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      {isPending ? "Enviando..." : "Quero meu Superbar"}
                      {!isPending && <ArrowRight size={16} />}
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom zigzag */}
              <div style={{ position: "absolute", bottom: -12, left: 0, right: 0, lineHeight: 0, pointerEvents: "none" }}>
                <svg viewBox="0 0 640 12" preserveAspectRatio="none" style={{ width: "100%", height: 12, display: "block" }}>
                  <path d={ZIGZAG_BOT} fill={MODAL_BG} />
                </svg>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
