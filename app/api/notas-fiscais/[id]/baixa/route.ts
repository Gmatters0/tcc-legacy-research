import { NextRequest, NextResponse } from "next/server";
import { registrarBaixaEstoque } from "@/lib/business-logic/estoque";
import { erroParaResponse } from "@/lib/api-response";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const lancamento = await registrarBaixaEstoque(id, body);
    return NextResponse.json(lancamento, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
