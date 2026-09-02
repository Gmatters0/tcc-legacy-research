import { NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";

export async function GET() {
  const autenticado = await estaAutenticadoComoAdmin();
  if (!autenticado) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
