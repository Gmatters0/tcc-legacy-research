import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "sessao_admin";

// Não há model Admin nem tabela própria — um único segredo local (ADMIN_SENHA
// em .env). O cookie guarda um token derivado desse segredo via HMAC: dá pra
// verificar sem consulta a banco nem estado em memória do processo (o que
// facilitaria login mas quebraria a cada reload do servidor em dev).
function tokenEsperado(): string {
  return createHmac("sha256", process.env.ADMIN_SENHA ?? "").update("admin-session").digest("hex");
}

export async function criarSessaoAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, tokenEsperado(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Sem maxAge/expires de propósito: cookie de sessão do navegador — expira
    // sempre que o navegador fecha, não fica "lembrado" entre reinícios. Acesso
    // de admin é local ao pesquisador, sem tabela de usuário admin no banco.
  });
}

export async function encerrarSessaoAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function estaAutenticadoComoAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const tokenBuf = Buffer.from(token);
  const esperadoBuf = Buffer.from(tokenEsperado());
  if (tokenBuf.length !== esperadoBuf.length) return false;

  return timingSafeEqual(tokenBuf, esperadoBuf);
}
