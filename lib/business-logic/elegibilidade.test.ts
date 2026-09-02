import { describe, expect, it, vi } from "vitest";
import { BusinessLogicError } from "./types";
import { validarElegibilidade } from "./elegibilidade";

describe("validarElegibilidade", () => {
  const historicoVazio = { cenariosConcluidos: [], conjuntosTarefaConcluidos: [] };

  it("aceita cenário e conjunto ainda não concluídos", () => {
    expect(() => validarElegibilidade("A", "conjunto-1", historicoVazio)).not.toThrow();
  });

  it("rejeita repetir um cenário já concluído", () => {
    const historico = { cenariosConcluidos: ["A"], conjuntosTarefaConcluidos: [] };
    expect(() => validarElegibilidade("A", "conjunto-2", historico)).toThrow(BusinessLogicError);
  });

  it("rejeita repetir um conjunto de tarefa já concluído", () => {
    const historico = { cenariosConcluidos: [], conjuntosTarefaConcluidos: ["conjunto-1"] };
    expect(() => validarElegibilidade("B", "conjunto-1", historico)).toThrow(BusinessLogicError);
  });

  it("reporta os dois erros quando cenário e conjunto já foram concluídos", () => {
    const historico = { cenariosConcluidos: ["A"], conjuntosTarefaConcluidos: ["conjunto-1"] };
    try {
      validarElegibilidade("A", "conjunto-1", historico);
      throw new Error("deveria ter lançado BusinessLogicError");
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessLogicError);
      expect((err as BusinessLogicError).erros).toHaveLength(2);
    }
  });
});

describe("buscarHistoricoParticipacao", () => {
  it("agrupa cenários e conjuntos de tarefa concluídos sem duplicar", async () => {
    vi.resetModules();
    const findManyMock = vi.fn().mockResolvedValue([
      { cenario: "A", conjuntoTarefa: "conjunto-1" },
      { cenario: "A", conjuntoTarefa: "conjunto-1" }, // duplicado de propósito
    ]);
    vi.doMock("@/lib/prisma", () => ({
      prisma: { sessaoTeste: { findMany: findManyMock } },
    }));

    const { buscarHistoricoParticipacao } = await import("./elegibilidade");
    const historico = await buscarHistoricoParticipacao("usuario-1");

    expect(historico).toEqual({
      cenariosConcluidos: ["A"],
      conjuntosTarefaConcluidos: ["conjunto-1"],
    });
    expect(findManyMock).toHaveBeenCalledWith({
      where: { usuarioId: "usuario-1", timestampFim: { not: null } },
      select: { cenario: true, conjuntoTarefa: true },
    });

    vi.doUnmock("@/lib/prisma");
  });
});
