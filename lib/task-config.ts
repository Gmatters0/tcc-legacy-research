export const CENARIOS = [
  { value: "A", label: "Cenário A — Interface Legada" },
  { value: "B", label: "Cenário B — Interface Moderna" },
] as const;

export const CONJUNTOS_TAREFA = [
  { value: "conjunto-1", label: "Conjunto de Tarefas 1" },
  { value: "conjunto-2", label: "Conjunto de Tarefas 2" },
] as const;

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
