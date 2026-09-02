import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSAO_COOKIE_NAME } from "@/lib/auth/constants";

// Checagem otimista (só o cookie, sem consulta ao banco) — barra acesso
// direto a /cenario-a e /cenario-b sem login. A checagem autoritativa (usuário
// segue ativo?) acontece nas rotas de API via obterUsuarioAutenticado().
export function proxy(request: NextRequest) {
  const usuarioId = request.cookies.get(SESSAO_COOKIE_NAME)?.value;
  if (!usuarioId) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/cenario-a/:path*", "/cenario-b/:path*", "/sucesso/:path*"],
};
