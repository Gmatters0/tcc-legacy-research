import { describe, expect, it } from "vitest";
import { classificarTipoErroPorMensagem } from "./erros";
import { TipoEventoErro } from "./types";

describe("classificarTipoErroPorMensagem", () => {
  it("classifica mensagem de campo obrigatório como INPUT_OBRIGATORIO_VAZIO", () => {
    expect(classificarTipoErroPorMensagem("Número da NF é obrigatório.")).toBe(
      TipoEventoErro.INPUT_OBRIGATORIO_VAZIO,
    );
  });

  it("é case-insensitive para a palavra 'obrigat'", () => {
    expect(classificarTipoErroPorMensagem("CAMPO OBRIGATÓRIO.")).toBe(TipoEventoErro.INPUT_OBRIGATORIO_VAZIO);
  });

  it("classifica qualquer outra mensagem como ERRO_VALIDACAO_CAMPO", () => {
    expect(classificarTipoErroPorMensagem("Valor total não pode ser negativo.")).toBe(
      TipoEventoErro.ERRO_VALIDACAO_CAMPO,
    );
  });

  it("classifica mensagem de duplicidade como ERRO_VALIDACAO_CAMPO", () => {
    expect(classificarTipoErroPorMensagem("Já existe uma nota fiscal cadastrada com este número.")).toBe(
      TipoEventoErro.ERRO_VALIDACAO_CAMPO,
    );
  });
});
