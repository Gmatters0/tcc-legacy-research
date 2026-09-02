import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/lib/auth/session";
import { buscarHistoricoParticipacao } from "@/lib/business-logic/elegibilidade";

export async function GET() {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }
  const historico = await buscarHistoricoParticipacao(usuario.id);
  return NextResponse.json({ ...usuario, ...historico });
}
