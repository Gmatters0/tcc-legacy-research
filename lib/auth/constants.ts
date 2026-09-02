// Nome do cookie de sessão de login, compartilhado entre lib/auth/session.ts
// (Route Handlers / Server Components, via next/headers) e proxy.ts (que lê
// cookies diretamente do NextRequest) — os dois precisam do mesmo nome.
export const SESSAO_COOKIE_NAME = "sessao_usuario";
