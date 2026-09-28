import { NextRequest, NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";
import { prisma } from "@/lib/prisma";

// Apaga uma única SessaoTeste (EventoErro e AvaliacaoPosTarefa somem em
// cascata) — deleteMany em vez de delete pra ser idempotente: apagar de novo
// (duplo clique, id já removido) não deve virar 500. Confirmação fica a
// cargo da UI (modal), esta rota só executa.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { id } = await params;
  await prisma.sessaoTeste.deleteMany({ where: { id } });

  return NextResponse.json({ ok: true });
}
