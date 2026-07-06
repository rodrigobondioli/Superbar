import { type NextRequest, NextResponse } from "next/server";

// Modo "kiosk sem login" desativado — o dispositivo do bar agora usa LOGIN
// COMPARTILHADO (o iPad loga uma vez com a conta do bar; a RLS fica ligada).
// Sem sessão auth, a RLS bloqueia leitura/escrita de mesa/comanda/pedido, então
// esse caminho ficava inoperante. Qualquer link antigo cai no /login.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}
