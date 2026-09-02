import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Chamado via navigator.sendBeacon quando o participante sai da tela antes de
// concluir a tarefa (fecha a aba, navega para outra URL, recarrega a página).
// Só apaga a sessão se ela realmente nunca foi finalizada — evita apagar uma
// sessão que terminou com sucesso um instante antes do beacon disparar.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.sessaoTeste.deleteMany({ where: { id, timestampFim: null } });
  return NextResponse.json({ ok: true });
}
