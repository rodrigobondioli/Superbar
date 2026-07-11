"use client";

import { useEffect, useState } from "react";

/**
 * Banner de conexão para as telas operacionais.
 *
 * Torna VISÍVEL a queda de rede — hoje a falha é silenciosa (o garçom toca e não
 * sabe se foi). Usa navigator.onLine + eventos online/offline: cobre bem o caso
 * "o iPad perdeu o Wi-Fi". NÃO detecta "Wi-Fi de pé mas Supabase inacessível"
 * (isso exigiria ping ativo; a mitigação real desse caso é rede redundante).
 */
export function ConexaoBanner() {
  // Começa "online" para não piscar o banner no primeiro paint (SSR/hidratação);
  // o estado real é lido no efeito, já no cliente.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const ficouOnline = () => setOnline(true);
    const ficouOffline = () => setOnline(false);
    window.addEventListener("online", ficouOnline);
    window.addEventListener("offline", ficouOffline);
    return () => {
      window.removeEventListener("online", ficouOnline);
      window.removeEventListener("offline", ficouOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "var(--danger)",
        color: "#fff",
        padding: "10px 16px",
        textAlign: "center",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.01em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
      Sem conexão. Aguarde reconectar — não feche comandas nem lance pedidos agora.
    </div>
  );
}
