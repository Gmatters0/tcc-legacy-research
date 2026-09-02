import { prisma } from "@/lib/prisma";
import { BusinessLogicError, ErroCampo } from "./types";
import type { UsuarioPublico } from "@/lib/auth/types";

// Regra de não-repetição: cada Usuario pode concluir o teste no máximo uma vez
// por cenário e uma vez por conjunto de tarefa — usada tanto para pré-selecionar
// e bloquear opções já usadas na home quanto para rejeitar no servidor uma
// tentativa de repetir (nunca confiar só na trava do client).
export interface HistoricoParticipacao {
  cenariosConcluidos: string[];
  conjuntosTarefaConcluidos: string[];
}

export interface UsuarioComHistorico extends UsuarioPublico, HistoricoParticipacao {}

export async function buscarHistoricoParticipacao(usuarioId: string): Promise<HistoricoParticipacao> {
  const sessoes = await prisma.sessaoTeste.findMany({
    where: { usuarioId, timestampFim: { not: null } },
    select: { cenario: true, conjuntoTarefa: true },
  });

  return {
    cenariosConcluidos: [...new Set(sessoes.map((s) => s.cenario))],
    conjuntosTarefaConcluidos: [...new Set(sessoes.map((s) => s.conjuntoTarefa))],
  };
}

export function validarElegibilidade(
  cenario: string,
  conjuntoTarefa: string,
  historico: HistoricoParticipacao,
): void {
  const erros: ErroCampo[] = [];
  if (historico.cenariosConcluidos.includes(cenario)) {
    erros.push({ campo: "cenario", mensagem: "Você já concluiu o teste neste cenário." });
  }
  if (historico.conjuntosTarefaConcluidos.includes(conjuntoTarefa)) {
    erros.push({ campo: "conjuntoTarefa", mensagem: "Você já concluiu o teste com este conjunto de tarefa." });
  }
  if (erros.length) throw new BusinessLogicError(erros);
}
