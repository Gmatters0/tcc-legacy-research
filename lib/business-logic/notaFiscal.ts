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

  try {
    return await prisma.notaFiscal.create({
      data: {
        numero: input.numero.trim(),
        fornecedor: input.fornecedor.trim(),
        dataEmissao: new Date(input.dataEmissao),
        valorTotal: input.valorTotal,
      },
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      throw new BusinessLogicError([
        { campo: "numero", mensagem: "Já existe uma nota fiscal cadastrada com este número." },
      ]);
    }
    throw err;
  }
}

export async function buscarNotaFiscal(id: string) {
  return prisma.notaFiscal.findUnique({
    where: { id },
    include: { itensRecebidos: true, lancamentosEstoque: true },
  });
}
