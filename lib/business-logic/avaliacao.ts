import { prisma } from "@/lib/prisma";
import { calcularSusScore, SUS_ITENS, SUBJETIVO_ITENS, TlxChave } from "@/lib/avaliacao-config";
import { BusinessLogicError, ErroCampo } from "./types";

export interface AvaliacaoPosTarefaInput {
  tlx: Record<TlxChave, number>;
  sus: number[];
  subjetivo: number[];
}

const TLX_CHAVES: TlxChave[] = ["mental", "fisica", "temporal", "desempenho", "esforco", "frustracao"];

function validarEscala(valores: unknown, tamanhoEsperado: number, min: number, max: number, campo: string): ErroCampo[] {
  const erros: ErroCampo[] = [];
  if (!Array.isArray(valores) || valores.length !== tamanhoEsperado) {
    erros.push({ campo, mensagem: `É necessário responder todos os ${tamanhoEsperado} itens.` });
    return erros;
  }
  valores.forEach((valor, indice) => {
    if (typeof valor !== "number" || Number.isNaN(valor) || valor < min || valor > max) {
      erros.push({ campo: `${campo}[${indice}]`, mensagem: `Resposta inválida no item ${indice + 1}.` });
    }
  });
  return erros;
}

function validarAvaliacaoInput(input: AvaliacaoPosTarefaInput) {
  const erros: ErroCampo[] = [];

  if (!input.tlx || typeof input.tlx !== "object") {
    erros.push({ campo: "tlx", mensagem: "Carga de trabalho (NASA-TLX) é obrigatória." });
  } else {
    TLX_CHAVES.forEach((chave) => {
      const valor = input.tlx[chave];
      if (typeof valor !== "number" || Number.isNaN(valor) || valor < 0 || valor > 100) {
        erros.push({ campo: `tlx.${chave}`, mensagem: "Valor inválido — deve estar entre 0 e 100." });
      }
    });
  }

  erros.push(...validarEscala(input.sus, SUS_ITENS.length, 1, 5, "sus"));
  erros.push(...validarEscala(input.subjetivo, SUBJETIVO_ITENS.length, 1, 5, "subjetivo"));

  if (erros.length) throw new BusinessLogicError(erros);
}

export async function registrarAvaliacao(sessaoId: string, input: AvaliacaoPosTarefaInput) {
  validarAvaliacaoInput(input);

  const sessao = await prisma.sessaoTeste.findUnique({ where: { id: sessaoId } });
  if (!sessao) {
    throw new BusinessLogicError([{ campo: "sessaoId", mensagem: "Sessão não encontrada." }]);
  }
  if (!sessao.timestampFim) {
    throw new BusinessLogicError([{ campo: "sessaoId", mensagem: "A sessão ainda não foi concluída." }]);
  }

  try {
    return await prisma.avaliacaoPosTarefa.create({
      data: {
        sessaoId,
        tlxMental: input.tlx.mental,
        tlxFisica: input.tlx.fisica,
        tlxTemporal: input.tlx.temporal,
        tlxDesempenho: input.tlx.desempenho,
        tlxEsforco: input.tlx.esforco,
        tlxFrustracao: input.tlx.frustracao,
        susQ1: input.sus[0],
        susQ2: input.sus[1],
        susQ3: input.sus[2],
        susQ4: input.sus[3],
        susQ5: input.sus[4],
        susQ6: input.sus[5],
        susQ7: input.sus[6],
        susQ8: input.sus[7],
        susQ9: input.sus[8],
        susQ10: input.sus[9],
        susScore: calcularSusScore(input.sus),
        subjQ1: input.subjetivo[0],
        subjQ2: input.subjetivo[1],
        subjQ3: input.subjetivo[2],
        subjQ4: input.subjetivo[3],
        subjQ5: input.subjetivo[4],
        subjQ6: input.subjetivo[5],
        subjQ7: input.subjetivo[6],
        subjQ8: input.subjetivo[7],
        subjQ9: input.subjetivo[8],
        subjQ10: input.subjetivo[9],
      },
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      throw new BusinessLogicError([{ campo: "sessaoId", mensagem: "Essa sessão já tem uma avaliação registrada." }]);
    }
    throw err;
  }
}
