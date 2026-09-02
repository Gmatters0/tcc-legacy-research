import { NextRequest, NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";
import { criarUsuario, listarUsuarios } from "@/lib/auth/usuario";
import { buscarHistoricoParticipacao } from "@/lib/business-logic/elegibilidade";
import { erroParaResponse } from "@/lib/api-response";

export async function GET() {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const usuarios = await listarUsuarios();
  const usuariosComHistorico = await Promise.all(
    usuarios.map(async (usuario) => ({
      ...usuario,
      historico: await buscarHistoricoParticipacao(usuario.id),
    })),
  );

  return NextResponse.json(usuariosComHistorico);
}

export async function POST(request: NextRequest) {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  try {
    const { iniciais } = await request.json();
    const resultado = await criarUsuario(iniciais);
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
