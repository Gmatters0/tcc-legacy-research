// Conteúdo dos três instrumentos aplicados automaticamente ao final de cada
// cenário (ver app/sucesso). Único lugar onde o texto das perguntas vive —
// tanto a UI quanto lib/business-logic/avaliacao.ts (contagem de itens)
// dependem daqui.

// SUS — tradução e adaptação transcultural validada para português do
// Brasil: Lourenço, D. F., Carmona, E. V., & Lopes, M. H. B. M. (2022).
// Translation and Cross-Cultural Adaptation of the System Usability Scale
// to Brazilian Portuguese. Aquichan, 22(2), e2228.
// https://doi.org/10.5294/aqui.2022.22.2.8 — alfa de Cronbach = 0,76.
export const SUS_ITENS: string[] = [
  "Eu acho que gostaria de usar esse sistema frequentemente.",
  "Eu achei esse sistema desnecessariamente complexo.",
  "Eu achei esse sistema fácil de usar.",
  "Eu achei que precisaria de ajuda de uma pessoa técnica para ser capaz de usar esse sistema.",
  "Eu achei que as várias funções desse sistema foram bem integradas.",
  "Eu acho que o sistema apresenta muita inconsistência.",
  "Eu imagino que a maioria das pessoas pode aprender a usar esse sistema rapidamente.",
  "Eu achei esse sistema muito pesado (incômodo) para usar.",
  "Eu me senti muito seguro(a) usando o sistema.",
  "Eu precisei aprender muitas coisas antes que pudesse utilizar esse sistema.",
];

// Escala subjetiva própria (10 itens) — complementa SUS/TLX em pontos que
// eles não cobrem diretamente (clareza de erro, confiança, adoção).
export const SUBJETIVO_ITENS: string[] = [
  "Os erros que cometi foram fáceis de perceber e corrigir.",
  "Eu me senti confiante durante toda a tarefa.",
  "As mensagens do sistema me ajudaram a entender o que fazer a seguir.",
  "Encontrei rapidamente as informações e campos que eu precisava.",
  "A aparência visual da interface transmitiu profissionalismo e organização.",
  "Eu usaria esse sistema no meu dia a dia de trabalho, se fosse necessário.",
  "Em algum momento me senti perdido(a) ou sem saber o que fazer.",
  "Eu me senti no controle da tarefa o tempo todo.",
  "Recomendaria esse sistema para um colega que fizesse esse mesmo trabalho.",
  "No geral, a experiência de uso foi agradável.",
];

export type TlxChave = "mental" | "fisica" | "temporal" | "desempenho" | "esforco" | "frustracao";

export interface TlxItem {
  chave: TlxChave;
  titulo: string;
  descricao: string;
  rotuloEsquerda: string;
  rotuloDireita: string;
}

// NASA-TLX (Raw/sem ponderação por pares — Hart, 2006) — tradução própria
// das 6 descrições originais de Hart & Staveland (1988). Diferente do SUS,
// não existe uma adaptação transcultural formal única para português do
// Brasil (é uma ferramenta aberta da NASA, cada grupo traduz por conta
// própria); registrar isso na metodologia do TCC.
export const TLX_ITENS: TlxItem[] = [
  {
    chave: "mental",
    titulo: "Demanda Mental",
    descricao:
      "Quanto trabalho mental e perceptivo a tarefa exigiu (pensar, decidir, calcular, lembrar, procurar, etc.)?",
    rotuloEsquerda: "Baixa",
    rotuloDireita: "Alta",
  },
  {
    chave: "fisica",
    titulo: "Demanda Física",
    descricao: "Quanto trabalho físico a tarefa exigiu?",
    rotuloEsquerda: "Baixa",
    rotuloDireita: "Alta",
  },
  {
    chave: "temporal",
    titulo: "Demanda Temporal",
    descricao: "Quão apressado(a) ou acelerado(a) foi o ritmo da tarefa?",
    rotuloEsquerda: "Baixa",
    rotuloDireita: "Alta",
  },
  {
    chave: "desempenho",
    titulo: "Desempenho",
    descricao: "Quão bem-sucedido(a) você foi em realizar o que a tarefa pedia?",
    rotuloEsquerda: "Bom",
    rotuloDireita: "Ruim",
  },
  {
    chave: "esforco",
    titulo: "Esforço",
    descricao: "Quanto você teve que se esforçar (mental e fisicamente) para atingir esse nível de desempenho?",
    rotuloEsquerda: "Baixo",
    rotuloDireita: "Alto",
  },
  {
    chave: "frustracao",
    titulo: "Frustração",
    descricao: "Quão inseguro(a), desanimado(a), irritado(a), estressado(a) ou incomodado(a) você se sentiu?",
    rotuloEsquerda: "Baixa",
    rotuloDireita: "Alta",
  },
];

// Fórmula padrão de pontuação do SUS: itens ímpares (posição 1-based) usam
// (valor - 1), itens pares usam (5 - valor); soma × 2,5 → 0-100.
export function calcularSusScore(respostas: number[]): number {
  const soma = respostas.reduce((acc, valor, indice) => acc + (indice % 2 === 0 ? valor - 1 : 5 - valor), 0);
  return soma * 2.5;
}

// Raw TLX (RTLX, Hart 2006): média simples das 6 dimensões, sem ponderação
// por pares — a diferença para o TLX completo é só essa (não muda a escala
// nem exige inverter nenhuma dimensão). "Desempenho" já é rotulada Bom→Ruim
// (não Ruim→Bom) especificamente pra ficar na mesma direção das outras 5
// (0 = melhor experiência, 100 = pior) — por isso a média direta já é
// semanticamente correta, sem tratamento especial.
export function calcularTlxScore(respostas: Record<TlxChave, number>): number {
  const valores = Object.values(respostas);
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}
