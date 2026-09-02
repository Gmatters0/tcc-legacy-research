import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessLogicError } from "@/lib/business-logic/types";
import { hashSenha } from "./password";
import { autenticarUsuario, criarUsuario } from "./usuario";

const findManyMock = vi.fn();
const createMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usuario: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

beforeEach(() => {
  findManyMock.mockReset();
  createMock.mockReset();
  findUniqueMock.mockReset();
});

describe("criarUsuario", () => {
  it("gera o primeiro código para um grupo de iniciais novo", async () => {
    findManyMock.mockResolvedValue([]);
    createMock.mockImplementation(({ data }) =>
      Promise.resolve({ id: "id-1", codigo: data.codigo, senhaHash: data.senhaHash, ativo: true, createdAt: new Date() }),
    );

    const resultado = await criarUsuario("JS");

    expect(resultado.usuario.codigo).toBe("PJS-01");
    expect(resultado.senha).toHaveLength(10);
    expect(findManyMock).toHaveBeenCalledWith({
      where: { codigo: { startsWith: "PJS-" } },
      select: { codigo: true },
    });
  });

  it("incrementa o sequencial a partir do maior código já existente com as mesmas iniciais", async () => {
    findManyMock.mockResolvedValue([{ codigo: "PJS-01" }, { codigo: "PJS-05" }]);
    createMock.mockImplementation(({ data }) =>
      Promise.resolve({ id: "id-2", codigo: data.codigo, senhaHash: data.senhaHash, ativo: true, createdAt: new Date() }),
    );

    const resultado = await criarUsuario("js"); // minúsculas — deve normalizar

    expect(resultado.usuario.codigo).toBe("PJS-06");
  });

  it("mantém grupos de iniciais diferentes com sequenciais independentes", async () => {
    findManyMock.mockResolvedValue([]); // nenhum "PMTS-" existente, apesar de haver "PJS-*"
    createMock.mockImplementation(({ data }) =>
      Promise.resolve({ id: "id-3", codigo: data.codigo, senhaHash: data.senhaHash, ativo: true, createdAt: new Date() }),
    );

    const resultado = await criarUsuario("MTS");

    expect(resultado.usuario.codigo).toBe("PMTS-01");
  });

  it("rejeita iniciais vazias sem consultar o banco", async () => {
    await expect(criarUsuario("")).rejects.toThrow(BusinessLogicError);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("rejeita iniciais só com caracteres não alfabéticos", async () => {
    await expect(criarUsuario("123")).rejects.toThrow(BusinessLogicError);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});

describe("autenticarUsuario", () => {
  it("rejeita usuário inexistente", async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(autenticarUsuario("PJS-01", "senha123")).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita usuário inativo mesmo com senha correta", async () => {
    findUniqueMock.mockResolvedValue({
      id: "id-1",
      codigo: "PJS-01",
      senhaHash: hashSenha("senha123"),
      ativo: false,
    });
    await expect(autenticarUsuario("PJS-01", "senha123")).rejects.toThrow(BusinessLogicError);
  });

  it("rejeita senha incorreta", async () => {
    findUniqueMock.mockResolvedValue({
      id: "id-1",
      codigo: "PJS-01",
      senhaHash: hashSenha("senha123"),
      ativo: true,
    });
    await expect(autenticarUsuario("PJS-01", "senha-errada")).rejects.toThrow(BusinessLogicError);
  });

  it("autentica com código e senha corretos de um usuário ativo", async () => {
    findUniqueMock.mockResolvedValue({
      id: "id-1",
      codigo: "PJS-01",
      senhaHash: hashSenha("senha123"),
      ativo: true,
    });
    const usuario = await autenticarUsuario("PJS-01", "senha123");
    expect(usuario).toEqual({ id: "id-1", codigo: "PJS-01" });
  });
});
