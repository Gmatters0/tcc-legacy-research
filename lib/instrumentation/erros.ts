import { TipoEventoErro } from "./types";

export interface RegistrarErroInput {
  sessaoId: string;
  tipo: TipoEventoErro;
  detalhe?: string;
}

// Classifica uma mensagem de erro estruturado vinda da API business-logic
// (`{ campo, mensagem }`) no tipo de evento correspondente — usado nos dois
// cenários para que toda resposta de erro da API vire um registrarErro().
export function classificarTipoErroPorMensagem(mensagem: string): TipoEventoErro {
  return /obrigat/i.test(mensagem) ? TipoEventoErro.INPUT_OBRIGATORIO_VAZIO : TipoEventoErro.ERRO_VALIDACAO_CAMPO;
}

export async function registrarErro({ sessaoId, tipo, detalhe }: RegistrarErroInput): Promise<void> {
  try {
    await fetch("/api/eventos-erro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessaoId, tipo, detalhe }),
    });
  } catch {
    // instrumentação nunca deve interromper o fluxo da tarefa do participante
  }
}
