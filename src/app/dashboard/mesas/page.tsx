import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { MesasClient } from "@/components/mesas/mesas-client";
import { createClient } from "@/lib/supabase/server";
import { LABEL, H1, SUBTITLE } from "@/lib/ui";
import type { Mesa } from "@/types/database";

export default async function MesasPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .order("numero", { ascending: true })
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
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={H1}>Mesas</h1>
        <p style={SUBTITLE}>Configure as posições do seu bar. O bartender vê exatamente essas opções.</p>
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
