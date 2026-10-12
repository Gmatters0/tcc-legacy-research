import { describe, expect, it } from "vitest";
import { paraValorMonetario } from "./valor";

describe("paraValorMonetario", () => {
  it("aceita vírgula decimal, com e sem separador de milhar", () => {
    expect(paraValorMonetario("1000,00")).toBe(1000);
    expect(paraValorMonetario("8640,5")).toBe(8640.5);
    expect(paraValorMonetario("1.234,56")).toBe(1234.56);
    expect(paraValorMonetario("1.234.567,89")).toBe(1234567.89);
  });

  it("aceita ponto decimal e formato americano", () => {
    expect(paraValorMonetario("1234.56")).toBe(1234.56);
    expect(paraValorMonetario("10.5")).toBe(10.5);
    expect(paraValorMonetario("1,234.56")).toBe(1234.56);
  });

  it("trata ponto sem vírgula como milhar só quando forma grupos de 3 dígitos", () => {
    expect(paraValorMonetario("1.234")).toBe(1234);
    expect(paraValorMonetario("1.234.567")).toBe(1234567);
  });

  it("ignora R$ e espaços", () => {
    expect(paraValorMonetario("R$ 1.234,56")).toBe(1234.56);
    expect(paraValorMonetario(" 11.275,00 ")).toBe(11275);
  });

  it("preserva zero como valor válido e vazio como undefined", () => {
    expect(paraValorMonetario("0,00")).toBe(0);
    expect(paraValorMonetario("")).toBeUndefined();
    expect(paraValorMonetario("   ")).toBeUndefined();
  });

  it("devolve NaN para texto que não é número", () => {
    expect(paraValorMonetario("abc")).toBeNaN();
    expect(paraValorMonetario("1,2,3")).toBeNaN();
  });
});
