"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { homePath } from "@/lib/auth/roles";
import { traduzirErro } from "@/lib/utils";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(traduzirErro(error.message))}`);
  }

  // Cada papel cai na sua casa (dono → dashboard; operacional → sua tela).
  const current = await getCurrentBar();
  redirect(current ? homePath(current.role) : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
