import { describe, expect, it } from "vitest";
import { gerarSenhaAleatoria, hashSenha, verificarSenha } from "./password";

describe("hashSenha / verificarSenha", () => {
  it("verifica corretamente a senha original", () => {
    const hash = hashSenha("minhasenha123");
    expect(verificarSenha("minhasenha123", hash)).toBe(true);
  });

  it("rejeita uma senha errada", () => {
    const hash = hashSenha("minhasenha123");
    expect(verificarSenha("outrasenha", hash)).toBe(false);
  });

  it("gera hashes diferentes para a mesma senha (salt aleatório)", () => {
    expect(hashSenha("abc")).not.toBe(hashSenha("abc"));
  });

  it("rejeita um hash malformado sem lançar exceção", () => {
    expect(verificarSenha("qualquer", "hash-sem-separador")).toBe(false);
  });
});

describe("gerarSenhaAleatoria", () => {
  it("gera senha com o tamanho padrão", () => {
    expect(gerarSenhaAleatoria()).toHaveLength(10);
  });

  it("respeita um tamanho customizado", () => {
    expect(gerarSenhaAleatoria(16)).toHaveLength(16);
  });

  it("não usa caracteres ambíguos (0/O/1/l/I)", () => {
    // amostra grande para dar chance de qualquer caractere ambíguo aparecer se o alfabeto estivesse errado
    const senha = gerarSenhaAleatoria(500);
    expect(senha).not.toMatch(/[0O1lI]/);
  });

  it("gera senhas diferentes a cada chamada", () => {
    expect(gerarSenhaAleatoria()).not.toBe(gerarSenhaAleatoria());
  });
});
