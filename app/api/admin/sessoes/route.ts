import { NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";
import { buscarLinhasRelatorio } from "@/lib/instrumentation/relatorio";

export async function GET() {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const linhas = await buscarLinhasRelatorio();
  return NextResponse.json(linhas);
}
