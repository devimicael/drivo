// Redirecionamento por presença de cookie — T024. NÃO é barreira de segurança:
// a API é quem autentica e autoriza (RF15). No Next 16 este arquivo substitui
// o antigo `middleware.ts` (renomeado para `proxy.ts`).
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "drivo_session";
const PUBLIC_ROUTES = new Set(["/login", "/cadastro"]);

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (hasSession && PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/garagem", request.url));
  }

  if (!hasSession && !PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
