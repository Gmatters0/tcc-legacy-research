// Converte o texto livre do campo "Valor Total" do Cenário A em número, aceitando
// as formas que um usuário brasileiro realmente digita: "1234,56", "1.234,56",
// "R$ 1.234,56", "1234.56". Vazio vira undefined (a API distingue "vazio" de
// "inválido"); texto que não é número vira NaN e é recusado pela API como
// qualquer outro valor inválido.
//
// Ambiguidade assumida: ponto sem vírgula só é tratado como milhar quando
// forma grupos de exatamente 3 dígitos ("1.234" = 1234, "10.5" = 10,5).
export function paraValorMonetario(texto: string): number | undefined {
  const limpo = texto.replace(/R\$|\s/g, "");
  if (limpo === "") return undefined;

  const ultimaVirgula = limpo.lastIndexOf(",");
  const ultimoPonto = limpo.lastIndexOf(".");

  if (ultimaVirgula > ultimoPonto) {
    return Number(limpo.replace(/\./g, "").replace(",", "."));
  }
  if (ultimaVirgula !== -1) {
    return Number(limpo.replace(/,/g, ""));
  }
  if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) {
    return Number(limpo.replace(/\./g, ""));
  }
  return Number(limpo);
}
