import { NextRequest, NextResponse } from "next/server";
import { criarNotaFiscal } from "@/lib/business-logic/notaFiscal";
import { erroParaResponse } from "@/lib/api-response";
import { obterUsuarioAutenticado } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!(await obterUsuarioAutenticado())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  try {
    const body = await request.json();
    const notaFiscal = await criarNotaFiscal(body);
    return NextResponse.json(notaFiscal, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
