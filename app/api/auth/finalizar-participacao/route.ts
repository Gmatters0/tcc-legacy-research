import { NextResponse } from "next/server";
import { obterUsuarioAutenticado, encerrarSessaoLogin } from "@/lib/auth/session";
import { desativarUsuario } from "@/lib/auth/usuario";

// Chamado a partir da tela de Sucesso quando o participante escolhe encerrar a
// participação de vez (em vez de voltar à home para o outro cenário). Desativa
// o Usuario (impede reteste futuro, mesma função reutilizável do painel
// administrativo) e encerra a sessão de login — o cookie não teria mais
// utilidade depois da desativação.
export async function POST() {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  await desativarUsuario(usuario.id);
  await encerrarSessaoLogin();

  return NextResponse.json({ ok: true });
}
