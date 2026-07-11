import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Martini, Receipt, Users } from "lucide-react";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { podeVerAdminDashboard, homePath } from "@/lib/auth/roles";

const estacoes = [
  { href: "/bartender", label: "Bartender", desc: "Produção dos pedidos", icon: Martini },
  { href: "/caixa",     label: "Caixa",     desc: "Fechar comanda e pagamento", icon: Receipt },
  { href: "/garcom",    label: "Garçom",    desc: "Anotar pedido nas mesas", icon: Users },
];

/** Seletor de estação operacional — o dono/bar manager abre qualquer tela no iPad. */
export default async function OperacaoPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");
  if (!podeVerAdminDashboard(current.role)) redirect(homePath(current.role));

  return (
    <div data-theme="dark" style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-muted)", fontSize: 14, textDecoration: "none", marginBottom: 28 }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Dashboard
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", margin: "0 0 6px" }}>Abrir operação</h1>
        <p style={{ fontSize: 14, color: "var(--fg-subtle)", margin: "0 0 28px", lineHeight: 1.5 }}>
          Escolha a estação. Na tela, a pessoa se identifica pelo nome e PIN.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {estacoes.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", flexDirection: "column", gap: 14,
                background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16,
                padding: "28px 24px", textDecoration: "none", minHeight: 168,
              }}
            >
              <span style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "color-mix(in srgb, var(--accent) 16%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ width: 26, height: 26, color: "var(--accent)" }} strokeWidth={1.75} />
              </span>
              <span style={{ marginTop: "auto" }}>
                <span style={{ display: "block", fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>{label}</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--fg-subtle)", marginTop: 2 }}>{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
