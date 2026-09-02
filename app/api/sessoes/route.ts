import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAutenticado } from "@/lib/auth/session";
import { buscarHistoricoParticipacao, validarElegibilidade } from "@/lib/business-logic/elegibilidade";
import { BusinessLogicError } from "@/lib/business-logic/types";
import { erroParaResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { perfilUsuario, cenario, conjuntoTarefa } = body;

    if (!perfilUsuario || !cenario || !conjuntoTarefa) {
      throw new BusinessLogicError([
        { campo: "geral", mensagem: "Perfil, cenário e conjunto de tarefa são obrigatórios." },
      ]);
    }

    const historico = await buscarHistoricoParticipacao(usuario.id);
    validarElegibilidade(cenario, conjuntoTarefa, historico);

    // Rede de segurança: sessões nunca finalizadas (aba fechada, refresh, crash)
    // não devem persistir no banco. O caminho principal de limpeza é o beacon
    // disparado no pagehide (ver SessaoProvider); isso aqui cobre os casos em
    // que o beacon não chegou a disparar.
    await prisma.sessaoTeste.deleteMany({ where: { timestampFim: null } });

    const sessao = await prisma.sessaoTeste.create({
      data: {
        usuarioId: usuario.id,
        perfilUsuario,
        cenario,
        conjuntoTarefa,
        timestampInicio: new Date(),
      },
    });

    return NextResponse.json(sessao, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
