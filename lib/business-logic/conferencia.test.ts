import { describe, expect, it } from "vitest";
import { calcularDivergencia, registrarConferenciaItens } from "./conferencia";
import { BusinessLogicError } from "./types";

describe("calcularDivergencia", () => {
  it("não é divergente quando as quantidades batem", () => {
    expect(calcularDivergencia(500, 500)).toEqual({ divergente: false, diferenca: 0 });
  });

  it("é divergente quando a quantidade recebida é menor que a pedida", () => {
    expect(calcularDivergencia(300, 280)).toEqual({ divergente: true, diferenca: -20 });
  });

  it("é divergente quando a quantidade recebida é maior que a pedida", () => {
    expect(calcularDivergencia(100, 120)).toEqual({ divergente: true, diferenca: 20 });
  });
});

// registrarConferenciaItens valida a lista de itens antes de tocar no banco
// (validarItens lança antes de qualquer `await prisma...`), então os casos de
// rejeição abaixo não precisam mockar o Prisma.
describe("registrarConferenciaItens — validação", () => {
  const notaFiscalId = "nf-1";

  it("rejeita lista vazia de itens", async () => {
    await expect(registrarConferenciaItens(notaFiscalId, [])).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita item com código vazio", async () => {
    const itens = [{ codigo: "", descricao: "Parafuso", qtdPedida: 10, qtdRecebida: 10, unidade: "UN" }];
    await expect(registrarConferenciaItens(notaFiscalId, itens)).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita qtdPedida igual a zero", async () => {
    const itens = [{ codigo: "A", descricao: "B", qtdPedida: 0, qtdRecebida: 10, unidade: "UN" }];
    await expect(registrarConferenciaItens(notaFiscalId, itens)).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita qtdRecebida negativa", async () => {
    const itens = [{ codigo: "A", descricao: "B", qtdPedida: 10, qtdRecebida: -1, unidade: "UN" }];
    await expect(registrarConferenciaItens(notaFiscalId, itens)).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita qtdPedida ausente (NaN)", async () => {
    const itens = [{ codigo: "A", descricao: "B", qtdPedida: NaN, qtdRecebida: 10, unidade: "UN" }];
    await expect(registrarConferenciaItens(notaFiscalId, itens)).rejects.toThrow(BusinessLogicError);
  });
});
