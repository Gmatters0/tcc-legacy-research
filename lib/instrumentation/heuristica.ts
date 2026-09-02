const PADRAO_CODIGO_ARMAZEM = /^[A-Za-z]\d{2}$/;

/**
 * Heurística de instrumentação: detecta um dado tecnicamente aceito (ambos os
 * campos são strings livres) mas semanticamente incoerente — o valor do
 * armazém parece, na verdade, um código de lote, sugerindo que os campos
 * foram trocados. Não bloqueia o cadastro, só sinaliza ERRO_LOGICO_CADASTRO.
 */
export function pareceCampoTrocado(armazem: string, lote: string): boolean {
  return !PADRAO_CODIGO_ARMAZEM.test(armazem.trim()) && PADRAO_CODIGO_ARMAZEM.test(lote.trim());
}

/**
 * Heurística equivalente para o Cenário B: Número da NF e Fornecedor não são
 * simétricos como armazem/lote (Número da NF já tem validação rígida — só
 * dígitos — então não pode fisicamente "parecer" um nome de fornecedor). O
 * único sinal possível sem alterar essa regra de negócio é o inverso:
 * Fornecedor preenchido só com dígitos, no mesmo padrão do Número da NF.
 */
export function fornecedorPareceNumeroNota(fornecedor: string): boolean {
  return /^\d+$/.test(fornecedor.trim());
}
