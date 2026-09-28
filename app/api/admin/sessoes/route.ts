import { NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";
import { buscarLinhasRelatorio } from "@/lib/instrumentation/relatorio";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const linhas = await buscarLinhasRelatorio();
  return NextResponse.json(linhas);
}

// Apaga TODAS as SessaoTeste (EventoErro/AvaliacaoPosTarefa em cascata) —
// não mexe em Usuario nem ComparacaoFinal, escopo é só "registros de
// sessão". Confirmação fica a cargo da UI (modal), esta rota só executa.
export async function DELETE() {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { count } = await prisma.sessaoTeste.deleteMany({});
  return NextResponse.json({ ok: true, apagados: count });
}
