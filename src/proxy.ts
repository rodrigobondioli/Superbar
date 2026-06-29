import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Rotas públicas que funcionam em qualquer domínio (menu do cliente, kiosk, API)
const PUBLIC_PREFIXES = ["/menu", "/kiosk", "/_next", "/favicon", "/api"];
const APP_HOST = "app.superbar.com.br";

export async function proxy(request: NextRequest) {
  const host     = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // Restrição de domínio — bloqueia www.superbar.com.br/dashboard etc.
  if (
    !host.startsWith("localhost") &&
    !host.startsWith("127.0.0.1") &&
    !PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) &&
    host !== APP_HOST &&
    !host.startsWith(`${APP_HOST}:`)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
