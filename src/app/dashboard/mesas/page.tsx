import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { MesasClient } from "@/components/mesas/mesas-client";
import { createClient } from "@/lib/supabase/server";
import type { Mesa } from "@/types/database";

const dataLonga = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function MesasPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .order("ordem", { ascending: true, nullsFirst: false })
    .returns<Mesa[]>();

  const mesaList = mesas ?? [];

  // Mesas com comanda aberta (scoped to this bar's mesas)
  const mesaIds = mesaList.map(m => m.id);
  let mesasOcupadas: string[] = [];
  if (mesaIds.length > 0) {
    const { data: ocupadas } = await supabase
      .from("comandas")
      .select("mesa_id")
      .in("mesa_id", mesaIds)
      .eq("status", "aberta")
      .returns<{ mesa_id: string }[]>();
    mesasOcupadas = [
      ...new Set(
        (ocupadas ?? [])
          .map(c => c.mesa_id)
          .filter((id): id is string => id !== null && id !== undefined)
      ),
    ];
  }

  const nextNumero =
    mesaList.length > 0 ? Math.max(...mesaList.map(m => m.numero)) + 1 : 1;

  return (
    <div className="py-6 lg:px-10 lg:py-8">
      {/* Header — data + título + subtítulo (Figma) */}
      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 24px" }}>
        {capitalizar(dataLonga.format(new Date()))}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap", marginBottom: 12, paddingBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Mesas</h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Configure as posições do seu bar. O bartender vê exatamente essas opções.</p>
      </div>

      <MesasClient
        mesas={mesaList}
        barId={current.bar.id}
        mesasOcupadas={mesasOcupadas}
        nextNumero={nextNumero}
      />
    </div>
  );
}
