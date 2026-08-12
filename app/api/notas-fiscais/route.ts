import { NextRequest, NextResponse } from "next/server";
import { criarNotaFiscal } from "@/lib/business-logic/notaFiscal";
import { erroParaResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notaFiscal = await criarNotaFiscal(body);
    return NextResponse.json(notaFiscal, { status: 201 });
  } catch (err) {
    return erroParaResponse(err);
  }
}
