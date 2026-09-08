import { prisma } from "@/lib/prisma";
import { BusinessLogicError, ErroCampo, NotaFiscalInput } from "./types";

function validarNotaFiscalInput(input: NotaFiscalInput) {
  const erros: ErroCampo[] = [];

  if (!input.numero?.trim()) {
    erros.push({ campo: "numero", mensagem: "Número da NF é obrigatório." });
  } else if (!/^\d+$/.test(input.numero.trim())) {
    erros.push({ campo: "numero", mensagem: "Número da NF deve conter apenas números." });
  }
  if (!input.fornecedor?.trim()) {
    erros.push({ campo: "fornecedor", mensagem: "Fornecedor é obrigatório." });
  }
  if (!input.dataEmissao || Number.isNaN(new Date(input.dataEmissao).getTime())) {
    erros.push({ campo: "dataEmissao", mensagem: "Data de emissão é obrigatória e deve ser válida." });
  }
  // Valor total pode ser zero (ex: item recebido como brinde/permuta) — só é
  // inválido se ausente/não numérico ou negativo.
  if (input.valorTotal === undefined || input.valorTotal === null || Number.isNaN(input.valorTotal)) {
    erros.push({ campo: "valorTotal", mensagem: "Valor total é obrigatório e deve ser numérico." });
  } else if (input.valorTotal < 0) {
    erros.push({ campo: "valorTotal", mensagem: "Valor total não pode ser negativo." });
  }

  if (erros.length) throw new BusinessLogicError(erros);
}

export async function criarNotaFiscal(input: NotaFiscalInput) {
  validarNotaFiscalInput(input);

  // Número da NF não é único no banco de propósito: o mesmo conjunto de
  // tarefa (mesmos números de NF) é reaplicado a cada participante do
  // experimento, então repetir um número entre sessões diferentes é
  // esperado, não um erro.
  return prisma.notaFiscal.create({
    data: {
      numero: input.numero.trim(),
      fornecedor: input.fornecedor.trim(),
      dataEmissao: new Date(input.dataEmissao),
      valorTotal: input.valorTotal,
    },
  });
}

export async function buscarNotaFiscal(id: string) {
  return prisma.notaFiscal.findUnique({
    where: { id },
    include: { itensRecebidos: true, lancamentosEstoque: true },
  });
}
