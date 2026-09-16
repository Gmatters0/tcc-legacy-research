import { prisma } from "@/lib/prisma";
import { TipoEventoErro } from "./types";

// Um SUS/TLX/subjetivo por SessaoTeste (ver AvaliacaoPosTarefa no schema) —
// null enquanto a sessão não passou pela Avaliação Pós-Tarefa em /sucesso
// (sessão em andamento, abandonada, ou ainda não avaliada).
export interface AvaliacaoRelatorio {
  tlxMental: number;
  tlxFisica: number;
  tlxTemporal: number;
  tlxDesempenho: number;
  tlxEsforco: number;
  tlxFrustracao: number;
  tlxScore: number;
  susQ1: number;
  susQ2: number;
  susQ3: number;
  susQ4: number;
  susQ5: number;
  susQ6: number;
  susQ7: number;
  susQ8: number;
  susQ9: number;
  susQ10: number;
  susScore: number;
  subjQ1: number;
  subjQ2: number;
  subjQ3: number;
  subjQ4: number;
  subjQ5: number;
  subjQ6: number;
  subjQ7: number;
  subjQ8: number;
  subjQ9: number;
  subjQ10: number;
}

// Uma por Usuario (não por SessaoTeste — só existe depois do segundo
// cenário), repetida nas duas linhas desse usuário pra cada linha do
// relatório ficar auto-suficiente sem exigir join na hora da análise.
export interface ComparacaoFinalRelatorio {
  preferencia: string;
  porque: string;
  feedback: string | null;
}

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
  avaliacao: AvaliacaoRelatorio | null;
  comparacaoFinal: ComparacaoFinalRelatorio | null;
}

export async function buscarLinhasRelatorio(usuarioId?: string): Promise<LinhaRelatorio[]> {
  const sessoes = await prisma.sessaoTeste.findMany({
    where: usuarioId ? { usuarioId } : undefined,
    include: {
      usuario: { select: { codigo: true, comparacaoFinal: true } },
      eventosErro: { select: { tipo: true } },
      avaliacao: true,
    },
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

    const a = sessao.avaliacao;
    const cf = sessao.usuario.comparacaoFinal;

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
      avaliacao: a
        ? {
            tlxMental: a.tlxMental,
            tlxFisica: a.tlxFisica,
            tlxTemporal: a.tlxTemporal,
            tlxDesempenho: a.tlxDesempenho,
            tlxEsforco: a.tlxEsforco,
            tlxFrustracao: a.tlxFrustracao,
            tlxScore: a.tlxScore,
            susQ1: a.susQ1,
            susQ2: a.susQ2,
            susQ3: a.susQ3,
            susQ4: a.susQ4,
            susQ5: a.susQ5,
            susQ6: a.susQ6,
            susQ7: a.susQ7,
            susQ8: a.susQ8,
            susQ9: a.susQ9,
            susQ10: a.susQ10,
            susScore: a.susScore,
            subjQ1: a.subjQ1,
            subjQ2: a.subjQ2,
            subjQ3: a.subjQ3,
            subjQ4: a.subjQ4,
            subjQ5: a.subjQ5,
            subjQ6: a.subjQ6,
            subjQ7: a.subjQ7,
            subjQ8: a.subjQ8,
            subjQ9: a.subjQ9,
            subjQ10: a.subjQ10,
          }
        : null,
      comparacaoFinal: cf ? { preferencia: cf.preferencia, porque: cf.porque, feedback: cf.feedback } : null,
    };
  });
}

function escaparCampoCsv(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

// Mesma ordem das colunas do model AvaliacaoPosTarefa — tlxScore/susScore
// ficam logo depois do bloco de itens de que derivam, não no final.
const CAMPOS_TLX = ["tlxMental", "tlxFisica", "tlxTemporal", "tlxDesempenho", "tlxEsforco", "tlxFrustracao"] as const;
const CAMPOS_SUS = Array.from({ length: 10 }, (_, i) => `susQ${i + 1}`) as (keyof AvaliacaoRelatorio)[];
const CAMPOS_SUBJ = Array.from({ length: 10 }, (_, i) => `subjQ${i + 1}`) as (keyof AvaliacaoRelatorio)[];
const CAMPOS_AVALIACAO: (keyof AvaliacaoRelatorio)[] = [
  ...CAMPOS_TLX,
  "tlxScore",
  ...CAMPOS_SUS,
  "susScore",
  ...CAMPOS_SUBJ,
];

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
    ...CAMPOS_AVALIACAO,
    "comparacaoPreferencia",
    "comparacaoPorque",
    "comparacaoFeedback",
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
    ...CAMPOS_AVALIACAO.map((campo) => (linha.avaliacao ? String(linha.avaliacao[campo]) : "")),
    linha.comparacaoFinal?.preferencia ?? "",
    linha.comparacaoFinal?.porque ?? "",
    linha.comparacaoFinal?.feedback ?? "",
  ]);

  return [cabecalho, ...linhasCsv].map((linha) => linha.map(escaparCampoCsv).join(",")).join("\r\n");
}
