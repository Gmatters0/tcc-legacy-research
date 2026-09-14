import { describe, expect, it } from "vitest";
import { registrarComparacaoFinal } from "./comparacaoFinal";
import { BusinessLogicError } from "./types";

// validarComparacaoFinalInput lança antes de qualquer `await prisma...`,
// então os casos de rejeição abaixo não precisam mockar o Prisma.
describe("registrarComparacaoFinal — validação", () => {
  it("rejeita preferência fora de A/B", async () => {
    await expect(
      registrarComparacaoFinal("usuario-1", { preferencia: "C", porque: "motivo qualquer" }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita preferência ausente", async () => {
    await expect(
      registrarComparacaoFinal("usuario-1", { preferencia: "", porque: "motivo qualquer" }),
    ).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita justificativa vazia", async () => {
    await expect(registrarComparacaoFinal("usuario-1", { preferencia: "A", porque: "   " })).rejects.toThrow(
      BusinessLogicError,
    );
  });
});
