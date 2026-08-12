// Quantidades ficam como texto no estado da UI (não number) para distinguir
// "campo vazio" de "campo preenchido com zero" até o momento do submit.
export interface ItemConferenciaA {
  codigo: string;
  descricao: string;
  qtdPedidaTexto: string;
  qtdRecebidaTexto: string;
  unidade: string;
}

export interface ErroApi {
  campo: string;
  mensagem: string;
}
