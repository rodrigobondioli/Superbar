import Link from "next/link";
import { MenuApp } from "@/components/menu/menu-app";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";
import { getTopPedidos } from "@/lib/menu/queries";
import { getDestaques } from "@/lib/destaques/queries";
import type { Mesa, Categoria, Produto } from "@/types/database";

// Sempre dinâmica: a prévia depende da sessão do dono; nunca cachear.
export const dynamic = "force-dynamic";

/** Tela neutra quando não há sessão ou o cardápio está vazio.
 *  NUNCA mostra cardápio-demo se passando por real (princípio: dado-semente
 *  não pode parecer produção). */
function Aviso({ titulo, sub, cta, href }: { titulo: string; sub: string; cta: string; href: string }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--fg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, gap: 8 }}>
      <p style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>{titulo}</p>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 8px", maxWidth: 340, lineHeight: 1.5 }}>{sub}</p>
      <Link href={href} style={{ background: "var(--accent)", color: "var(--accent-fg)", fontSize: 15, fontWeight: 700, padding: "12px 24px", borderRadius: 999, textDecoration: "none" }}>{cta}</Link>
    </div>
  );
}

export default async function MenuPreviewPage() {
  // Prévia real: só existe se o dono está logado (sessão reconhecida no servidor).
  const current = await getCurrentBar();
  if (!current) {
    return <Aviso titulo="Entre para ver a prévia" sub="Esta é a prévia do cardápio do seu bar. Faça login na mesma conta para visualizar." cta="Fazer login" href="/login" />;
  }

  const supabase = await createClient();
  const [{ data: categorias }, { data: produtos }, { data: primeiraMesa }] = await Promise.all([
    supabase.from("categorias").select("*").eq("bar_id", current.bar.id).eq("ativo", true).order("ordem", { ascending: true }).returns<Categoria[]>(),
    supabase.from("produtos").select("*").eq("bar_id", current.bar.id).eq("ativo", true).returns<Produto[]>(),
    supabase.from("mesas").select("*").eq("bar_id", current.bar.id).eq("ativo", true).order("numero", { ascending: true }).limit(1).maybeSingle<Mesa>(),
  ]);

  const cardapio = (categorias ?? [])
    .map((c) => ({ ...c, produtos: (produtos ?? []).filter((p) => p.categoria_id === c.id) }))
    .filter((c) => c.produtos.length > 0);

  if (cardapio.length === 0) {
    return <Aviso titulo="Cardápio ainda vazio" sub="Cadastre categorias e produtos para ver a prévia do que o cliente enxerga." cta="Montar cardápio" href="/dashboard/cardapio" />;
  }

  const [topPedidos, destaques] = await Promise.all([getTopPedidos(current.bar.id), getDestaques(current.bar.id)]);
  const mesa: Mesa = primeiraMesa ?? { id: "preview", bar_id: current.bar.id, numero: 0, nome: "Prévia", capacidade: 4, ativo: true, ordem: null, created_at: "" };
  return <MenuApp bar={current.bar} mesa={mesa} cardapio={cardapio} topPedidos={topPedidos} destaques={destaques} />;
}
