"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarComandaAtiva, abrirComanda } from "@/lib/bartender/actions";
import type { ResultadoBusca } from "@/lib/bartender/actions";

// ─── Ícones inline ────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

// ─── Componente principal ─────────────────────────────────────────────────────

export function ScanCartao() {
  const router = useRouter();
  const [input, setInput]               = useState("");
  const [scanning, setScanning]         = useState(false);
  const [hasScanner, setHasScanner]     = useState(false);
  const [resultados, setResultados]     = useState<ResultadoBusca[]>([]);
  const [semResultado, setSemResultado] = useState(false);
  const [cardId, setCardId]             = useState<string | null>(null);
  const [nomeCliente, setNomeCliente]   = useState("");
  const [isPending, startTransition]    = useTransition();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);

  useEffect(() => { setHasScanner("BarcodeDetector" in window); }, []);
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  function limpar() {
    setInput(""); setResultados([]); setSemResultado(false); setCardId(""); setNomeCliente("");
  }

  const buscar = (valor: string) => {
    const v = valor.trim();
    if (!v || isPending) return;
    setResultados([]); setSemResultado(false);
    startTransition(async () => {
      const res = await buscarComandaAtiva(v);
      if (res.length === 1) {
        router.push(`/garcom/${res[0].id}`);
      } else if (res.length > 1) {
        setResultados(res);
      } else {
        setCardId(v);
        setSemResultado(true);
      }
    });
  };

  const abrirNovaComanda = () => {
    if (!cardId || isPending) return;
    startTransition(async () => {
      const result = await abrirComanda(null, undefined, cardId, nomeCliente || undefined);
      if (result && "id" in result) {
        window.location.href = `/garcom/${result.id}`;
      }
    });
  };

  // ── Câmera / QR scan ─────────────────────────────────────────────────────
  const iniciarScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
    } catch { /* permissão negada */ }
  };

  useEffect(() => {
    if (!scanning || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
    const loop = async () => {
      if (!video.readyState || video.readyState < 2) { rafRef.current = requestAnimationFrame(loop); return; }
      try {
        const codes: Array<{ rawValue: string }> = await detector.detect(video);
        if (codes.length > 0) { pararScan(); buscar(codes[0].rawValue); return; }
      } catch { /* ignora */ }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const pararScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const inputAtivo = !!input.trim();

  return (
    <>
      {/* Barra de busca */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8, padding: "0 14px", height: 44,
        }}>
          <span style={{ color: "var(--fg-subtle)", flexShrink: 0, display: "flex" }}>
            {isPending
              ? <span style={{ width: 14, height: 14, border: "2px solid var(--border-strong)", borderTopColor: "var(--fg-subtle)", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
              : <IconSearch />
            }
          </span>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setResultados([]); setSemResultado(false); }}
            onKeyDown={e => e.key === "Enter" && buscar(input)}
            placeholder="Buscar por cartão, nome ou mesa..."
            autoComplete="off"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--fg)", fontSize: 14,
            } as React.CSSProperties}
          />
          {input && (
            <button onClick={limpar} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--fg-subtle)", display: "flex", WebkitTapHighlightColor: "transparent" }}>
              <IconX />
            </button>
          )}
        </div>

        {hasScanner && (
          <button onClick={iniciarScan} title="Escanear QR code" style={{
            width: 44, height: 44, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 8, cursor: "pointer", color: "var(--fg-subtle)",
            WebkitTapHighlightColor: "transparent",
          }}>
            <IconCamera />
          </button>
        )}

        <button
          onClick={() => buscar(input)}
          disabled={!inputAtivo || isPending}
          style={{
            height: 44, padding: "0 18px", flexShrink: 0,
            background: inputAtivo ? "var(--accent)" : "var(--bg-elevated)",
            border: "1px solid " + (inputAtivo ? "transparent" : "var(--border)"),
            borderRadius: 8,
            cursor: inputAtivo && !isPending ? "pointer" : "not-allowed",
            color: inputAtivo ? "var(--accent-fg)" : "var(--fg-subtle)",
            fontSize: 13, fontWeight: 700,
            transition: "background 150ms, color 150ms",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Buscar
        </button>
      </div>

      {/* Múltiplos resultados */}
      {resultados.length > 1 && (
        <div style={{
          marginTop: 8,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8, overflow: "hidden",
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: "var(--fg-subtle)",
            padding: "10px 14px 8px", margin: 0,
            textTransform: "uppercase", letterSpacing: "0.08em",
            borderBottom: "1px solid var(--border)",
          }}>
            {resultados.length} comandas encontradas
          </p>
          {resultados.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/garcom/${r.id}`)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                width: "100%", textAlign: "left",
                padding: "12px 14px",
                background: "transparent", border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer", color: "var(--fg)", fontSize: 14, fontWeight: 500,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span>{r.label}</span>
              <span style={{ color: "var(--fg-subtle)", fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* Nenhum resultado */}
      {semResultado && cardId && (
        <div style={{
          marginTop: 8, padding: "16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
              Nenhuma comanda ativa para{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}>{cardId}</span>
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "4px 0 0" }}>
              Abrir nova comanda para este cartão?
            </p>
          </div>
          <input
            value={nomeCliente}
            onChange={e => setNomeCliente(e.target.value)}
            onKeyDown={e => e.key === "Enter" && abrirNovaComanda()}
            placeholder="Nome da pessoa (opcional)"
            autoFocus
            style={{
              background: "var(--bg-hover)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "11px 14px",
              color: "var(--fg)", fontSize: 14, outline: "none", width: "100%",
              boxSizing: "border-box",
            } as React.CSSProperties}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={limpar} style={{
              flex: 1, padding: "12px",
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--fg-subtle)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}>
              Cancelar
            </button>
            <button onClick={abrirNovaComanda} disabled={isPending} style={{
              flex: 2, padding: "12px",
              background: "var(--accent)", border: "none", borderRadius: 8,
              color: "var(--accent-fg)", fontSize: 13, fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              WebkitTapHighlightColor: "transparent",
            }}>
              {isPending ? "Abrindo..." : "Abrir comanda"}
            </button>
          </div>
        </div>
      )}

      {/* Overlay câmera */}
      {scanning && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ width: 220, height: 220, margin: "0 auto", border: "2.5px solid rgba(255,255,255,0.9)", borderRadius: 8, boxShadow: "0 0 0 9999px rgba(0,0,0,0.50)" }} />
            <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 24, fontSize: 14, fontWeight: 600 }}>Aponte para o QR code</p>
          </div>
          <button onClick={pararScan} style={{ position: "absolute", top: 20, right: 20, zIndex: 2, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", cursor: "pointer", color: "white", WebkitTapHighlightColor: "transparent" }}>
            <IconX />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
