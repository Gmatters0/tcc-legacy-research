import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/lib/auth/session";
import { registrarComparacaoFinal } from "@/lib/business-logic/comparacaoFinal";
import { erroParaResponse } from "@/lib/api-response";

// Chamado uma única vez, depois que o participante já concluiu e avaliou os
// dois cenários — última etapa antes de POST /api/auth/finalizar-participacao.
export async function POST(request: NextRequest) {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  try {
    const body = await request.json();
    const comparacao = await registrarComparacaoFinal(usuario.id, body);
    return NextResponse.json(comparacao, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
