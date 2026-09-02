import { prisma } from "@/lib/prisma";
import { BusinessLogicError, DivergenciaItem, ErroCampo, ItemConferenciaInput } from "./types";

export function calcularDivergencia(qtdPedida: number, qtdRecebida: number): { divergente: boolean; diferenca: number } {
  const diferenca = qtdRecebida - qtdPedida;
  return { divergente: diferenca !== 0, diferenca };
}

function validarItens(itens: ItemConferenciaInput[]) {
  const erros: ErroCampo[] = [];

  if (!itens?.length) {
    erros.push({ campo: "itens", mensagem: "É necessário informar ao menos um item conferido." });
  }

  itens?.forEach((item, index) => {
    if (!item.codigo?.trim()) {
      erros.push({ campo: `itens[${index}].codigo`, mensagem: "Código do item é obrigatório." });
    }
    if (!item.descricao?.trim()) {
      erros.push({ campo: `itens[${index}].descricao`, mensagem: "Descrição do item é obrigatória." });
    }
    if (!item.unidade?.trim()) {
      erros.push({ campo: `itens[${index}].unidade`, mensagem: "Unidade é obrigatória." });
    }
    if (item.qtdPedida === undefined || item.qtdPedida === null || Number.isNaN(item.qtdPedida)) {
      erros.push({ campo: `itens[${index}].qtdPedida`, mensagem: "Quantidade pedida é obrigatória." });
    } else if (item.qtdPedida <= 0) {
      erros.push({ campo: `itens[${index}].qtdPedida`, mensagem: "Quantidade pedida deve ser maior que zero." });
    }
    if (item.qtdRecebida === undefined || item.qtdRecebida === null || Number.isNaN(item.qtdRecebida)) {
      erros.push({ campo: `itens[${index}].qtdRecebida`, mensagem: "Quantidade recebida é obrigatória." });
    } else if (item.qtdRecebida <= 0) {
      erros.push({ campo: `itens[${index}].qtdRecebida`, mensagem: "Quantidade recebida deve ser maior que zero." });
    }
  });

  if (erros.length) throw new BusinessLogicError(erros);
}

export async function registrarConferenciaItens(notaFiscalId: string, itens: ItemConferenciaInput[]) {
  validarItens(itens);

  const nota = await prisma.notaFiscal.findUnique({ where: { id: notaFiscalId } });
  if (!nota) {
    throw new BusinessLogicError([{ campo: "notaFiscalId", mensagem: "Nota fiscal não encontrada." }]);
  }

  await prisma.$transaction([
    prisma.itemRecebido.deleteMany({ where: { notaFiscalId } }),
    prisma.itemRecebido.createMany({
      data: itens.map((item) => ({
        codigo: item.codigo.trim(),
        descricao: item.descricao.trim(),
        qtdPedida: item.qtdPedida,
        qtdRecebida: item.qtdRecebida,
        unidade: item.unidade.trim(),
        notaFiscalId,
      })),
    }),
  ]);

  const divergencias: DivergenciaItem[] = itens.map((item) => ({
    codigo: item.codigo,
    ...calcularDivergencia(item.qtdPedida, item.qtdRecebida),
  }));

  return {
    itens: await prisma.itemRecebido.findMany({ where: { notaFiscalId } }),
    divergencias,
    possuiDivergencia: divergencias.some((d) => d.divergente),
  };
}
