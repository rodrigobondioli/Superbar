import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getMembrosEquipe } from "@/lib/equipe/queries";
import { EquipeMembros } from "@/components/equipe/equipe-membros";
import { ConvidarForm } from "@/components/equipe/convidar-form";

export default async function EquipePage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const membros = await getMembrosEquipe(current.bar.id);
  const ativos   = membros.filter(m => m.ativo);
  const inativos = membros.filter(m => !m.ativo);

  const isDono = current.role === "dono";

  return (
    <div className="py-6 lg:py-8">

      {/* ── Header — padrão Figma ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Equipe</h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          {ativos.length} {ativos.length === 1 ? "membro ativo" : "membros ativos"}
        </p>
      </div>

      {/* ── Lista única (Figma) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {isDono && <ConvidarForm />}
        <EquipeMembros
          ativos={ativos}
          inativos={inativos}
          isDono={isDono}
          currentUserId={current.userId}
        />
      </div>
    </div>
  );
}
