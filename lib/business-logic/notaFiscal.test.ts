import { describe, expect, it } from "vitest";
import { criarNotaFiscal } from "./notaFiscal";
import { BusinessLogicError } from "./types";

// validarNotaFiscalInput lança antes de qualquer `await prisma...`, então os
// casos de rejeição abaixo não precisam mockar o Prisma nem tocam no banco.
describe("criarNotaFiscal — validação", () => {
  const valida = {
    numero: "4052",
    fornecedor: "Comercial Andrade Ltda",
    dataEmissao: "2026-08-17",
    valorTotal: 1000,
  };

  it("rejeita número com letras", async () => {
    await expect(criarNotaFiscal({ ...valida, numero: "40A2" })).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita número vazio", async () => {
    await expect(criarNotaFiscal({ ...valida, numero: "" })).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita fornecedor vazio", async () => {
    await expect(criarNotaFiscal({ ...valida, fornecedor: "   " })).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita data de emissão inválida", async () => {
    await expect(criarNotaFiscal({ ...valida, dataEmissao: "não-é-uma-data" })).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita valorTotal negativo", async () => {
    await expect(criarNotaFiscal({ ...valida, valorTotal: -1 })).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita valorTotal ausente (NaN)", async () => {
    await expect(criarNotaFiscal({ ...valida, valorTotal: NaN })).rejects.toThrow(BusinessLogicError);
  });
});
