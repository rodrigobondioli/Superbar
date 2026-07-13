import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { MesasClient } from "@/components/mesas/mesas-client";
import { createClient } from "@/lib/supabase/server";

export default async function MesasPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .order("ordem", { ascending: true, nullsFirst: false });

  const mesaList = mesas ?? [];

  // Mesas com comanda aberta (scoped to this bar's mesas)
  const mesaIds = mesaList.map(m => m.id);
  let mesasOcupadas: string[] = [];
  if (mesaIds.length > 0) {
    const { data: ocupadas } = await supabase
      .from("comandas")
      .select("mesa_id")
      .in("mesa_id", mesaIds)
      .eq("status", "aberta");
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
    <div className="py-6 lg:py-8 flex flex-col min-h-full">
      <MesasClient
        mesas={mesaList}
        barId={current.bar.id}
        mesasOcupadas={mesasOcupadas}
        nextNumero={nextNumero}
      />
    </div>
  );
}
