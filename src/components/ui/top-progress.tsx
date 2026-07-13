"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Barra de progresso fina no topo — feedback de navegação SEM skeleton de página
// cheia. Como as telas do dono são dinâmicas (auth), o Next mantém a tela atual
// visível durante a troca; esta barra é o sinal de "carregando".
//
// Dispara no início de qualquer navegação client-side: tanto <Link> quanto
// router.push/replace passam pela History API, então patchamos pushState/
// replaceState (+ popstate p/ voltar/avançar). Completa quando o pathname muda.
// Sem dependência externa. Só usePathname (não força dynamic como useSearchParams).
// ─────────────────────────────────────────────────────────────────────────────
export function TopProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    function stopTrickle() {
      if (trickle.current) { clearInterval(trickle.current); trickle.current = null; }
    }
    function start() {
      if (trickle.current) return; // já em andamento
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setVisible(true);
      setProgress(8);
      trickle.current = setInterval(() => {
        setProgress(p => {
          if (p >= 90) return p; // segura perto do fim até a rota completar
          const inc = p < 40 ? 9 : p < 70 ? 4 : 1.5;
          return Math.min(90, p + inc);
        });
      }, 220);
      // Rede de segurança: se a rota não completar (ex: replaceState sem troca real), some sozinha.
      if (safety.current) clearTimeout(safety.current);
      safety.current = setTimeout(() => { stopTrickle(); setVisible(false); setProgress(0); }, 12000);
    }

    const path = (url: string | URL | null | undefined): string | null => {
      if (url == null) return null;
      try { return new URL(url, location.href).pathname; } catch { return null; }
    };

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      const p = path(args[2]);
      if (p && p !== location.pathname) start();
      return origPush.apply(this, args);
    };
    history.replaceState = function (this: History, ...args: Parameters<History["replaceState"]>) {
      const p = path(args[2]);
      if (p && p !== location.pathname) start();
      return origReplace.apply(this, args);
    };
    window.addEventListener("popstate", start);

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", start);
      stopTrickle();
    };
  }, []);

  // Completa quando o pathname muda (nova rota já renderizou).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (trickle.current) { clearInterval(trickle.current); trickle.current = null; }
    if (safety.current) clearTimeout(safety.current);
    setProgress(100);
    hideTimer.current = setTimeout(() => { setVisible(false); setProgress(0); }, 260);
  }, [pathname]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 9999,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 220ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--accent)",
          boxShadow: "0 0 8px var(--accent), 0 0 3px var(--accent)",
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}
