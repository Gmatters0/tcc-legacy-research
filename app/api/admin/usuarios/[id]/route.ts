import { NextRequest, NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";
import { desativarUsuario, reativarUsuario } from "@/lib/auth/usuario";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { id } = await params;
  const { ativo } = await request.json();

  if (typeof ativo !== "boolean") {
    return NextResponse.json({ erros: [{ campo: "ativo", mensagem: "Campo 'ativo' (boolean) é obrigatório." }] }, {
      status: 400,
    });
  }

  if (ativo) {
    await reativarUsuario(id);
  } else {
    await desativarUsuario(id);
  }

  return NextResponse.json({ ok: true });
}
