import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessaoId, tipo, detalhe } = body;

  if (!sessaoId || !tipo) {
    return NextResponse.json(
      { erros: [{ campo: "geral", mensagem: "sessaoId e tipo são obrigatórios." }] },
      { status: 400 },
    );
  }

  const evento = await prisma.eventoErro.create({
    data: { sessaoId, tipo, detalhe },
  });

  return NextResponse.json(evento, { status: 201 });
}
