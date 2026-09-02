import { NextResponse } from "next/server";
import { BusinessLogicError } from "@/lib/business-logic/types";

export function erroParaResponse(err: unknown) {
  if (err instanceof BusinessLogicError) {
    return NextResponse.json({ erros: err.erros }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json(
    { erros: [{ campo: "geral", mensagem: "Erro inesperado ao processar a requisição." }] },
    { status: 500 },
  );
}
