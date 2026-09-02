export interface ErroCampo {
  campo: string;
  mensagem: string;
}

export class BusinessLogicError extends Error {
  erros: ErroCampo[];

  constructor(erros: ErroCampo[]) {
    super(erros.map((e) => `${e.campo}: ${e.mensagem}`).join("; "));
    this.name = "BusinessLogicError";
    this.erros = erros;
  }
}

export interface NotaFiscalInput {
  numero: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: number;
}

export interface ItemConferenciaInput {
  codigo: string;
  descricao: string;
  qtdPedida: number;
  qtdRecebida: number;
  unidade: string;
}

export interface BaixaInput {
  armazem: string;
  lote: string;
  quantidade: number;
}

export interface DivergenciaItem {
  codigo: string;
  divergente: boolean;
  diferenca: number;
}
