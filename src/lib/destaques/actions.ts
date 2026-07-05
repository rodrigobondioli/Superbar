"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";

export async function criarDestaque(formData: FormData) {
  const current = await getCurrentBar();
  if (!current) return;

  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;
  const subtitulo = String(formData.get("subtitulo") ?? "").trim() || null;
  const imagemUrl = String(formData.get("imagem_url") ?? "").trim() || null;
  const produtoId = String(formData.get("produto_id") ?? "").trim() || null;

  const supabase = await createClient();
  const { data: ultima } = await supabase
    .from("destaques")
    .select("ordem")
    .eq("bar_id", current.bar.id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle<{ ordem: number }>();

  await supabase.from("destaques").insert({
    bar_id: current.bar.id,
    titulo,
    subtitulo,
    imagem_url: imagemUrl,
    produto_id: produtoId,
    ordem: (ultima?.ordem ?? 0) + 1,
    ativo: true,
  });

  revalidatePath("/dashboard/cardapio");
}

export async function deletarDestaque(id: string) {
  const supabase = await createClient();
  await supabase.from("destaques").delete().eq("id", id);
  revalidatePath("/dashboard/cardapio");
}
