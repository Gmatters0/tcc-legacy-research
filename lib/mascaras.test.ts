import { describe, expect, it } from "vitest";
import { aplicarMascaraData, aplicarMascaraMoeda } from "./mascaras";

describe("aplicarMascaraMoeda", () => {
  it("formata dígitos como centavos com ponto de milhar e vírgula decimal", () => {
    expect(aplicarMascaraMoeda("5")).toBe("0,05");
    expect(aplicarMascaraMoeda("12345")).toBe("123,45");
    expect(aplicarMascaraMoeda("123456")).toBe("1.234,56");
    expect(aplicarMascaraMoeda("123456789")).toBe("1.234.567,89");
  });

  it("reaplica sobre o próprio resultado sem mudar o valor", () => {
    expect(aplicarMascaraMoeda("1.234,56")).toBe("1.234,56");
  });

  it("descarta caracteres não numéricos e devolve vazio sem dígitos", () => {
    expect(aplicarMascaraMoeda("R$ 12a3")).toBe("1,23");
    expect(aplicarMascaraMoeda("abc")).toBe("");
    expect(aplicarMascaraMoeda("")).toBe("");
  });
});

describe("aplicarMascaraData", () => {
  it("insere os pontos conforme os dígitos são digitados", () => {
    expect(aplicarMascaraData("0")).toBe("0");
    expect(aplicarMascaraData("070")).toBe("07.0");
    expect(aplicarMascaraData("0709")).toBe("07.09");
    expect(aplicarMascaraData("07092026")).toBe("07.09.2026");
  });

  it("limita a 8 dígitos e aceita separadores digitados à mão", () => {
    expect(aplicarMascaraData("070920261234")).toBe("07.09.2026");
    expect(aplicarMascaraData("07/09/2026")).toBe("07.09.2026");
  });
});
