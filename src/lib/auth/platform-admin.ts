/**
 * Régua única de acesso à plataforma (área /admin do SUPERBAR).
 * Antes: a lista de e-mails e o parse viviam duplicados em
 * `app/admin/layout.tsx` e `lib/admin/actions.ts`, ambos com um default
 * hardcoded — se o env faltasse, o acesso caía num e-mail pessoal fixo
 * (fail-open silencioso). Aqui é fonte única e **fail-closed**: sem
 * `PLATFORM_ADMIN_EMAILS` configurado, ninguém é admin.
 */

function adminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  const lista = adminEmails();
  if (lista.length === 0) return false; // fail-closed: env ausente ⇒ nega
  return lista.includes((email ?? "").toLowerCase());
}
