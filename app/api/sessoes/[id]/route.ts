import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAutenticado } from "@/lib/auth/session";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obterUsuarioAutenticado())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { id } = await params;
  const sessao = await prisma.sessaoTeste.update({
    where: { id },
    data: { timestampFim: new Date() },
  });
  return NextResponse.json(sessao);
}
