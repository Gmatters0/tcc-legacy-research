import { prisma } from "@/lib/prisma";
import { BaixaInput, BusinessLogicError, ErroCampo } from "./types";

function validarBaixaInput(input: BaixaInput) {
  const erros: ErroCampo[] = [];

  if (!input.armazem?.trim()) {
    erros.push({ campo: "armazem", mensagem: "Armazém/depósito de destino é obrigatório." });
  }
  if (!input.lote?.trim()) {
    erros.push({ campo: "lote", mensagem: "Lote é obrigatório." });
  }
  if (input.quantidade === undefined || input.quantidade === null || Number.isNaN(input.quantidade)) {
    erros.push({ campo: "quantidade", mensagem: "Quantidade é obrigatória e deve ser numérica." });
  } else if (input.quantidade <= 0) {
    erros.push({ campo: "quantidade", mensagem: "Quantidade deve ser maior que zero." });
  }

  if (erros.length) throw new BusinessLogicError(erros);
}

export async function registrarBaixaEstoque(notaFiscalId: string, input: BaixaInput) {
  validarBaixaInput(input);

  const nota = await prisma.notaFiscal.findUnique({
    where: { id: notaFiscalId },
    include: { itensRecebidos: true },
  });
  if (!nota) {
    throw new BusinessLogicError([{ campo: "notaFiscalId", mensagem: "Nota fiscal não encontrada." }]);
  }
  if (!nota.itensRecebidos.length) {
    throw new BusinessLogicError([
      { campo: "itens", mensagem: "É necessário conferir os itens antes de registrar a baixa." },
    ]);
  }

  const possuiDivergencia = nota.itensRecebidos.some((item) => item.qtdRecebida !== item.qtdPedida);
  const status = possuiDivergencia ? "CONCLUIDO_COM_DIVERGENCIA" : "CONCLUIDO";

  return prisma.lancamentoEstoque.create({
    data: {
      armazem: input.armazem.trim(),
      lote: input.lote.trim(),
      quantidade: input.quantidade,
      status,
      notaFiscalId,
    },
  });
}
