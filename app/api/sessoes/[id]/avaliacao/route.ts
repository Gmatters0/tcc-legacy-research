import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAutenticado } from "@/lib/auth/session";
import { registrarAvaliacao } from "@/lib/business-logic/avaliacao";
import { erroParaResponse } from "@/lib/api-response";
import { BusinessLogicError } from "@/lib/business-logic/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sessao = await prisma.sessaoTeste.findUnique({ where: { id } });
    if (!sessao || sessao.usuarioId !== usuario.id) {
      throw new BusinessLogicError([{ campo: "sessaoId", mensagem: "Sessão não encontrada." }]);
    }

    const body = await request.json();
    const avaliacao = await registrarAvaliacao(id, body);
    return NextResponse.json(avaliacao, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
