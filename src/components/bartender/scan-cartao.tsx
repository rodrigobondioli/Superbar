"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarComandaPorCartao, abrirComanda } from "@/lib/bartender/actions";

// ─── Ícones inline ────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

// ─── Componente principal ─────────────────────────────────────────────────────

export function ScanCartao() {
  const router = useRouter();
  const [input, setInput]           = useState("");
  const [scanning, setScanning]     = useState(false);
  const [hasScanner, setHasScanner] = useState(false);
  const [resultado, setResultado]   = useState<"nao_encontrado" | null>(null);
  const [cardId, setCardId]         = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [isPending, startTransition] = useTransition();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);

  // Detecta suporte a BarcodeDetector só no cliente
  useEffect(() => {
    setHasScanner("BarcodeDetector" in window);
  }, []);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Lógica de busca ───────────────────────────────────────────────────────

  const buscar = (valor: string) => {
    const v = valor.trim();
    if (!v || isPending) return;
    setResultado(null);
    startTransition(async () => {
      const id = await buscarComandaPorCartao(v);
      if (id) {
        router.push(`/bartender/${id}`);
      } else {
        setCardId(v);
        setResultado("nao_encontrado");
      }
    });
  };

  const abrirNovaComanda = () => {
    if (!cardId || isPending) return;
    startTransition(async () => {
      await abrirComanda(null, undefined, cardId, nomeCliente || undefined);
    });
  };

  // ── Câmera / QR scan ──────────────────────────────────────────────────────

  const iniciarScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      // Permissão negada ou câmera indisponível — silently fall back to input
    }
  };

  // Inicia o loop de detecção quando o vídeo monta
  useEffect(() => {
    if (!scanning || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

    const loop = async () => {
      // Aguarda o vídeo ter frames
      if (!video.readyState || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      try {
        const codes: Array<{ rawValue: string }> = await detector.detect(video);
        if (codes.length > 0) {
          pararScan();
          buscar(codes[0].rawValue);
          return;
        }
      } catch {
        // ignora erros de frame
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const pararScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Barra de busca */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: resultado ? 10 : 0 }}>

        {/* Input */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.11)",
          borderRadius: 8, padding: "0 14px", height: 48,
        }}>
          <span style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0, display: "flex" }}>
            <IconSearch />
          </span>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setResultado(null); }}
            onKeyDown={e => e.key === "Enter" && buscar(input)}
            placeholder="Nº do cartão"
            inputMode="numeric"
            autoComplete="off"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--fg)", fontSize: 17, fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
            } as React.CSSProperties}
          />
          {input && (
            <button
              onClick={() => { setInput(""); setResultado(null); }}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                color: "rgba(255,255,255,0.3)", display: "flex", WebkitTapHighlightColor: "transparent",
              }}
            >
              <IconX />
            </button>
          )}
        </div>

        {/* Botão câmera (só mostra se BarcodeDetector disponível) */}
        {hasScanner && (
          <button
            onClick={iniciarScan}
            style={{
              width: 48, height: 48, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.11)",
              borderRadius: 8, cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <IconCamera />
          </button>
        )}

        {/* Botão buscar */}
        <button
          onClick={() => buscar(input)}
          disabled={!input.trim() || isPending}
          style={{
            height: 48, padding: "0 20px", flexShrink: 0,
            background: input.trim() ? "var(--accent)" : "rgba(255,255,255,0.04)",
            border: "1px solid " + (input.trim() ? "transparent" : "rgba(255,255,255,0.08)"),
            borderRadius: 8,
            cursor: input.trim() && !isPending ? "pointer" : "not-allowed",
            color: input.trim() ? "var(--accent-fg)" : "rgba(255,255,255,0.2)",
            fontSize: 14, fontWeight: 700,
            transition: "background 150ms, color 150ms",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {isPending ? "..." : "Buscar"}
        </button>
      </div>

      {/* Banner: não encontrado — pede nome e abre */}
      {resultado === "nao_encontrado" && cardId && (
        <div style={{
          padding: "14px 16px", marginBottom: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 8, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
              Cartão{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>#{cardId}</span>
              {" "}sem comanda neste turno
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "2px 0 0" }}>
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
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 8, padding: "11px 14px",
              color: "var(--fg)", fontSize: 15, outline: "none", width: "100%",
              boxSizing: "border-box",
            } as React.CSSProperties}
          />
          <button
            onClick={abrirNovaComanda}
            disabled={isPending}
            style={{
              width: "100%", padding: "13px",
              background: "var(--accent)", border: "none", borderRadius: 8,
              color: "var(--accent-fg)", fontSize: 14, fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isPending ? "Abrindo..." : "Abrir comanda"}
          </button>
        </div>
      )}

      {/* Overlay da câmera */}
      {scanning && (
        <div style={{
          position: "fixed", inset: 0, background: "#000", zIndex: 100,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          {/* Vídeo ao vivo */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Frame de scan + instrução */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{
              width: 220, height: 220, margin: "0 auto",
              border: "2.5px solid rgba(255,255,255,0.9)",
              borderRadius: 8,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.50)",
            }} />
            <p style={{
              color: "rgba(255,255,255,0.85)", marginTop: 24,
              fontSize: 14, fontWeight: 600, letterSpacing: "0.01em",
            }}>
              Aponte para o QR code do cartão
            </p>
          </div>

          {/* Fechar */}
          <button
            onClick={pararScan}
            style={{
              position: "absolute", top: 20, right: 20, zIndex: 2,
              width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%", cursor: "pointer", color: "white",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <IconX />
          </button>
        </div>
      )}
    </>
  );
}
