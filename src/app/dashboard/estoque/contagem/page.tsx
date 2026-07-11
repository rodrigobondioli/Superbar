import { redirect } from "next/navigation";

/** A contagem virou rota própria (/contagem), alcançável também pelo bartender. */
export default function ContagemRedirect() {
  redirect("/contagem");
}
