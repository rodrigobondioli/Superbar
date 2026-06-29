import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Domínio canônico do app
const APP_HOST = "app.superbar.com.br";

// Domínios da landing page — servem livremente, exceto rotas exclusivas do app
const WWW_HOSTS = ["superbar.com.br", "www.superbar.com.br"];

// Rotas exclusivas do app — bloqueadas no www
const APP_ONLY_PREFIXES = [
  "/dashboard", "/caixa", "/garcom", "/producao",
  "/admin", "/onboarding", "/settings", "/kiosk/setup",
];

export async function proxy(request: NextRequest) {
  const host     = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const isLocal  = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  const isWww = !isLocal && WWW_HOSTS.some(h => host === h || host.startsWith(`${h}:`));

  if (isWww) {
    // Landing page: bloqueia apenas rotas exclusivas do app
    if (APP_ONLY_PREFIXES.some(p => pathname.startsWith(p))) {
      return new NextResponse(null, { status: 404 });
    }
    return updateSession(request);
  }

  // Bloqueia qualquer outro domínio desconhecido no app host
  if (
    !isLocal &&
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
