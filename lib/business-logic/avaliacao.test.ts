import { describe, expect, it } from "vitest";
import { registrarAvaliacao } from "./avaliacao";
import { BusinessLogicError } from "./types";

// validarAvaliacaoInput lança antes de qualquer `await prisma...`, então os
// casos de rejeição abaixo não precisam mockar o Prisma nem tocam no banco.
describe("registrarAvaliacao — validação", () => {
  const tlxValido = { mental: 50, fisica: 10, temporal: 40, desempenho: 20, esforco: 35, frustracao: 15 };
  const susValido = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2];
  const subjetivoValido = [4, 4, 4, 4, 4, 4, 2, 4, 4, 4];

  it("rejeita valor de TLX fora do intervalo 0-100", async () => {
    await expect(
      registrarAvaliacao("sessao-1", { tlx: { ...tlxValido, mental: 150 }, sus: susValido, subjetivo: subjetivoValido }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita valor de TLX negativo", async () => {
    await expect(
      registrarAvaliacao("sessao-1", { tlx: { ...tlxValido, esforco: -5 }, sus: susValido, subjetivo: subjetivoValido }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita SUS com menos de 10 respostas", async () => {
    await expect(
      registrarAvaliacao("sessao-1", { tlx: tlxValido, sus: susValido.slice(0, 9), subjetivo: subjetivoValido }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita SUS com valor fora da escala 1-5", async () => {
    await expect(
      registrarAvaliacao("sessao-1", { tlx: tlxValido, sus: [6, 2, 4, 2, 4, 2, 4, 2, 4, 2], subjetivo: subjetivoValido }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita questionário subjetivo com menos de 10 respostas", async () => {
    await expect(
      registrarAvaliacao("sessao-1", { tlx: tlxValido, sus: susValido, subjetivo: subjetivoValido.slice(0, 5) }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita questionário subjetivo com valor fora da escala 1-5", async () => {
    await expect(
      registrarAvaliacao("sessao-1", { tlx: tlxValido, sus: susValido, subjetivo: [0, 4, 4, 4, 4, 4, 2, 4, 4, 4] }),
    ).rejects.toThrow(BusinessLogicError);
  });
});
