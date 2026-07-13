import Link from "next/link";

// 404 próprio — em vez do genérico do Next.
export default function NotFound() {
  return (
    <div style={{
      minHeight: "80vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      padding: 24, textAlign: "center",
      background: "var(--bg)", color: "var(--fg)", fontFamily: "var(--font-sans)",
    }}>
      <p style={{ fontSize: 40, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>404</p>
      <p style={{ fontSize: 15, color: "var(--fg-muted)", maxWidth: 380, margin: 0, lineHeight: 1.5 }}>
        Esta página não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        style={{
          marginTop: 8, background: "var(--accent)", color: "var(--accent-fg)",
          textDecoration: "none", borderRadius: "var(--r-pill)", padding: "10px 24px",
          fontSize: 14, fontWeight: 600,
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}
