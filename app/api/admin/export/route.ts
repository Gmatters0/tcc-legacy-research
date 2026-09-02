import { NextRequest, NextResponse } from "next/server";
import { estaAutenticadoComoAdmin } from "@/lib/admin/session";
import { buscarLinhasRelatorio, linhasParaCsv } from "@/lib/instrumentation/relatorio";

export async function GET(request: NextRequest) {
  if (!(await estaAutenticadoComoAdmin())) {
    return NextResponse.json({ erros: [{ campo: "geral", mensagem: "Não autenticado." }] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato") === "csv" ? "csv" : "json";
  const usuarioId = searchParams.get("usuarioId") ?? undefined;

  const linhas = await buscarLinhasRelatorio(usuarioId);
  const sufixo = usuarioId ? linhas[0]?.usuarioCodigo ?? usuarioId : "todos";
  const dataArquivo = new Date().toISOString().slice(0, 10);

  if (formato === "csv") {
    return new NextResponse(linhasParaCsv(linhas), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sessoes-${sufixo}-${dataArquivo}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(linhas, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sessoes-${sufixo}-${dataArquivo}.json"`,
    },
  });
}
