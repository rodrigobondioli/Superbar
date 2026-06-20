"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";

export async function criarMesa(formData: FormData) {
  const current = await getCurrentBar();
  if (!current) return;

  const numero = parseInt(String(formData.get("numero") ?? ""), 10);
  const nome   = String(formData.get("nome") ?? "").trim() || null;
  const capStr = String(formData.get("capacidade") ?? "").trim();
  const capacidade = capStr ? parseInt(capStr, 10) : null;

  if (isNaN(numero)) return;

  const supabase = await createClient();
  await supabase.from("mesas").insert({
    bar_id: current.bar.id,
    numero,
    nome,
    capacidade,
    ativo: true,
  });

  revalidatePath("/dashboard/mesas");
}

export async function editarMesa(id: string, formData: FormData) {
  const nome   = String(formData.get("nome") ?? "").trim() || null;
  const capStr = String(formData.get("capacidade") ?? "").trim();
  const capacidade = capStr ? parseInt(capStr, 10) : null;

  const supabase = await createClient();
  await supabase.from("mesas").update({ nome, capacidade }).eq("id", id);
  revalidatePath("/dashboard/mesas");
}

export async function removerMesa(id: string) {
  const supabase = await createClient();
  await supabase.from("mesas").update({ ativo: false }).eq("id", id);
  revalidatePath("/dashboard/mesas");
}
