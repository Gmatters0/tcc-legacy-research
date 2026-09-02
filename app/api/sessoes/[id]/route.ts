import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await prisma.sessaoTeste.update({
    where: { id },
    data: { timestampFim: new Date() },
  });
  return NextResponse.json(sessao);
}
