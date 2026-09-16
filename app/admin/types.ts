export interface AvaliacaoAdmin {
  tlxMental: number;
  tlxFisica: number;
  tlxTemporal: number;
  tlxDesempenho: number;
  tlxEsforco: number;
  tlxFrustracao: number;
  tlxScore: number;
  susQ1: number;
  susQ2: number;
  susQ3: number;
  susQ4: number;
  susQ5: number;
  susQ6: number;
  susQ7: number;
  susQ8: number;
  susQ9: number;
  susQ10: number;
  susScore: number;
  subjQ1: number;
  subjQ2: number;
  subjQ3: number;
  subjQ4: number;
  subjQ5: number;
  subjQ6: number;
  subjQ7: number;
  subjQ8: number;
  subjQ9: number;
  subjQ10: number;
}

export interface ComparacaoFinalAdmin {
  preferencia: string;
  porque: string;
  feedback: string | null;
}

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
  avaliacao: AvaliacaoAdmin | null;
  comparacaoFinal: ComparacaoFinalAdmin | null;
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
