import { NextRequest, NextResponse } from "next/server";
import { buscarNotaFiscal } from "@/lib/business-logic/notaFiscal";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notaFiscal = await buscarNotaFiscal(id);

  if (!notaFiscal) {
    return NextResponse.json(
      { erros: [{ campo: "id", mensagem: "Nota fiscal não encontrada." }] },
      { status: 404 },
    );
  }

  return NextResponse.json(notaFiscal);
}
