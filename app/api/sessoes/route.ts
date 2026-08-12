import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { participanteId, perfilUsuario, cenario, conjuntoTarefa } = body;

  if (!participanteId?.trim() || !perfilUsuario || !cenario || !conjuntoTarefa) {
    return NextResponse.json(
      {
        erros: [
          { campo: "geral", mensagem: "Participante, perfil, cenário e conjunto de tarefa são obrigatórios." },
        ],
      },
      { status: 400 },
    );
  }

  // Rede de segurança: sessões nunca finalizadas (aba fechada, refresh, crash)
  // não devem persistir no banco. O caminho principal de limpeza é o beacon
  // disparado no pagehide (ver SessaoProvider); isso aqui cobre os casos em
  // que o beacon não chegou a disparar.
  await prisma.sessaoTeste.deleteMany({ where: { timestampFim: null } });

  const sessao = await prisma.sessaoTeste.create({
    data: {
      participanteId: participanteId.trim(),
      perfilUsuario,
      cenario,
      conjuntoTarefa,
      timestampInicio: new Date(),
    },
  });

  return NextResponse.json(sessao, { status: 201 });
}
