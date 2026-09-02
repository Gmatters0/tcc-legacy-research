import { prisma } from "@/lib/prisma";
import { TipoEventoErro } from "./types";

// Única fonte da linha de relatório (sessão + métricas), reutilizada pela
// grid do painel admin e pelo export CSV/JSON — mesma forma nos dois.
export interface LinhaRelatorio {
  sessaoId: string;
  usuarioCodigo: string;
  perfilUsuario: string;
  cenario: string;
  conjuntoTarefa: string;
  timestampInicio: string;
  timestampFim: string | null;
  duracaoSegundos: number | null;
  totalEventosErro: number;
  eventosPorTipo: Record<TipoEventoErro, number>;
}

export async function buscarLinhasRelatorio(usuarioId?: string): Promise<LinhaRelatorio[]> {
  const sessoes = await prisma.sessaoTeste.findMany({
    where: usuarioId ? { usuarioId } : undefined,
    include: { usuario: { select: { codigo: true } }, eventosErro: { select: { tipo: true } } },
    orderBy: { timestampInicio: "desc" },
  });

  return sessoes.map((sessao) => {
    const eventosPorTipo = Object.fromEntries(
      Object.values(TipoEventoErro).map((tipo) => [tipo, 0]),
    ) as Record<TipoEventoErro, number>;
    for (const evento of sessao.eventosErro) {
      const tipo = evento.tipo as TipoEventoErro;
      if (tipo in eventosPorTipo) eventosPorTipo[tipo] += 1;
    }

    return {
      sessaoId: sessao.id,
      usuarioCodigo: sessao.usuario.codigo,
      perfilUsuario: sessao.perfilUsuario,
      cenario: sessao.cenario,
      conjuntoTarefa: sessao.conjuntoTarefa,
      timestampInicio: sessao.timestampInicio.toISOString(),
      timestampFim: sessao.timestampFim?.toISOString() ?? null,
      duracaoSegundos: sessao.timestampFim
        ? Math.round((sessao.timestampFim.getTime() - sessao.timestampInicio.getTime()) / 1000)
        : null,
      totalEventosErro: sessao.eventosErro.length,
      eventosPorTipo,
    };
  });
}

function escaparCampoCsv(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function linhasParaCsv(linhas: LinhaRelatorio[]): string {
  const tipos = Object.values(TipoEventoErro);
  const cabecalho = [
    "sessaoId",
    "usuarioCodigo",
    "perfilUsuario",
    "cenario",
    "conjuntoTarefa",
    "timestampInicio",
    "timestampFim",
    "duracaoSegundos",
    "totalEventosErro",
    ...tipos,
  ];

  const linhasCsv = linhas.map((linha) => [
    linha.sessaoId,
    linha.usuarioCodigo,
    linha.perfilUsuario,
    linha.cenario,
    linha.conjuntoTarefa,
    linha.timestampInicio,
    linha.timestampFim ?? "",
    linha.duracaoSegundos === null ? "" : String(linha.duracaoSegundos),
    String(linha.totalEventosErro),
    ...tipos.map((tipo) => String(linha.eventosPorTipo[tipo])),
  ]);

  return [cabecalho, ...linhasCsv].map((linha) => linha.map(escaparCampoCsv).join(",")).join("\r\n");
}
