export interface LinhaRelatorioAdmin {
  sessaoId: string;
  usuarioCodigo: string;
  perfilUsuario: string;
  cenario: string;
  conjuntoTarefa: string;
  timestampInicio: string;
  timestampFim: string | null;
  duracaoSegundos: number | null;
  totalEventosErro: number;
  eventosPorTipo: Record<string, number>;
}

export interface UsuarioAdmin {
  id: string;
  codigo: string;
  ativo: boolean;
  createdAt: string;
  historico: {
    cenariosConcluidos: string[];
    conjuntosTarefaConcluidos: string[];
  };
}
