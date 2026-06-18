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

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={H1}>Mesas</h1>
        <p style={SUBTITLE}>Configure as posições do seu bar. O bartender vê exatamente essas opções.</p>
      </div>

      <MesasClient mesas={mesas ?? []} barId={current.bar.id} />
    </div>
  );
}
