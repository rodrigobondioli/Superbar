import { redirect } from "next/navigation";

// A tela Financeiro foi consolidada na Visão Geral (/admin).
// Mantida só como redirect para não quebrar links antigos.
export default function AdminFinanceiroPage() {
  redirect("/admin");
}
