import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAutenticado } from "@/lib/auth/session";

// Usado pelo painel de dados da tarefa (PainelTarefa) para saber qual conjunto
// exibir — devolve só o necessário e só para o dono da sessão.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { id } = await params;
  const sessao = await prisma.sessaoTeste.findUnique({ where: { id } });
  if (!sessao || sessao.usuarioId !== usuario.id) {
    return NextResponse.json({ erros: [{ campo: "id", mensagem: "Sessão não encontrada." }] }, { status: 404 });
  }

  return NextResponse.json({ id: sessao.id, cenario: sessao.cenario, conjuntoTarefa: sessao.conjuntoTarefa });
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { id } = await params;
  const sessaoExistente = await prisma.sessaoTeste.findUnique({ where: { id } });
  if (!sessaoExistente || sessaoExistente.usuarioId !== usuario.id) {
    return NextResponse.json({ erros: [{ campo: "id", mensagem: "Sessão não encontrada." }] }, { status: 404 });
  }

  const sessao = await prisma.sessaoTeste.update({
    where: { id },
    data: { timestampFim: new Date() },
  });
  return NextResponse.json(sessao);
}
