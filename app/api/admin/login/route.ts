import { NextRequest, NextResponse } from "next/server";
import { criarSessaoAdmin } from "@/lib/admin/session";

export async function POST(request: NextRequest) {
  const { senha } = await request.json();
  const senhaAdmin = process.env.ADMIN_SENHA;

  if (!senhaAdmin || senha !== senhaAdmin) {
    return NextResponse.json({ erros: [{ campo: "senha", mensagem: "Senha inválida." }] }, { status: 401 });
  }

  await criarSessaoAdmin();
  return NextResponse.json({ ok: true });
}
