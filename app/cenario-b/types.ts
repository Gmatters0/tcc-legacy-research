export interface NotaFiscalResumo {
  id: string;
  numero: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: number;
}

// Estado dos três passos vive em CenarioBApp.tsx (elevado, não em cada Passo)
// para sobreviver à navegação para trás/frente pelo Stepper — cada Passo é
// renderizado condicionalmente e desmontaria (perdendo state local) toda vez
// que o participante saísse dele. É sobre persistência ao navegar dentro do
// fluxo — reload continua limpando tudo (nenhum uso de sessionStorage aqui).
export interface FormValidacao {
  numero: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: string;
}

export interface ItemConferencia {
  codigo: string;
  descricao: string;
  qtdPedidaTexto: string;
  qtdRecebidaTexto: string;
  unidade: string;
}

export interface FormBaixa {
  armazem: string;
  lote: string;
  quantidade: string;
}
