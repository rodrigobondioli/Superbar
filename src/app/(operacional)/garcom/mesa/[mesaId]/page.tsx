import { redirect } from "next/navigation";

// A tela da mesa virou um drawer lateral na própria grade (/garcom).
// Esta rota fica só como fallback de link direto.
export default function MesaPageRedirect() {
  redirect("/garcom");
}
