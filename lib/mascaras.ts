// Máscaras de entrada compartilhadas pelos dois cenários (UI apenas — a API
// sempre recebe número/ISO já convertido).

// Só dígitos, formatados como centavos com milhar (padrão BR): "123456" →
// "1.234,56". O usuário nunca precisa digitar ponto nem vírgula.
export function aplicarMascaraMoeda(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, "");
  if (!digitos) return "";
  const numero = Number(digitos) / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Só dígitos, com os pontos inseridos sozinhos (DD.MM.AAAA) — evita
// separador errado, ano com 2 dígitos ou espaço sobrando.
export function aplicarMascaraData(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, "").slice(0, 8);
  if (digitos.length > 4) return `${digitos.slice(0, 2)}.${digitos.slice(2, 4)}.${digitos.slice(4)}`;
  if (digitos.length > 2) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  return digitos;
}
