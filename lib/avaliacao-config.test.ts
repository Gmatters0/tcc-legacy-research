import { describe, expect, it } from "vitest";
import { calcularSusScore, calcularTlxScore } from "./avaliacao-config";

describe("calcularSusScore", () => {
  it("dá 100 quando todas as respostas são as mais favoráveis (ímpares=5, pares=1)", () => {
    expect(calcularSusScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
  });

  it("dá 0 quando todas as respostas são as menos favoráveis (ímpares=1, pares=5)", () => {
    expect(calcularSusScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
  });

  it("dá 50 quando todas as respostas são neutras (3)", () => {
    expect(calcularSusScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50);
  });
});

describe("calcularTlxScore", () => {
  const base = { mental: 0, fisica: 0, temporal: 0, desempenho: 0, esforco: 0, frustracao: 0 };

  it("é a média simples das 6 dimensões", () => {
    expect(calcularTlxScore({ ...base, mental: 60, fisica: 0, temporal: 30, desempenho: 90, esforco: 0, frustracao: 0 })).toBe(30);
  });

  it("dá 0 quando todas as dimensões estão no melhor extremo", () => {
    expect(calcularTlxScore(base)).toBe(0);
  });

  it("dá 100 quando todas as dimensões estão no pior extremo", () => {
    expect(
      calcularTlxScore({ mental: 100, fisica: 100, temporal: 100, desempenho: 100, esforco: 100, frustracao: 100 }),
    ).toBe(100);
  });
});
