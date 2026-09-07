import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAutenticado } from "@/lib/auth/session";

// Chamado via navigator.sendBeacon quando o participante sai da tela antes de
// concluir a tarefa (fecha a aba, navega para outra URL, recarrega a página).
// Só apaga a sessão se ela realmente nunca foi finalizada — evita apagar uma
// sessão que terminou com sucesso um instante antes do beacon disparar.
// sendBeacon é same-origin, então o cookie de sessão viaja normalmente junto.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obterUsuarioAutenticado())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { id } = await params;
  await prisma.sessaoTeste.deleteMany({ where: { id, timestampFim: null } });
  return NextResponse.json({ ok: true });
}
