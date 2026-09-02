import { describe, expect, it } from "vitest";
import { registrarBaixaEstoque } from "./estoque";
import { BusinessLogicError } from "./types";

// validarBaixaInput lança antes de qualquer `await prisma...`, então os casos
// de rejeição abaixo não precisam mockar o Prisma.
describe("registrarBaixaEstoque — validação", () => {
  const notaFiscalId = "nf-1";
  const valido = { armazem: "D01", lote: "Lote de Estoque A", quantidade: 500 };

  it("rejeita armazém vazio", async () => {
    await expect(registrarBaixaEstoque(notaFiscalId, { ...valido, armazem: "" })).rejects.toThrow(
      BusinessLogicError,
    );
  });

  it("rejeita lote vazio", async () => {
    await expect(registrarBaixaEstoque(notaFiscalId, { ...valido, lote: "   " })).rejects.toThrow(
      BusinessLogicError,
    );
  });

  it("rejeita quantidade igual a zero", async () => {
    await expect(registrarBaixaEstoque(notaFiscalId, { ...valido, quantidade: 0 })).rejects.toThrow(
      BusinessLogicError,
    );
  });

  it("rejeita quantidade negativa", async () => {
    await expect(registrarBaixaEstoque(notaFiscalId, { ...valido, quantidade: -5 })).rejects.toThrow(
      BusinessLogicError,
    );
  });

  it("rejeita quantidade ausente (NaN)", async () => {
    await expect(registrarBaixaEstoque(notaFiscalId, { ...valido, quantidade: NaN })).rejects.toThrow(
      BusinessLogicError,
    );
  });
});
