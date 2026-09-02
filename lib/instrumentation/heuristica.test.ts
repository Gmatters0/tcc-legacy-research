import { describe, expect, it } from "vitest";
import { fornecedorPareceNumeroNota, pareceCampoTrocado } from "./heuristica";

describe("pareceCampoTrocado (Cenário A)", () => {
  it("detecta quando armazém parece um lote e lote parece um código de armazém", () => {
    expect(pareceCampoTrocado("Lote de Estoque A", "D01")).toBe(true);
  });

  it("não detecta quando o armazém já está no padrão esperado", () => {
    expect(pareceCampoTrocado("D01", "Lote de Estoque A")).toBe(false);
  });

  it("não detecta quando nenhum dos dois parece um código de armazém", () => {
    expect(pareceCampoTrocado("Depósito Central", "Lote A")).toBe(false);
  });

  it("ignora espaços nas extremidades", () => {
    expect(pareceCampoTrocado("  Lote de Estoque A  ", "  D01  ")).toBe(true);
  });
});

describe("fornecedorPareceNumeroNota (Cenário B)", () => {
  it("detecta fornecedor preenchido só com dígitos", () => {
    expect(fornecedorPareceNumeroNota("12345")).toBe(true);
  });

  it("não detecta um nome de fornecedor normal", () => {
    expect(fornecedorPareceNumeroNota("Comercial Andrade Ltda")).toBe(false);
  });

  it("não dispara para fornecedor vazio (já coberto por INPUT_OBRIGATORIO_VAZIO)", () => {
    expect(fornecedorPareceNumeroNota("")).toBe(false);
  });

  it("não detecta um fornecedor alfanumérico (ex: CNPJ com pontuação)", () => {
    expect(fornecedorPareceNumeroNota("12.345.678/0001-90")).toBe(false);
  });
});
