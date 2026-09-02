import { cookies } from "next/headers";
import { SESSAO_COOKIE_NAME } from "./constants";
import { buscarUsuarioAtivoPorId } from "./usuario";
import { UsuarioPublico } from "./types";

const COOKIE_MAX_AGE_SEGUNDOS = 60 * 60 * 12; // 12h — cobre uma sessão de teste presencial

export async function criarSessaoLogin(usuarioId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSAO_COOKIE_NAME, usuarioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEGUNDOS,
  });
}

export async function encerrarSessaoLogin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSAO_COOKIE_NAME);
}

// Checagem "otimista" (só lê o cookie) — usada pelo proxy.ts para decidir
// redirecionar antes de renderizar. A checagem autoritativa, que confere se o
// usuário segue ativo no banco, é obterUsuarioAutenticado() abaixo.
export async function obterUsuarioIdDaSessao(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSAO_COOKIE_NAME)?.value ?? null;
}

export async function obterUsuarioAutenticado(): Promise<UsuarioPublico | null> {
  const id = await obterUsuarioIdDaSessao();
  if (!id) return null;
  return buscarUsuarioAtivoPorId(id);
}
