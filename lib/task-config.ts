export const CENARIOS = [
  { value: "A", label: "Cenário A — Interface Legada" },
  { value: "B", label: "Cenário B — Interface Moderna" },
] as const;

export const CONJUNTOS_TAREFA = [
  { value: "conjunto-1", label: "Conjunto de Tarefas 1" },
  { value: "conjunto-2", label: "Conjunto de Tarefas 2" },
] as const;

export interface ItemTarefa {
  codigo: string;
  descricao: string;
  unidade: string;
  qtdPedida: number;
  qtdRecebida: number;
}

// Dados-fonte que o participante digita no sistema (o equivalente à nota
// fiscal em papel) — exibidos num painel fixo durante os dois cenários
// (app/components/PainelTarefa.tsx), idênticos em A e B. A divergência
// proposital (qtdRecebida ≠ qtdPedida) NÃO é destacada para o participante.
export interface DadosTarefa {
  numeroNf: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: string;
  itens: ItemTarefa[];
  deposito: Armazem;
  lote: string;
  instrucao: string;
}

export const DADOS_TAREFA: Record<string, DadosTarefa> = {
  "conjunto-1": {
    numeroNf: "4052",
    fornecedor: "Comercial Andrade Ltda",
    dataEmissao: "05.03.2026",
    valorTotal: "R$ 8.640,00",
    itens: [
      { codigo: "PAR-1042", descricao: "Parafuso Sextavado M8", unidade: "UN", qtdPedida: 500, qtdRecebida: 500 },
      { codigo: "CAB-2210", descricao: "Cabo Flexível 2,5mm", unidade: "MT", qtdPedida: 300, qtdRecebida: 280 },
      { codigo: "LUV-3305", descricao: "Luva de Proteção Nitrílica", unidade: "PAR", qtdPedida: 150, qtdRecebida: 150 },
    ],
    deposito: { codigo: "D01", nome: "Depósito Central" },
    lote: "Lote de Estoque A",
    instrucao:
      "Dê entrada na Nota Fiscal nº 4052, do fornecedor Comercial Andrade Ltda, confira os 3 itens recebidos na tabela e finalize o lançamento no Lote de Estoque A. Avise quando concluir.",
  },
  "conjunto-2": {
    numeroNf: "7183",
    fornecedor: "Metalúrgica Vitória S.A.",
    dataEmissao: "12.03.2026",
    valorTotal: "R$ 11.275,00",
    itens: [
      { codigo: "ROL-5510", descricao: "Rolamento Esférico 6204", unidade: "UN", qtdPedida: 200, qtdRecebida: 200 },
      { codigo: "FIT-8820", descricao: "Fita Isolante Preta 20m", unidade: "MT", qtdPedida: 400, qtdRecebida: 370 },
      { codigo: "CHV-1190", descricao: "Chave de Fenda Phillips", unidade: "UN", qtdPedida: 120, qtdRecebida: 120 },
    ],
    deposito: { codigo: "D02", nome: "Depósito Filial Norte" },
    lote: "Lote de Estoque B",
    instrucao:
      "Dê entrada na Nota Fiscal nº 7183, do fornecedor Metalúrgica Vitória S.A., confira os 3 itens recebidos na tabela e finalize o lançamento no Lote de Estoque B. Avise quando concluir.",
  },
};

export const PERFIS_USUARIO = [
  { value: "TECNICO", label: "Técnico (familiaridade com ERPs)" },
  { value: "NAO_TECNICO", label: "Não técnico" },
] as const;

export interface Armazem {
  codigo: string;
  nome: string;
}

// Depósitos existentes — mesma lista nos dois cenários (Cenário B usa como
// opções do <select>; Cenário A usa como opções do modal de busca do campo
// "Dep. Destino"). Cadastro real de depósitos entra depois via seed/fixture.
export const ARMAZENS_DISPONIVEIS: Armazem[] = [
  { codigo: "D01", nome: "Depósito Central" },
  { codigo: "D02", nome: "Depósito Filial Norte" },
  { codigo: "D03", nome: "Depósito Filial Sul" },
];
