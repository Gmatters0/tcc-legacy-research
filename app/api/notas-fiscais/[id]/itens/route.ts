import { NextRequest, NextResponse } from "next/server";
import { registrarConferenciaItens } from "@/lib/business-logic/conferencia";
import { erroParaResponse } from "@/lib/api-response";
import { obterUsuarioAutenticado } from "@/lib/auth/session";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obterUsuarioAutenticado())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const resultado = await registrarConferenciaItens(id, body.itens);
    return NextResponse.json(resultado);
  } catch (err) {
    return erroParaResponse(err);
  }
}
