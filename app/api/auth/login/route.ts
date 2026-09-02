import { NextRequest, NextResponse } from "next/server";
import { autenticarUsuario } from "@/lib/auth/usuario";
import { criarSessaoLogin } from "@/lib/auth/session";
import { buscarHistoricoParticipacao } from "@/lib/business-logic/elegibilidade";
import { erroParaResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { codigo, senha } = await request.json();
    const usuario = await autenticarUsuario(codigo, senha);
    await criarSessaoLogin(usuario.id);
    const historico = await buscarHistoricoParticipacao(usuario.id);
    return NextResponse.json({ ...usuario, ...historico });
  } catch (err) {
    return erroParaResponse(err);
  }
}
