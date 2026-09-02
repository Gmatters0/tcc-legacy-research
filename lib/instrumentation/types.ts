export enum TipoEventoErro {
  CLIQUE_FORA_FLUXO = "CLIQUE_FORA_FLUXO",
  INPUT_OBRIGATORIO_VAZIO = "INPUT_OBRIGATORIO_VAZIO",
  ERRO_VALIDACAO_CAMPO = "ERRO_VALIDACAO_CAMPO",
  ERRO_LOGICO_CADASTRO = "ERRO_LOGICO_CADASTRO",
}

export type Cenario = "A" | "B";

export type PerfilUsuario = "TECNICO" | "NAO_TECNICO";

export interface SessaoTeste {
  id: string;
  usuarioId: string;
  perfilUsuario: PerfilUsuario;
  cenario: string;
  conjuntoTarefa: string;
  timestampInicio: string;
  timestampFim: string | null;
}
